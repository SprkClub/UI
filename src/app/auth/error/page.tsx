"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-black/95 backdrop-blur-xl border border-red-800 rounded-2xl p-8 shadow-[0_8px_30px_rgba(255,0,0,0.3)] text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-400">
              {error === "Configuration" && "There is a problem with the server configuration."}
              {error === "AccessDenied" && "Access was denied."}
              {error === "Verification" && "The verification token has expired or has already been used."}
              {error === "Default" && "An error occurred during authentication."}
              {!error && "An unknown error occurred."}
            </p>
            {error && (
              <p className="text-xs text-gray-500 mt-2">
                Error code: {error}
              </p>
            )}
          </div>
          
          <Link 
            href="/auth/signin"
            className="inline-block bg-gradient-to-r from-[rgb(215,231,40)] to-[#10b981] hover:from-[rgb(215,231,40)]/90 hover:to-[#10b981]/90 text-black py-3 px-6 rounded-xl font-semibold transition-all duration-300"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}