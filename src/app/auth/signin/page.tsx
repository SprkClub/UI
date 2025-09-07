"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already signed in
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        // Check for pending referral code
        const pendingReferralCode = localStorage.getItem('pendingReferralCode');
        if (pendingReferralCode) {
          localStorage.removeItem('pendingReferralCode');
          
          // Process the referral
          try {
            await fetch('/api/referral', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ referralCode: pendingReferralCode }),
            });
          } catch (error) {
            console.error('Error processing pending referral:', error);
          }
        }
        router.push('/create');
      }
    };
    checkSession();
  }, [router]);

  const handleTwitterSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('twitter', { 
        callbackUrl: '/create',
        redirect: true 
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-black/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.8)] text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[rgb(215,231,40)] rounded-2xl mb-6">
              <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Connect with 𝕏
            </h1>
            <p className="text-gray-400 text-lg">
              Authenticate with your 𝕏 (Twitter) account to access SprkClub.Fun token launcher
            </p>
          </div>

          <button
            onClick={handleTwitterSignIn}
            disabled={isLoading}
            className="group relative w-full bg-gradient-to-r from-[rgb(215,231,40)] to-[#10b981] hover:from-[rgb(215,231,40)]/90 hover:to-[#10b981]/90 text-black py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_8px_25px_rgba(215,231,40,0.3)] hover:shadow-[0_12px_35px_rgba(215,231,40,0.5)] transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            )}
            {isLoading ? 'Connecting...' : 'Continue with 𝕏'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our terms and privacy policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}