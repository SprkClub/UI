"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import confetti from 'canvas-confetti';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  SendTransactionError,
} from "@solana/web3.js";
import {
  BaseFeeMode,
  DynamicBondingCurveClient,
  buildCurve,
} from "@meteora-ag/dynamic-bonding-curve-sdk";

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
  const [network, setNetwork] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Devnet);
  const [formData, setFormData] = useState({
    tokenName: "",
    tokenSymbol: "",
    description: "",
    externalUrl: "",
    migrationQuoteThreshold: 15,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [generatedMetadataUri, setGeneratedMetadataUri] = useState<string>("");
  const [isCreatingConfig, setIsCreatingConfig] = useState(false);
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [result, setResult] = useState<PoolCreationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerConfetti = () => {
    // Multiple confetti bursts
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#d7e728', '#a855f7', '#3b82f6', '#10b981']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#d7e728', '#a855f7', '#3b82f6', '#10b981']
      });
    }, 250);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    console.log('Uploading to Cloudinary...');
    console.log('Cloud name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
    console.log('Upload preset:', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    
    // Add additional parameters for better compatibility
    formData.append('folder', 'sparkclub'); // Optional: organize uploads in a folder
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const data = await response.json();
    console.log('Cloudinary response:', data);
    
    if (!response.ok) {
      console.error('Cloudinary upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: data.error,
        message: data.message
      });
      throw new Error(data.error?.message || data.message || 'Failed to upload image to Cloudinary');
    }
    
    console.log('Upload successful, URL:', data.secure_url);
    return data.secure_url;
  };

  const generateMetadata = async () => {
    try {
      let imageUrl = "";
      
      // Upload image to Cloudinary if provided
      if (selectedImage) {
        try {
          imageUrl = await uploadToCloudinary(selectedImage);
        } catch (uploadError) {
          console.warn('Image upload failed, proceeding without image:', uploadError);
          // Continue without image for now
        }
      }
      
      // Generate metadata object
      const metadata = {
        name: formData.tokenName,
        description: formData.description,
        image: imageUrl,
        external_url: formData.externalUrl || "",
        attributes: []
      };

      // For now, create a simple metadata URI (in production, use IPFS or proper storage)
      const metadataUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      setGeneratedMetadataUri(metadataUri);
      return metadataUri;
    } catch (error) {
      console.error('Error generating metadata:', error);
      setError(`Failed to generate metadata: ${error}`);
      return null;
    }
  };

  const saveTokenToDatabase = async (tokenData: PoolCreationResult) => {
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tokenData,
          userWallet: publicKey?.toBase58(),
          createdAt: new Date().toISOString(),
          network: network,
          metadata: {
            name: formData.tokenName,
            symbol: formData.tokenSymbol,
            description: formData.description,
            image: imagePreview,
            externalUrl: formData.externalUrl,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save token data');
      }

      console.log('Token data saved to database');
    } catch (error) {
      console.error('Error saving to database:', error);
    }
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
      
      let errorMessage = "Failed to create config";
      if (error instanceof SendTransactionError) {
        try {
          const rpcEndpoint = clusterApiUrl(network);
          const connection = new Connection(rpcEndpoint, "confirmed");
          const logs = await error.getLogs(connection);
          console.error("Transaction logs:", logs);
        } catch (logError) {
          console.error("Could not fetch transaction logs:", logError);
        }
        if (error.message.includes("no record of a prior credit")) {
          errorMessage = "Insufficient SOL balance. Please add SOL to your wallet to cover transaction fees and account creation costs.";
        } else {
          errorMessage = `Transaction failed: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
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
        uri: generatedMetadataUri,
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
      
      let errorMessage = "Failed to create pool";
      if (error instanceof SendTransactionError) {
        try {
          const rpcEndpoint = clusterApiUrl(network);
          const connection = new Connection(rpcEndpoint, "confirmed");
          const logs = await error.getLogs(connection);
          console.error("Transaction logs:", logs);
        } catch (logError) {
          console.error("Could not fetch transaction logs:", logError);
        }
        if (error.message.includes("no record of a prior credit")) {
          errorMessage = "Insufficient SOL balance. Please add SOL to your wallet to cover transaction fees and account creation costs.";
        } else {
          errorMessage = `Transaction failed: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsCreatingPool(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      setError("Please connect your wallet first!");
      return;
    }

    // Basic form validation
    if (!formData.tokenName.trim()) {
      setError("Token name is required");
      return;
    }
    if (!formData.tokenSymbol.trim()) {
      setError("Token symbol is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Token description is required");
      return;
    }

    setResult(null);
    setError(null);

    try {
      console.log("Starting token creation process...");
      
      // Generate metadata first
      console.log("Generating metadata...");
      const metadataUri = await generateMetadata();
      if (!metadataUri) {
        return; // Error handled in generateMetadata
      }
      console.log("Metadata generated:", metadataUri.substring(0, 100) + "...");

      // Always create config first
      console.log("Creating config...");
      const configResult = await createConfig();
      if (!configResult) {
        return; // Error handled in createConfig
      }
      console.log("Config created:", configResult.configAddress);
      const configAddress = configResult.configAddress;
      const configTransactionSignature = configResult.configTransactionSignature;

      // Create pool
      console.log("Creating pool...");
      const poolResult = await createPool(configAddress);
      if (!poolResult) {
        return; // Error handled in createPool
      }
      console.log("Pool created:", poolResult);

      const finalResult = {
        configAddress,
        poolAddress: poolResult.poolAddress,
        poolTransactionSignature: poolResult.signature,
        configTransactionSignature,
      };

      // Save to database
      console.log("Saving to database...");
      await saveTokenToDatabase(finalResult);

      setResult(finalResult);
      triggerConfetti(); // 🎉 Celebrate success!
      console.log("Token creation completed successfully!");
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError(`Token creation failed: ${error}`);
    }
  };

  // Prevent hydration errors by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen overflow-hidden">
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 shadow-[0_8px_30px_rgba(0,0,0,0.8)] max-w-md w-full">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[rgb(215,231,40)] rounded-2xl mb-8">
                <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-[Inter,sans-serif]">
                Initializing Platform
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connecting to blockchain networks and preparing trading interface
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen overflow-hidden font-[Inter,sans-serif]">
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-black/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 shadow-[0_8px_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-[rgb(215,231,40)] rounded-2xl mb-8">
                  <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                
                <h1 className="text-[2.5rem] font-bold text-white mb-6 leading-tight">
                  Connect Your Wallet
                </h1>
                <p className="text-xl text-gray-400 mb-12 max-w-lg mx-auto leading-relaxed">
                  Access the future of decentralized finance. Create bonding curve pools and launch your tokens with institutional-grade infrastructure.
                </p>
                
                <div className="relative z-50">
                  <WalletMultiButton className="!bg-[rgb(215,231,40)] hover:!bg-[rgb(215,231,40)]/90 !text-black !px-10 !py-4 !rounded-2xl !font-semibold !text-lg !transition-all !duration-300 !shadow-[0_0_15px_rgba(215,231,40,0.4)] hover:!shadow-[0_0_25px_rgba(215,231,40,0.6)] !transform hover:!scale-105 !border-0 !z-50" />
                </div>
                
                {/* Features grid */}
                <div className="mt-16 pt-8 border-t border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-8">
                    Why Developers Choose Our Platform
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center group">
                      <div className="w-14 h-14 bg-[rgb(215,231,40)]/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[rgb(215,231,40)]/30 transition-colors">
                        <svg className="w-7 h-7 text-[rgb(215,231,40)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-white mb-2">Lightning Fast</h4>
                      <p className="text-sm text-gray-400">Deploy pools in milliseconds with optimized smart contracts</p>
                    </div>
                    
                    <div className="text-center group">
                      <div className="w-14 h-14 bg-gray-700/30 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-600/30 transition-colors">
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-white mb-2">Bank-Grade Security</h4>
                      <p className="text-sm text-gray-400">Multi-layered encryption and audited smart contracts</p>
                    </div>
                    
                    <div className="text-center group">
                      <div className="w-14 h-14 bg-gray-700/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-600/20 transition-colors">
                        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-white mb-2">Dynamic Curves</h4>
                      <p className="text-sm text-gray-400">Advanced bonding curve algorithms for optimal price discovery</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden font-[Inter,sans-serif]">
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[rgb(215,231,40)] rounded-2xl mb-8">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-[2.5rem] md:text-[3rem] font-bold text-white mb-6 tracking-tight leading-tight">
              Launch Your Token
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
              Create dynamic bonding curve pools on Solana with institutional-grade infrastructure. 
              Deploy in seconds with advanced DeFi mechanics and real-time analytics.
            </p>
            
            {/* Network Status Indicator */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/80 border border-gray-700 rounded-full">
              <div className={`w-2 h-2 rounded-full ${network === WalletAdapterNetwork.Mainnet ? 'bg-[rgb(215,231,40)]' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-400">
                Connected to {network === WalletAdapterNetwork.Mainnet ? 'Mainnet' : 'Devnet'}
              </span>
            </div>
          </div>

          {/* Network and Wallet Control Bar */}
          <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 mb-12 shadow-[0_8px_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
            
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Network Toggle */}
              <div className="flex items-center gap-6">
                <span className="text-sm font-semibold text-white">Network:</span>
                <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-1 shadow-inner">
                  <div className={`absolute top-1 bottom-1 w-24 bg-[rgb(215,231,40)] rounded-lg shadow-sm transition-transform duration-300 ${
                    network === WalletAdapterNetwork.Mainnet ? 'translate-x-24' : 'translate-x-0'
                  }`}></div>
                  <div className="relative flex">
                    <button
                      type="button"
                      onClick={() => setNetwork(WalletAdapterNetwork.Devnet)}
                      className={`relative z-10 px-6 py-3 text-sm font-bold rounded-lg transition-colors duration-300 ${
                        network === WalletAdapterNetwork.Devnet
                          ? "text-black"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Devnet
                    </button>
                    <button
                      type="button"
                      onClick={() => setNetwork(WalletAdapterNetwork.Mainnet)}
                      className={`relative z-10 px-6 py-3 text-sm font-bold rounded-lg transition-colors duration-300 ${
                        network === WalletAdapterNetwork.Mainnet
                          ? "text-black"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Mainnet
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Wallet Button */}
              <div className="relative z-50">
                <WalletMultiButton className="!bg-[rgb(215,231,40)] hover:!bg-[rgb(215,231,40)]/90 !text-black !px-8 !py-4 !rounded-2xl !font-bold !transition-all !duration-300 !shadow-[0_0_15px_rgba(215,231,40,0.4)] hover:!shadow-[0_0_25px_rgba(215,231,40,0.6)] !transform hover:!scale-105 !border-0 !z-50" />
              </div>
            </div>
          </div>

          {/* Main Pool Creation Interface */}
          <div className="bg-black/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
            
            <div className="relative p-8 lg:p-12">

              {error && (
                <div className="mb-12 p-8 bg-red-950/30 border border-red-800/50 rounded-2xl shadow-[0_8px_20px_rgba(220,38,38,0.2)] relative overflow-hidden">
                  <div className="relative flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-red-900/30 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">Transaction Failed</h3>
                      <p className="text-gray-300 leading-relaxed">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="min-h-screen flex items-center justify-center py-16">
                  <div className="max-w-5xl w-full mx-auto px-4">
                    {/* Success Header */}
                    <div className="text-center mb-16">
                      <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-r from-[rgb(215,231,40)] to-[#10b981] rounded-full mb-8 relative">
                        <svg className="w-14 h-14 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[rgb(215,231,40)] to-[#10b981] blur-xl opacity-40 animate-pulse"></div>
                      </div>
                      <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-white via-[rgb(215,231,40)] to-white bg-clip-text text-transparent">
                        🎉 Launch Successful!
                      </h1>
                      <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-4">
                        Your token <strong className="text-[rgb(215,231,40)]">{formData.tokenName}</strong> is now live on Solana
                      </p>
                      <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Your bonding curve pool is ready for trading and available to the entire Solana ecosystem
                      </p>
                    </div>

                    {/* Token Details Card */}
                    <div className="bg-gradient-to-br from-black via-gray-900 to-black border border-[rgb(215,231,40)]/20 rounded-3xl p-8 mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(215,231,40)]/5 via-transparent to-[rgb(215,231,40)]/5 rounded-3xl"></div>
                      
                      <div className="relative grid md:grid-cols-3 gap-8 mb-8">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-[rgb(215,231,40)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[rgb(215,231,40)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Token Name</h3>
                          <p className="text-[rgb(215,231,40)] font-mono text-lg">{formData.tokenName}</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Symbol</h3>
                          <p className="text-purple-400 font-mono text-lg">{formData.tokenSymbol}</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Network</h3>
                          <p className="text-blue-400 font-mono text-lg">{network === WalletAdapterNetwork.Mainnet ? 'Mainnet' : 'Devnet'}</p>
                        </div>
                      </div>

                      <div className="relative grid gap-6">
                        {/* Addresses */}
                        <div className="bg-black/40 border border-gray-700/50 rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-[rgb(215,231,40)]/20 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-[rgb(215,231,40)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <h4 className="text-lg font-bold text-white">Configuration Address</h4>
                          </div>
                          <div className="font-mono text-sm text-gray-300 bg-gray-900/50 border border-gray-600/30 p-4 rounded-xl break-all">
                            {result.configAddress}
                          </div>
                        </div>

                        {result.poolAddress && (
                          <div className="bg-black/40 border border-gray-700/50 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <h4 className="text-lg font-bold text-white">Pool Address</h4>
                            </div>
                            <div className="font-mono text-sm text-gray-300 bg-gray-900/50 border border-gray-600/30 p-4 rounded-xl break-all">
                              {result.poolAddress}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {result?.configTransactionSignature && (
                        <a
                          href={`https://solscan.io/tx/${result.configTransactionSignature}${
                            network === WalletAdapterNetwork.Mainnet ? "" : "?cluster=devnet"
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[rgb(215,231,40)] to-[#10b981] hover:from-[rgb(215,231,40)]/90 hover:to-[#10b981]/90 text-black py-4 px-6 rounded-2xl font-bold transition-all duration-300 shadow-[0_8px_25px_rgba(215,231,40,0.3)] hover:shadow-[0_12px_35px_rgba(215,231,40,0.5)] transform hover:scale-105"
                        >
                          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Config Transaction
                        </a>
                      )}
                      {result?.poolTransactionSignature && (
                        <a
                          href={`https://solscan.io/tx/${result.poolTransactionSignature}${
                            network === WalletAdapterNetwork.Mainnet ? "" : "?cluster=devnet"
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-500/90 hover:to-blue-500/90 text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300 shadow-[0_8px_25px_rgba(147,51,234,0.3)] hover:shadow-[0_12px_35px_rgba(147,51,234,0.5)] transform hover:scale-105"
                        >
                          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Pool Transaction
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setResult(null);
                          setFormData({
                            tokenName: "",
                            tokenSymbol: "",
                            description: "",
                            externalUrl: "",
                            migrationQuoteThreshold: 15,
                          });
                          setSelectedImage(null);
                          setImagePreview("");
                          setGeneratedMetadataUri("");
                        }}
                        className="group flex items-center justify-center gap-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300 shadow-[0_8px_25px_rgba(75,85,99,0.3)] hover:shadow-[0_12px_35px_rgba(75,85,99,0.5)] transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Launch Another Token
                      </button>
                    </div>

                    {/* Share Section */}
                    <div className="text-center p-8 bg-gray-900/30 border border-gray-700/30 rounded-2xl">
                      <h3 className="text-2xl font-bold text-white mb-4">🚀 Share Your Success</h3>
                      <p className="text-gray-400 mb-6">Let the world know about your new token launch!</p>
                      <div className="flex justify-center gap-4">
                        <a
                          href={`https://twitter.com/intent/tweet?text=🎉 Just launched my token "${formData.tokenName}" ($${formData.tokenSymbol}) on @solana using @sparkclub_fun! 🚀 %0A%0A✨ Bonding curve pool is now live and ready for trading%0A%0A${result.configTransactionSignature ? `View transaction: https://solscan.io/tx/${result.configTransactionSignature}${network === WalletAdapterNetwork.Mainnet ? '' : '?cluster=devnet'}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                          Share on Twitter
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!result && (
                <form onSubmit={handleSubmit} className="space-y-10">
                {/* Form Header */}
                <div className="text-center border-b border-[#2A2F3C] pb-8">
                  <h2 className="text-[1.5rem] font-bold text-[#FFFFFF] mb-3">
                    Pool Configuration
                  </h2>
                  <p className="text-[#A0AEC0]">
                    Configure your token parameters for the bonding curve pool deployment
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  {/* Token Name */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-[#FFFFFF] uppercase tracking-wider">
                      Token Name <span className="text-[#FF4D6D]">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        name="tokenName"
                        value={formData.tokenName}
                        onChange={handleInputChange}
                        className="w-full px-6 py-5 bg-[#0D0F1A]/80 border border-[#2A2F3C] rounded-2xl focus:ring-4 focus:ring-[#00E6A8]/20 focus:border-[#00E6A8] text-[#FFFFFF] transition-all duration-300 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#00E6A8]/50 placeholder-[#A0AEC0]"
                        placeholder="Enter your token name"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                        <svg className="w-5 h-5 text-[#A0AEC0] group-focus-within:text-[#00E6A8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-[#A0AEC0] flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      The display name for your token
                    </p>
                  </div>

                  {/* Token Symbol */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-[#FFFFFF] uppercase tracking-wider">
                      Token Symbol <span className="text-[#FF4D6D]">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        name="tokenSymbol"
                        value={formData.tokenSymbol}
                        onChange={handleInputChange}
                        className="w-full px-6 py-5 bg-[#0D0F1A]/80 border border-[#2A2F3C] rounded-2xl focus:ring-4 focus:ring-[#2E93FF]/20 focus:border-[#2E93FF] text-[#FFFFFF] transition-all duration-300 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#2E93FF]/50 placeholder-[#A0AEC0] uppercase font-mono"
                        placeholder="TOKEN"
                        maxLength={10}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                        <svg className="w-5 h-5 text-[#A0AEC0] group-focus-within:text-[#2E93FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-[#A0AEC0] flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      3-10 character ticker symbol
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#FFFFFF] uppercase tracking-wider">
                    Token Description <span className="text-[#FF4D6D]">*</span>
                  </label>
                  <div className="relative group">
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-6 py-5 bg-[#0D0F1A]/80 border border-[#2A2F3C] rounded-2xl focus:ring-4 focus:ring-[#7B61FF]/20 focus:border-[#7B61FF] text-[#FFFFFF] transition-all duration-300 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#7B61FF]/50 placeholder-[#A0AEC0] resize-none"
                      placeholder="Describe your token&apos;s purpose, utility, and unique features..."
                      required
                    />
                  </div>
                  <p className="text-xs text-[#A0AEC0] flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    A compelling description helps investors understand your token&apos;s value
                  </p>
                </div>

                {/* External URL */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#FFFFFF] uppercase tracking-wider">
                    Project Website
                  </label>
                  <div className="relative group">
                    <input
                      type="url"
                      name="externalUrl"
                      value={formData.externalUrl}
                      onChange={handleInputChange}
                      className="w-full px-6 py-5 pl-14 bg-[#0D0F1A]/80 border border-[#2A2F3C] rounded-2xl focus:ring-4 focus:ring-[#FFB020]/20 focus:border-[#FFB020] text-[#FFFFFF] transition-all duration-300 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#FFB020]/50 placeholder-[#A0AEC0] font-mono text-sm"
                      placeholder="https://your-project.com"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-6">
                      <svg className="w-5 h-5 text-[#A0AEC0] group-focus-within:text-[#FFB020] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-[#A0AEC0] flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Optional: Link to your project&apos;s official website or documentation
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#FFFFFF] uppercase tracking-wider">
                    Token Image
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="token-image"
                    />
                    <label
                      htmlFor="token-image"
                      className="w-full h-32 border-2 border-dashed border-[#2A2F3C] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#00E6A8]/50 transition-colors bg-[#0D0F1A]/80 backdrop-blur-sm"
                    >
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-xl"
                        />
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-[#A0AEC0] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[#A0AEC0] text-sm">Click to upload image</span>
                        </>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-[#A0AEC0] flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recommended: 512x512 pixels, PNG or JPG format
                  </p>
                </div>

                {/* Migration Quote Threshold */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-[#FFFFFF] uppercase tracking-wider">
                    Migration Threshold <span className="text-[#FF4D6D]">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      name="migrationQuoteThreshold"
                      value={formData.migrationQuoteThreshold}
                      onChange={handleInputChange}
                      className="w-full px-6 py-5 pl-14 bg-[#0D0F1A]/80 border border-[#2A2F3C] rounded-2xl focus:ring-4 focus:ring-[#FFB020]/20 focus:border-[#FFB020] text-[#FFFFFF] transition-all duration-300 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#FFB020]/50 placeholder-[#A0AEC0] font-mono"
                      placeholder="15"
                      min="1"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-6">
                      <svg className="w-5 h-5 text-[#A0AEC0] group-focus-within:text-[#FFB020] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                      <span className="text-xs font-bold text-[#FFB020] bg-[#FFB020]/10 px-2 py-1 rounded-lg">SOL</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#A0AEC0] flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    SOL threshold that triggers automatic migration to DAMM V2
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-12 border-t border-[#2A2F3C]">
                  <button
                    type="submit"
                    disabled={isCreatingConfig || isCreatingPool}
                    className="group relative w-full bg-gradient-to-r from-[#00E6A8] via-[#2E93FF] to-[#7B61FF] hover:from-[#00E6A8]/90 hover:via-[#2E93FF]/90 hover:to-[#7B61FF]/90 text-white py-6 px-8 rounded-2xl font-bold text-lg transition-all duration-500 shadow-[0_8px_25px_rgba(0,230,168,0.3)] hover:shadow-[0_12px_35px_rgba(0,230,168,0.5)] transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                  >
                    
                    <div className="relative z-10">
                      {isCreatingConfig ? (
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          <div className="flex flex-col items-start">
                            <span className="font-bold">Configuring Pool Parameters</span>
                            <span className="text-sm opacity-80">Setting up bonding curve mechanics...</span>
                          </div>
                        </div>
                      ) : isCreatingPool ? (
                        <div className="flex items-center justify-center gap-4">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-bold">Deploying to Blockchain</span>
                            <span className="text-sm opacity-80">Broadcasting transaction to Solana...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-4">
                          <svg className="w-7 h-7 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <div className="flex flex-col items-start">
                            <span className="font-bold">Launch Bonding Curve Pool</span>
                            <span className="text-sm opacity-90">Deploy your token to Solana blockchain</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {/* Additional info */}
                  <div className="mt-6 text-center">
                    <p className="text-xs text-[#A0AEC0] flex items-center justify-center gap-2">
                      <svg className="w-3 h-3 text-[#00C896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Secured by Solana blockchain • Gas fees will be calculated automatically
                    </p>
                  </div>
                </div>
                </form>
              )}

              {/* Technical Features Section */}
              <div className="mt-16 pt-12 border-t border-[#2A2F3C]">
                <div className="text-center mb-12">
                  <h3 className="text-xl font-bold text-[#FFFFFF] mb-4">
                    Enterprise-Grade DeFi Infrastructure
                  </h3>
                  <p className="text-[#A0AEC0] text-lg max-w-2xl mx-auto leading-relaxed">
                    Built with institutional-grade security and performance for the next generation of decentralized finance
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                  <div className="group text-center p-8 bg-[#0D0F1A]/60 border border-[#2A2F3C] rounded-2xl backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#00E6A8]/30 transition-all duration-300">
                    <div className="w-14 h-14 bg-[#00E6A8]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#00E6A8]/30 transition-colors relative">
                      <svg className="w-7 h-7 text-[#00E6A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-[#FFFFFF] mb-3">Secure Wallet Integration</h4>
                    <p className="text-sm text-[#A0AEC0] leading-relaxed">Multi-signature support with hardware wallet compatibility</p>
                  </div>
                  
                  <div className="group text-center p-8 bg-[#0D0F1A]/60 border border-[#2A2F3C] rounded-2xl backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#2E93FF]/30 transition-all duration-300">
                    <div className="w-14 h-14 bg-[#2E93FF]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2E93FF]/30 transition-colors relative">
                      <svg className="w-7 h-7 text-[#2E93FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-[#FFFFFF] mb-3">Lightning Deployment</h4>
                    <p className="text-sm text-[#A0AEC0] leading-relaxed">Deploy in under 30 seconds with optimized smart contracts</p>
                  </div>
                  
                  <div className="group text-center p-8 bg-[#0D0F1A]/60 border border-[#2A2F3C] rounded-2xl backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#7B61FF]/30 transition-all duration-300">
                    <div className="w-14 h-14 bg-[#7B61FF]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#7B61FF]/30 transition-colors relative">
                      <svg className="w-7 h-7 text-[#7B61FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-[#FFFFFF] mb-3">Real-time Analytics</h4>
                    <p className="text-sm text-[#A0AEC0] leading-relaxed">Advanced metrics and performance monitoring dashboard</p>
                  </div>
                  
                  <div className="group text-center p-8 bg-[#0D0F1A]/60 border border-[#2A2F3C] rounded-2xl backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-[#FFB020]/30 transition-all duration-300">
                    <div className="w-14 h-14 bg-[#FFB020]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#FFB020]/30 transition-colors relative">
                      <svg className="w-7 h-7 text-[#FFB020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-[#FFFFFF] mb-3">Smart Automation</h4>
                    <p className="text-sm text-[#A0AEC0] leading-relaxed">AI-powered parameter optimization and risk management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

