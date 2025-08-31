import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@solana/web3.js',
    '@meteora-ag/dynamic-bonding-curve-sdk',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-phantom',
    '@solana/wallet-adapter-react',
    'bn.js',
    'bs58'
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@solana/web3.js': 'commonjs @solana/web3.js',
        '@meteora-ag/dynamic-bonding-curve-sdk': 'commonjs @meteora-ag/dynamic-bonding-curve-sdk',
        'bn.js': 'commonjs bn.js',
        'bs58': 'commonjs bs58'
      });
    }
    return config;
  },
};

export default nextConfig;
