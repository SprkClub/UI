"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/Navigation";

interface TokenData {
  _id: string;
  configAddress: string;
  poolAddress?: string;
  userWallet?: string;
  createdAt: string;
  metadata?: {
    name: string;
    symbol: string;
    description: string;
    image?: string;
  };
  twitterAuth?: {
    username: string;
    name: string;
  };
  featured?: boolean;
  approved?: boolean;
}

interface ReferralData {
  username: string;
  referralCode: string;
  totalReferred: number;
  totalEarnings: number;
  referredUsers: Array<{
    username: string;
    name: string;
    referredAt: string;
    tokensPurchased: number;
  }>;
  referralLink: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userTokens, setUserTokens] = useState<TokenData[]>([]);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalTokens: 0,
    featuredTokens: 0,
    totalReferred: 0,
  });

  const fetchUserData = useCallback(async () => {
    try {
      // Fetch user's tokens
      const tokensResponse = await fetch('/api/tokens');
      const tokensData = await tokensResponse.json();
      
      if (tokensData.success) {
        const myTokens = tokensData.tokens.filter((token: TokenData) => 
          token.twitterAuth?.username === session?.user?.username
        );
        setUserTokens(myTokens);
        
        setStats({
          totalTokens: myTokens.length,
          featuredTokens: myTokens.filter((token: TokenData) => token.featured || token.approved).length,
          totalReferred: 0,
        });
      }

      // Fetch referral data
      const referralResponse = await fetch('/api/referral');
      const referralData = await referralResponse.json();
      
      if (referralData.success) {
        setReferralData(referralData.referralData);
        setStats(prev => ({
          ...prev,
          totalReferred: referralData.referralData.totalReferred || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.username]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      // Redirect to auth with return URL
      router.push('/auth/signin?callbackUrl=/dashboard');
      return;
    }

    fetchUserData();
  }, [session, status, router, fetchUserData]);

  const copyReferralLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      // You can add toast notification here
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[rgb(215,231,40)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <Navigation currentPage="dashboard" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, <span className="text-[rgb(215,231,40)]">{session.user.name?.split(' ')[0] || session.user.username}</span>! 👋
          </h1>
          <p className="text-gray-400">Here&apos;s an overview of your SprkClub activity</p>
        </div>

        {/* User Profile Section */}
        <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-[rgb(215,231,40)] rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{session.user.name}</h2>
              <p className="text-xl text-[rgb(215,231,40)] mb-2">@{session.user.username}</p>
              <p className="text-gray-400">Connected via Twitter • Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.totalTokens}</p>
              <p className="text-gray-400">Tokens Created</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[rgb(215,231,40)]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-[rgb(215,231,40)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.featuredTokens}</p>
              <p className="text-gray-400">Featured</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.totalReferred}</p>
              <p className="text-gray-400">Referrals</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-[rgb(215,231,40)] text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'tokens'
                  ? 'bg-[rgb(215,231,40)] text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              My Tokens
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-[rgb(215,231,40)] text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              Create Token
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'referrals'
                  ? 'bg-[rgb(215,231,40)] text-black'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              Referrals
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Account Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-xl">
                  <p className="text-2xl font-bold text-[rgb(215,231,40)]">{stats.totalTokens}</p>
                  <p className="text-gray-400">Tokens Created</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl">
                  <p className="text-2xl font-bold text-blue-400">{stats.featuredTokens}</p>
                  <p className="text-gray-400">Featured Tokens</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl">
                  <p className="text-2xl font-bold text-green-400">{stats.totalReferred}</p>
                  <p className="text-gray-400">Referrals Made</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Create New Token</h3>
              <p className="text-gray-400 mb-4">Launch your token on the Solana blockchain with our easy-to-use token creator.</p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 bg-[rgb(215,231,40)] text-black py-3 px-6 rounded-xl font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Launch Token Creator
              </Link>
            </div>
          )}

          {activeTab === 'tokens' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">My Tokens</h3>
              {userTokens.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">No Tokens Yet</h4>
                  <p className="text-gray-400 mb-6">Create your first token to get started</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-2 bg-[rgb(215,231,40)] text-black py-2 px-4 rounded-xl font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Token
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userTokens.map((token) => (
                    <div
                      key={token._id}
                      className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-[rgb(215,231,40)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {token.metadata?.image ? (
                          <Image
                            src={token.metadata.image}
                            alt={token.metadata.name || 'Token'}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[rgb(215,231,40)] flex items-center justify-center">
                            <span className="text-black font-bold text-sm">
                              {token.metadata?.symbol?.charAt(0) || 'T'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">
                            {token.metadata?.name || 'Unnamed Token'}
                          </h4>
                          <p className="text-[rgb(215,231,40)] text-sm">
                            ${token.metadata?.symbol || 'SYMBOL'}
                          </p>
                        </div>
                        {(token.featured || token.approved) && (
                          <div className="w-5 h-5 bg-[rgb(215,231,40)] rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-400 text-xs mb-3">
                        Created {new Date(token.createdAt).toLocaleDateString()}
                      </p>
                      
                      {token.poolAddress && (
                        <div className="flex gap-2">
                          <a
                            href={`https://raydium.io/swap/?inputMint=sol&outputMint=${token.configAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-[rgb(215,231,40)] text-black py-2 px-3 rounded-lg text-xs font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors text-center"
                          >
                            Trade
                          </a>
                          <a
                            href={`https://solscan.io/account/${token.configAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-gray-800 text-white py-2 px-3 rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors text-center"
                          >
                            View
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'referrals' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Referral Program</h3>
              {referralData ? (
                <div>
                  <p className="text-gray-400 mb-4">Share your referral link and earn rewards when others use the platform.</p>
                  <div className="bg-gray-900/50 p-4 rounded-xl mb-4">
                    <p className="text-sm text-gray-400 mb-2">Your Referral Link</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={referralData.referralLink} 
                        readOnly 
                        className="flex-1 bg-gray-800 text-white p-2 rounded border border-gray-700"
                      />
                      <button
                        onClick={copyReferralLink}
                        className="bg-[rgb(215,231,40)] text-black p-2 rounded hover:bg-[rgb(215,231,40)]/90 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-xl">
                      <p className="text-2xl font-bold text-[rgb(215,231,40)]">{referralData.totalReferred}</p>
                      <p className="text-gray-400">People Referred</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl">
                      <p className="text-2xl font-bold text-green-400">{referralData.totalEarnings}</p>
                      <p className="text-gray-400">Total Earnings</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Loading referral data...</p>
              )}
            </div>
          )}
        </div>

        {/* Additional Quick Links */}
        <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/featured"
              className="flex flex-col items-center p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <svg className="w-8 h-8 text-[rgb(215,231,40)] mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white text-sm text-center">Featured</span>
            </Link>

            <button
              onClick={() => setActiveTab('create')}
              className="flex flex-col items-center p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <svg className="w-8 h-8 text-[rgb(215,231,40)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-white text-sm text-center">Create</span>
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              className="flex flex-col items-center p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <svg className="w-8 h-8 text-[rgb(215,231,40)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-white text-sm text-center">Tokens</span>
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className="flex flex-col items-center p-4 bg-gray-900/50 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <svg className="w-8 h-8 text-[rgb(215,231,40)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-white text-sm text-center">Referrals</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}