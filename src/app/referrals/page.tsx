"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface ReferredUser {
  username: string;
  userId: string;
  name: string;
  referredAt: string;
  tokensPurchased: number;
  tokens: Array<{
    _id: string;
    name: string;
    symbol: string;
    createdAt: string;
  }>;
}

interface ReferralData {
  username: string;
  userId: string;
  referralCode: string;
  totalReferred: number;
  totalEarnings: number;
  referredUsers: ReferredUser[];
  referralLink: string;
  createdAt: string;
}

export default function ReferralsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchReferralData();
  }, [session, status, router]);

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/referral');
      const data = await response.json();
      
      if (data.success) {
        setReferralData(data.referralData);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[rgb(215,231,40)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[rgb(215,231,40)] rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Referral Program</h1>
                  <p className="text-sm text-gray-400">Invite friends & earn rewards</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/create"
                className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Launch Token
              </Link>
              <Link
                href="/featured"
                className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Featured
              </Link>
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[rgb(215,231,40)]/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[rgb(215,231,40)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Referred</p>
                <p className="text-2xl font-bold text-white">{referralData?.totalReferred || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Tokens Created</p>
                <p className="text-2xl font-bold text-white">
                  {referralData?.referredUsers?.reduce((acc, user) => acc + user.tokensPurchased, 0) || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Your Code</p>
                <p className="text-2xl font-bold text-white font-mono">{referralData?.referralCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Your Referral Link</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={referralData?.referralLink || ''}
              readOnly
              className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(215,231,40)]/50"
            />
            <button
              onClick={copyReferralLink}
              className="bg-[rgb(215,231,40)] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors flex items-center gap-2"
            >
              {copySuccess ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Referred Users */}
        <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Referred Users</h2>
            <p className="text-gray-400">Users who joined using your referral link</p>
          </div>

          {!referralData?.referredUsers || referralData.referredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Referrals Yet</h3>
              <p className="text-gray-400 mb-6">Share your referral link to start earning!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {referralData.referredUsers.map((user, index) => (
                <div key={user.userId} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[rgb(215,231,40)] rounded-2xl flex items-center justify-center">
                        <span className="text-black font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{user.name}</p>
                        <p className="text-gray-400 text-sm">@{user.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{user.tokensPurchased} tokens</p>
                      <p className="text-gray-400 text-sm">
                        Joined {new Date(user.referredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* User's Tokens */}
                  {user.tokens && user.tokens.length > 0 && (
                    <div className="bg-gray-900/50 rounded-xl p-4">
                      <h4 className="text-white font-medium mb-3">Created Tokens</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {user.tokens.map((token) => (
                          <div key={token._id} className="bg-black/50 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-[rgb(215,231,40)] to-[rgb(10,185,129)] rounded-lg flex items-center justify-center">
                                <span className="text-black text-xs font-bold">
                                  {token.symbol.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{token.name}</p>
                                <p className="text-gray-400 text-xs">${token.symbol}</p>
                              </div>
                            </div>
                            <p className="text-gray-500 text-xs mt-2">
                              {new Date(token.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}