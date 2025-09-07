"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

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

interface TokenModalProps {
  token: TokenData;
  isOpen: boolean;
  onClose: () => void;
}

function TokenModal({ token, isOpen, onClose }: TokenModalProps) {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Add visual feedback here if needed
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black/95 backdrop-blur-xl border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {token.metadata?.image && (
                <Image
                  src={token.metadata.image}
                  alt={token.metadata.name || 'Token'}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[rgb(215,231,40)]"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{token.metadata?.name || 'Unnamed Token'}</h2>
                <p className="text-lg text-[rgb(215,231,40)] font-medium">${token.metadata?.symbol || 'SYMBOL'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          {token.metadata?.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed">{token.metadata.description}</p>
            </div>
          )}

          {/* Creator Info */}
          {token.twitterAuth && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Creator</h3>
              <div className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-xl">
                <div className="w-10 h-10 bg-[rgb(215,231,40)] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{token.twitterAuth.name}</p>
                  <p className="text-gray-400 text-sm">@{token.twitterAuth.username}</p>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Technical Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg">
                <span className="text-gray-400">Config Address</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-sm">
                    {token.configAddress.slice(0, 8)}...{token.configAddress.slice(-8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(token.configAddress)}
                    className="text-[rgb(215,231,40)] hover:text-[rgb(215,231,40)]/80 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {token.poolAddress && (
                <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg">
                  <span className="text-gray-400">Pool Address</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm">
                      {token.poolAddress.slice(0, 8)}...{token.poolAddress.slice(-8)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(token.poolAddress!)}
                      className="text-[rgb(215,231,40)] hover:text-[rgb(215,231,40)]/80 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center p-3 bg-gray-900/30 rounded-lg">
                <span className="text-gray-400">Created</span>
                <span className="text-white">
                  {new Date(token.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-800">
            {token.poolAddress && (
              <>
                <a
                  href={`https://raydium.io/swap/?inputMint=sol&outputMint=${token.configAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[rgb(215,231,40)] text-black py-3 px-4 rounded-xl font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Buy on Raydium
                </a>
                <a
                  href={`https://jup.ag/swap/SOL-${token.configAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  Buy on Jupiter
                </a>
              </>
            )}
            <a
              href={`https://solscan.io/account/${token.configAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${token.poolAddress ? 'flex-1' : 'flex-2'} bg-gray-800 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Details
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedTokens() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);

  useEffect(() => {
    fetchFeaturedTokens();
  }, []);

  const fetchFeaturedTokens = async () => {
    try {
      const response = await fetch('/api/tokens');
      const data = await response.json();
      
      if (data.success) {
        // Filter for approved/featured tokens only
        const featuredTokens = data.tokens.filter((token: TokenData) => 
          token.approved === true || token.featured === true
        );
        setTokens(featuredTokens);
      }
    } catch (error) {
      console.error('Error fetching featured tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[rgb(215,231,40)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading featured tokens...</p>
        </div>
      </div>
    );
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
                  <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Featured Tokens</h1>
                  <p className="text-sm text-gray-400">Approved & Featured Projects</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/referrals"
                className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Referrals
              </Link>
              <Link
                href="/create"
                className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Launch Token
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
        {tokens.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Featured Tokens Yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Featured tokens will appear here once they are approved by the admin team. Be the first to launch a token!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-[rgb(215,231,40)] text-black py-3 px-6 rounded-xl font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Launch Your Token
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Featured Collection</h2>
                  <p className="text-gray-400">Discover approved and featured tokens from our community</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[rgb(215,231,40)]">{tokens.length}</p>
                  <p className="text-gray-400 text-sm">Featured Tokens</p>
                </div>
              </div>
            </div>

            {/* Token Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tokens.map((token) => (
                <div
                  key={token._id}
                  onClick={() => setSelectedToken(token)}
                  className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-[rgb(215,231,40)]/50 hover:shadow-[0_8px_30px_rgba(215,231,40,0.1)] transition-all duration-300 cursor-pointer group"
                >
                  {/* Token Image */}
                  <div className="relative mb-4">
                    {token.metadata?.image ? (
                      <Image
                        src={token.metadata.image}
                        alt={token.metadata.name || 'Token'}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-gray-700 group-hover:border-[rgb(215,231,40)]/50 transition-colors"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[rgb(215,231,40)] to-[rgb(10,185,129)] mx-auto flex items-center justify-center border-2 border-gray-700 group-hover:border-[rgb(215,231,40)]/50 transition-colors">
                        <span className="text-2xl font-bold text-black">
                          {token.metadata?.symbol?.charAt(0) || 'T'}
                        </span>
                      </div>
                    )}
                    
                    {/* Featured Badge */}
                    {token.featured && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-[rgb(215,231,40)] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Token Info */}
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1 truncate">
                      {token.metadata?.name || 'Unnamed Token'}
                    </h3>
                    <p className="text-[rgb(215,231,40)] font-semibold mb-2">
                      ${token.metadata?.symbol || 'SYMBOL'}
                    </p>
                    
                    {/* Description Preview */}
                    {token.metadata?.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {token.metadata.description}
                      </p>
                    )}

                    {/* Creator */}
                    {token.twitterAuth && (
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-5 h-5 bg-[rgb(215,231,40)]/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-[rgb(215,231,40)]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                        <span className="text-gray-400 text-xs">@{token.twitterAuth.username}</span>
                      </div>
                    )}

                    {/* Creation Date */}
                    <p className="text-xs text-gray-500">
                      {new Date(token.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-px bg-gradient-to-r from-transparent via-[rgb(215,231,40)]/50 to-transparent mb-3"></div>
                    
                    {token.poolAddress ? (
                      <div className="flex gap-2 mb-2">
                        <a
                          href={`https://raydium.io/swap/?inputMint=sol&outputMint=${token.configAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-[rgb(215,231,40)] text-black py-2 px-3 rounded-lg text-xs font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors text-center"
                        >
                          Buy
                        </a>
                        <button
                          onClick={() => setSelectedToken(token)}
                          className="flex-1 bg-gray-800 text-white py-2 px-3 rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-[rgb(215,231,40)] text-xs font-medium">
                        Click to view details
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Token Modal */}
      <TokenModal
        token={selectedToken!}
        isOpen={!!selectedToken}
        onClose={() => setSelectedToken(null)}
      />
    </div>
  );
}