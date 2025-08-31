"use client";

import { useState } from "react";
import WalletProvider from "./components/WalletProvider";
import PoolCreator from "./components/PoolCreator";

export default function Home() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              🚀 Solana Pool Launchpad
            </h1>
            <p className="text-blue-100">
              Create your own bonding curve pools on Solana with Phantom wallet
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Pool Creator Section */}
            <section id="create-pool">
              <PoolCreator />
            </section>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-blue-200">
            <p>Built with Next.js, Solana Web3.js, and Phantom Wallet</p>
          </footer>
        </div>
      </div>
    </WalletProvider>
  );
}
