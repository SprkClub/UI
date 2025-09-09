"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

export default function ReferralPage() {
  const { code } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [referralValid, setReferralValid] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<{ username: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateReferralCode = useCallback(async () => {
    try {
      // We'll create a separate endpoint to validate codes without processing
      const response = await fetch(`/api/referral/validate?code=${code}`);
      const data = await response.json();
      
      if (data.valid) {
        setReferralValid(true);
        setReferrerInfo({ username: data.referrerUsername });
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
    } finally {
      setLoading(false);
    }
  }, [code]);

  const processReferral = useCallback(async () => {
    setProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: code }),
      });

      const data = await response.json();
      
      if (data.success) {
        setProcessed(true);
        setReferrerInfo({ username: data.referrerUsername });
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        // Set specific error message based on response
        setError(data.error || 'Failed to process referral');
        console.error('Referral processing failed:', data.error);
      }
    } catch (error) {
      console.error('Error processing referral:', error);
      setError('Network error while processing referral');
    } finally {
      setProcessing(false);
      setLoading(false);
    }
  }, [router, code]);

  useEffect(() => {
    if (status === "loading") return;

    // If user is already logged in, process the referral
    if (session?.user?.username) {
      processReferral();
    } else {
      // Just validate the referral code for display
      validateReferralCode();
    }
  }, [session, status, code, processReferral, validateReferralCode]);

  const handleSignIn = async () => {
    // Store referral code in localStorage to process after sign in
    localStorage.setItem('pendingReferralCode', code as string);
    await signIn('twitter', { callbackUrl: `/ref/${code}` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[rgb(215,231,40)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Validating referral...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-black/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.8)] text-center">
          {processed ? (
            // Success State
            <>
              <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Welcome to SprkClub!
              </h1>
              <p className="text-gray-400 text-lg mb-6">
                You&apos;ve been successfully referred by <span className="text-[rgb(215,231,40)] font-semibold">@{referrerInfo?.username}</span>
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Redirecting to dashboard in 3 seconds...
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-[rgb(215,231,40)] text-black py-3 px-6 rounded-xl font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors"
              >
                Go to Dashboard
              </Link>
            </>
          ) : processing ? (
            // Processing State
            <>
              <div className="w-20 h-20 bg-[rgb(215,231,40)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Processing Referral
              </h1>
              <p className="text-gray-400 text-lg">
                Setting up your account...
              </p>
            </>
          ) : error ? (
            // Error state with specific error messages
            <>
              <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                {error.includes('already used this referral') ? 'Already Used' : 
                 error.includes('already been referred') ? 'Already Referred' : 
                 error.includes('refer yourself') ? 'Invalid Action' :
                 error.includes('Invalid referral code') ? 'Invalid Referral' :
                 'Referral Issue'}
              </h1>
              <p className="text-gray-400 mb-6">
                {error.includes('already used this referral') ? 'You have already used this referral link before.' :
                 error.includes('already been referred') ? 'You have already been referred by someone else.' :
                 error.includes('refer yourself') ? 'You cannot refer yourself.' :
                 error.includes('Invalid referral code') ? 'This referral code is invalid or does not exist.' :
                 error.includes('Network error') ? 'Please check your internet connection and try again.' :
                 error}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    validateReferralCode();
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 bg-[rgb(215,231,40)] text-black py-3 px-6 rounded-xl font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors text-center"
                >
                  Continue to Dashboard
                </Link>
              </div>
            </>
          ) : referralValid ? (
            // Valid referral, user needs to sign in
            <>
              <div className="w-20 h-20 bg-[rgb(215,231,40)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                You&apos;re Invited!
              </h1>
              <p className="text-gray-400 text-lg mb-2">
                <span className="text-[rgb(215,231,40)] font-semibold">@{referrerInfo?.username}</span> invited you to join
              </p>
              <p className="text-gray-400 text-lg mb-6">
                SprkClub.Fun - The ultimate token launchpad
              </p>

              <button
                onClick={handleSignIn}
                className="w-full bg-gradient-to-r from-[rgb(215,231,40)] to-[#10b981] hover:from-[rgb(215,231,40)]/90 hover:to-[#10b981]/90 text-black py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_8px_25px_rgba(215,231,40,0.3)] hover:shadow-[0_12px_35px_rgba(215,231,40,0.5)] transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Continue with 𝕏
              </button>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our terms and privacy policy
                </p>
              </div>
            </>
          ) : (
            // Invalid referral code
            <>
              <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Invalid Referral
              </h1>
              <p className="text-gray-400 mb-6">
                This referral link is invalid or has expired.
              </p>
              <Link
                href="/auth/signin"
                className="inline-block bg-[rgb(215,231,40)] text-black py-3 px-6 rounded-xl font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors"
              >
                Sign In Anyway
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}