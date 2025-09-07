"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import WalletProvider from "../components/WalletProvider";
import PoolCreator from "../components/PoolCreator";
import Image from "next/image";

import one from '../../../public/1.png';
import two from '../../../public/2.png';
import three from '../../../public/3.png'
import four from '../../../public/4.png'

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[rgb(215,231,40)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return ( 
    <WalletProvider>
      <div className="min-h-screen relative">
        {/* Positioned Shape Images */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image src={one} alt="Shape 1" width={320} height={320} className="absolute -top-8 -left-8" />
          <Image src={two} alt="Shape 2" width={330} height={330} className="absolute -top-8 right-8" />
          <Image src={three} alt="Shape 3" width={330} height={110} className="absolute -bottom-8 -left-8" />
          <Image src={four} alt="Shape 4" width={330} height={140} className="absolute -bottom-8 -right-8" />
        </div>


        {/* Main Content */}
        <div className="relative z-10">
          {/* User Header */}
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl px-4 py-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[rgb(215,231,40)] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="text-white font-medium">@{session?.user?.username || session?.user?.name}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-white transition-colors text-sm px-2 py-1 rounded-lg hover:bg-gray-800"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="text-center py-8 md:py-16 px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] font-bold mt-8 md:mt-16 lg:mt-[100px] mb-6 md:mb-8 font-[Inter,sans-serif] text-center opacity-0 animate-title-reveal leading-tight">
              <span className="bg-gradient-to-r from-white via-[rgb(215,231,40)] to-white bg-clip-text text-transparent">
                Sprkclub.fun - Create Pool
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed opacity-0 animate-subtitle-reveal font-medium px-2">
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
          <footer className="py-8 md:py-12 text-center">
            <div className="max-w-4xl mx-auto px-4">
              <div className="border-t border-gray-800 pt-6 md:pt-8">
                <p className="text-xs md:text-sm text-gray-500">
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