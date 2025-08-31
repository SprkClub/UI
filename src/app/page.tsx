"use client";

import WalletProvider from "./components/WalletProvider";
import PoolCreator from "./components/PoolCreator";
import Image from "next/image";

import one from '../../public/1.png';
import two from '../../public/2.png';
import three from '../../public/3.png'
import four from '../../public/4.png'

export default function Home() {
  return (
    <WalletProvider>
      <div className="min-h-screen relative overflow-hidden">
        {/* Positioned Shape Images */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image src={one} alt="Shape 1" width={320} height={320} className="absolute -top-8 -left-8 " />
          <Image src={two} alt="Shape 2" width={330} height={330} className="absolute -top-8 right-8 " />
          <Image src={three} alt="Shape 3" width={330} height={110} className="absolute -bottom-8 -left-8 0" />
          <Image src={four} alt="Shape 4" width={330} height={140} className="absolute -bottom-8 -right-8 " />
        </div>


        {/* Main Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center py-16 px-4">
            <h1 className="text-[80px] md:text-[90px] lg:text-[100px] font-bold mt-[300px] mb-8 font-[Inter,sans-serif] text-center opacity-0 animate-title-reveal leading-tight">
              <span className="bg-gradient-to-r from-white via-[rgb(215,231,40)] to-white bg-clip-text text-transparent">
                Sparkclub.Fun Launchpad
              </span>
            </h1>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed opacity-0 animate-subtitle-reveal font-medium">
              Advanced bonding curve technology for institutional-grade token launches on Solana blockchain
            </p>
            
            <style jsx>{`
              @keyframes title-reveal {
                0% {
                  opacity: 0;
                  transform: translateY(20px) scale(0.95);
                  filter: blur(4px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                  filter: blur(0);
                }
              }
              
              @keyframes subtitle-reveal {
                0% {
                  opacity: 0;
                  transform: translateY(15px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              .animate-title-reveal {
                animation: title-reveal 0.8s ease-out 0.3s forwards;
              }
              
              .animate-subtitle-reveal {
                animation: subtitle-reveal 0.6s ease-out 1.1s forwards;
              }
            `}</style>
          </div>


          {/* Pool Creator Section */}
          <PoolCreator />

          {/* Footer */}
          <footer className="py-12 text-center">
            <div className="max-w-4xl mx-auto px-4">
              <div className="border-t border-gray-800 pt-8">
                <p className="text-sm text-gray-500">
                  Built with Next.js, Solana Web3.js, and Phantom Wallet
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </WalletProvider>
  );
}
