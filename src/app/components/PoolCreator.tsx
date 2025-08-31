"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  BaseFeeMode,
  DynamicBondingCurveClient,
  buildCurve,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { BN } from "bn.js";

interface PoolCreationResult {
  configAddress: string;
  poolAddress?: string;
  poolTransactionSignature?: string;
  configTransactionSignature: string;
  error?: string;
}

export default function PoolCreator() {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration errors by not rendering until mounted
  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Initializing wallet connection
          </p>
        </div>
      </div>
    );
  }

  return <PoolCreatorContent />;
}

function PoolCreatorContent() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [network, setNetwork] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Devnet);
  const [formData, setFormData] = useState({
    tokenName: "",
    tokenSymbol: "",
    metadataUri: "",
    migrationQuoteThreshold: 15,
  });
  const [isCreatingConfig, setIsCreatingConfig] = useState(false);
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [result, setResult] = useState<PoolCreationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createConfig = async () => {
    if (!connected || !publicKey || !signTransaction) {
      alert("Please connect your wallet first!");
      return null;
    }

    setIsCreatingConfig(true);
    setError(null);

    try {
      // Create connection based on selected network
      const rpcEndpoint = clusterApiUrl(network);
      const networkConnection = new Connection(rpcEndpoint, "confirmed");
      const client = new DynamicBondingCurveClient(networkConnection, "confirmed");

      // Generate config keypair
      const config = Keypair.generate();
      console.log("Created config:", config.publicKey.toBase58());

      // Build the curve configuration
      const curveConfig = buildCurve({
        totalTokenSupply: 1000000000, // 1B tokens
        percentageSupplyOnMigration: 10,
        migrationQuoteThreshold: formData.migrationQuoteThreshold,
        migrationOption: 1, // Option 1: DAMM V2
        tokenBaseDecimal: 9,
        tokenQuoteDecimal: 9,
        lockedVestingParam: {
          totalLockedVestingAmount: 0,
          numberOfVestingPeriod: 0,
          cliffUnlockAmount: 0,
          totalVestingDuration: 0,
          cliffDurationFromMigrationTime: 0,
        },
        baseFeeParams: {
          baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
          feeSchedulerParam: {
            startingFeeBps: 100,
            endingFeeBps: 100,
            numberOfPeriod: 0,
            totalDuration: 0,
          },
        },
        dynamicFeeEnabled: true,
        activationType: 0,
        collectFeeMode: 0,
        migrationFeeOption: 3,
        tokenType: 1,
        partnerLpPercentage: 0,
        creatorLpPercentage: 0,
        partnerLockedLpPercentage: 50,
        creatorLockedLpPercentage: 50,
        creatorTradingFeePercentage: 1,
        leftover: 0,
        tokenUpdateAuthority: 1,
        migrationFee: {
          feePercentage: 0,
          creatorFeePercentage: 0,
        },
      });

      const configSetup = await client.partner.createConfig({
        config: config.publicKey,
        feeClaimer: new PublicKey("FG75GTSYMimybJUBEcu6LkcNqm7fkga1iMp3v4nKnDQS"),
        leftoverReceiver: new PublicKey("5bZfRPFa9Z1SuNQbL1Rc7mufz6Xc4CDDhndGCd2oXG97"),
        payer: publicKey,
        quoteMint: new PublicKey("So11111111111111111111111111111111111111112"),
        ...curveConfig,
      });

      // Get the latest blockhash
      const { blockhash } = await networkConnection.getLatestBlockhash("confirmed");
      configSetup.recentBlockhash = blockhash;
      configSetup.feePayer = publicKey;

      // Sign the transaction with the config keypair
      configSetup.partialSign(config);

      // Sign with wallet
      const signedTransaction = await signTransaction(configSetup);

      // Send and confirm the transaction
      const signature = await networkConnection.sendRawTransaction(
        signedTransaction.serialize()
      );
      await networkConnection.confirmTransaction(signature, "confirmed");

      console.log("Config created successfully!");
      const clusterParam = network === WalletAdapterNetwork.Mainnet ? "" : "?cluster=devnet";
      console.log(`Transaction: https://solscan.io/tx/${signature}${clusterParam}`);
      console.log(`Config address: ${config.publicKey.toString()}`);


      return {
        configAddress: config.publicKey.toString(),
        configTransactionSignature: signature,
      };
    } catch (error) {
      console.error("Error creating config:", error);
      setError(error instanceof Error ? error.message : "Failed to create config");
      return null;
    } finally {
      setIsCreatingConfig(false);
    }
  };

  const createPool = async (configAddress: string) => {
    if (!connected || !publicKey || !signTransaction) {
      alert("Please connect your wallet first!");
      return null;
    }

    setIsCreatingPool(true);
    setError(null);

    try {
      // Create connection based on selected network
      const rpcEndpoint = clusterApiUrl(network);
      const networkConnection = new Connection(rpcEndpoint, "confirmed");
      const client = new DynamicBondingCurveClient(networkConnection, "confirmed");
      const baseMint = Keypair.generate();

      console.log(`Generated base mint: ${baseMint.publicKey.toString()}`);

      const createPoolParam = {
        baseMint: baseMint.publicKey,
        config: new PublicKey(configAddress),
        name: formData.tokenName,
        symbol: formData.tokenSymbol,
        uri: formData.metadataUri,
        payer: publicKey,
        poolCreator: publicKey,
      };

      console.log("Creating pool transaction...");
      const poolTransaction = await client.pool.createPool(createPoolParam);

      // Get the latest blockhash
      const { blockhash } = await networkConnection.getLatestBlockhash("confirmed");
      poolTransaction.recentBlockhash = blockhash;
      poolTransaction.feePayer = publicKey;

      // Sign the transaction with the baseMint keypair
      poolTransaction.partialSign(baseMint);

      // Sign with wallet
      const signedTransaction = await signTransaction(poolTransaction);

      // Send and confirm the transaction
      const signature = await networkConnection.sendRawTransaction(
        signedTransaction.serialize()
      );
      await networkConnection.confirmTransaction(signature, "confirmed");

      console.log("Pool created successfully!");
      const clusterParam = network === WalletAdapterNetwork.Mainnet ? "" : "?cluster=devnet";
      console.log(`Pool created: https://solscan.io/tx/${signature}${clusterParam}`);

      // Get pool address after creation
      let poolAddress = "";
      try {
        const pools = await client.state.getPoolsByConfig(new PublicKey(configAddress));
        if (pools.length > 0) {
          poolAddress = pools[0].publicKey.toBase58();
          console.log("Pool Address:", poolAddress);
        }
      } catch (error) {
        console.warn("Could not fetch pool address:", error);
      }

      return { signature, poolAddress };
    } catch (error) {
      console.error("Error creating pool:", error);
      setError(error instanceof Error ? error.message : "Failed to create pool");
      return null;
    } finally {
      setIsCreatingPool(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      alert("Please connect your wallet first!");
      return;
    }

    setResult(null);
    setError(null);

    // Always create config first
    const configResult = await createConfig();
    if (!configResult) {
      return; // Error handled in createConfig
    }
    const configAddress = configResult.configAddress;
    const configTransactionSignature = configResult.configTransactionSignature;

    // Create pool
    const poolResult = await createPool(configAddress);
    if (!poolResult) {
      return; // Error handled in createPool
    }

    setResult({
      configAddress,
      poolAddress: poolResult.poolAddress,
      poolTransactionSignature: poolResult.signature,
      configTransactionSignature,
    });
  };

  if (!connected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Wallet Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your Phantom wallet to create bonding curve pools
          </p>
          <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-pink-600 !text-white !px-6 !py-3 !rounded-xl !font-medium hover:!from-purple-700 hover:!to-pink-700 transition-all duration-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create Bonding Curve Pool
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Launch your token with a bonding curve mechanism on Solana
        </p>
        
        {/* Network Toggle */}
        <div className="mt-4 mb-4">
          <div className="flex justify-center items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Network:</span>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setNetwork(WalletAdapterNetwork.Devnet)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  network === WalletAdapterNetwork.Devnet
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Devnet
              </button>
              <button
                type="button"
                onClick={() => setNetwork(WalletAdapterNetwork.Mainnet)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  network === WalletAdapterNetwork.Mainnet
                    ? "bg-green-500 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Mainnet
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !text-white !px-4 !py-2 !rounded-lg !font-medium" />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <span className="text-xl">❌</span>
            <span className="font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
              Pool Created Successfully!
            </h3>
            <p className="text-green-700 dark:text-green-300">
              Your bonding curve pool has been deployed on Solana
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-green-700 dark:text-green-300 font-medium block mb-1">
                Config Address:
              </span>
              <span className="font-mono text-green-800 dark:text-green-200 text-xs bg-green-100 dark:bg-green-800/20 p-2 rounded block break-all">
                {result.configAddress}
              </span>
            </div>

            {result.poolAddress && (
              <div>
                <span className="text-green-700 dark:text-green-300 font-medium block mb-1">
                  Pool Address:
                </span>
                <span className="font-mono text-green-800 dark:text-green-200 text-xs bg-green-100 dark:bg-green-800/20 p-2 rounded block break-all">
                  {result.poolAddress}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.configTransactionSignature && (
                <a
                  href={`https://solscan.io/tx/${result.configTransactionSignature}${
                    network === WalletAdapterNetwork.Mainnet ? "" : "?cluster=devnet"
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Config Transaction
                </a>
              )}
              {result.poolTransactionSignature && (
                <a
                  href={`https://solscan.io/tx/${result.poolTransactionSignature}${
                    network === WalletAdapterNetwork.Mainnet ? "" : "?cluster=devnet"
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Pool Transaction
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Name *
            </label>
            <input
              type="text"
              name="tokenName"
              value={formData.tokenName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300"
              placeholder="e.g., SOU_POOL"
              required
            />
          </div>

          {/* Token Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Symbol *
            </label>
            <input
              type="text"
              name="tokenSymbol"
              value={formData.tokenSymbol}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300"
              placeholder="e.g., SOU"
              maxLength={10}
              required
            />
          </div>
        </div>

        {/* Metadata URI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Metadata URI *
          </label>
          <input
            type="url"
            name="metadataUri"
            value={formData.metadataUri}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300"
            placeholder="https://raw.githubusercontent.com/soumalya340/Raw_Data/refs/heads/main/raw_uri"
            required
          />
        </div>

        {/* Migration Quote Threshold */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Migration Quote Threshold *
          </label>
          <input
            type="number"
            name="migrationQuoteThreshold"
            value={formData.migrationQuoteThreshold}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-300"
            placeholder="15"
            min="1"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            The threshold for migration to occur
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isCreatingConfig || isCreatingPool}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isCreatingConfig ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Config...
              </div>
            ) : isCreatingPool ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Pool...
              </div>
            ) : (
              "🚀 Create Pool"
            )}
          </button>
        </div>
      </form>

      {/* Info Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="text-purple-600">💡</span>
          Frontend Integration
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            • <strong>Phantom Wallet:</strong> This form integrates directly with Phantom wallet
          </p>
          <p>
            • <strong>Frontend-Only:</strong> Creates both config and pool using frontend code
          </p>
          <p>
            • <strong>Transaction Tracking:</strong> Get Solscan links for all transactions
          </p>
          <p>
            • <strong>Automatic Config:</strong> Creates config automatically if not provided
          </p>
        </div>
      </div>
    </div>
  );
}
