"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface UserData {
  _id: string;
  name: string;
  email: string;
  image: string;
  username?: string;
  emailVerified: string | null;
}

interface TokenStats {
  totalTokens: number;
  totalUsers: number;
  tokensToday: number;
  tokensThisWeek: number;
}

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
  _id: string;
  username: string;
  userId: string;
  referralCode: string;
  totalReferred: number;
  totalEarnings: number;
  totalTokensCreated: number;
  createdAt: string;
  referredUsers: Array<{
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
      approved: boolean;
      featured: boolean;
    }>;
  }>;
}

interface ReferralStats {
  totalReferrers: number;
  totalReferredUsers: number;
  totalTokensFromReferrals: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdminInput, setNewAdminInput] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [tokensFilter, setTokensFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('pending');
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'users' | 'referrals'>('overview');

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchAdminData();
  }, [session, status, router, tokensFilter]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/manage');
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(true);
        setAdmins(data.admins || []);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      await checkAdminStatus();
      
      const [usersResponse, statsResponse, tokensResponse, referralsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
        fetch(`/api/admin/tokens?status=${tokensFilter}`),
        fetch('/api/admin/referrals')
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json();
        setTokens(tokensData.tokens || []);
      }

      if (referralsResponse.ok) {
        const referralsData = await referralsResponse.json();
        setReferrals(referralsData.referrals || []);
        setReferralStats(referralsData.stats || null);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminInput.trim()) return;
    
    setAdminLoading(true);
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: newAdminInput.trim() }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setAdmins(prev => [...prev, data.username]);
        setNewAdminInput('');
        alert('Admin added successfully!');
      } else {
        alert(data.error || 'Failed to add admin');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Failed to add admin');
    } finally {
      setAdminLoading(false);
    }
  };

  const removeAdmin = async (username: string) => {
    if (!confirm(`Remove ${username} as admin?`)) return;
    
    try {
      const response = await fetch('/api/admin/manage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setAdmins(prev => prev.filter(admin => admin !== username));
        alert('Admin removed successfully!');
      } else {
        alert(data.error || 'Failed to remove admin');
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('Failed to remove admin');
    }
  };

  const handleTokenAction = async (tokenId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/tokens', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenId, action }),
      });

      const data = await response.json();
      
      if (response.ok) {
        fetchAdminData();
        alert(data.message || `Token ${action}d successfully!`);
      } else {
        alert(data.error || `Failed to ${action} token`);
      }
    } catch (error) {
      console.error(`Error ${action}ing token:`, error);
      alert(`Failed to ${action} token`);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this token? This action cannot be undone.')) return;
    
    try {
      const response = await fetch('/api/admin/tokens', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        fetchAdminData();
        alert('Token deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete token');
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token');
    }
  };

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

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You don&apos;t have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgb(215,231,40)] rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SprkClub Admin</h1>
                <p className="text-sm text-gray-400">@{session.user.username}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/referrals"
                className="text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
              >
                My Referrals
              </Link>
              <Link
                href="/create"
                className="text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
              >
                Back to App
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-800">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'tokens', label: 'Tokens', icon: '🪙' },
                { key: 'referrals', label: 'Referrals', icon: '👥' },
                { key: 'users', label: 'Users', icon: '👤' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-[rgb(215,231,40)] text-[rgb(215,231,40)]'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[rgb(215,231,40)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading admin data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && referralStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[rgb(215,231,40)]/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-[rgb(215,231,40)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Tokens</p>
                      <p className="text-2xl font-bold text-white">{stats.totalTokens}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Today</p>
                      <p className="text-2xl font-bold text-white">{stats.tokensToday}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">This Week</p>
                      <p className="text-2xl font-bold text-white">{stats.tokensThisWeek}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Referrers</p>
                      <p className="text-2xl font-bold text-white">{referralStats.totalReferrers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Referred</p>
                      <p className="text-2xl font-bold text-white">{referralStats.totalReferredUsers}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tokens Tab - Token Management */}
            {activeTab === 'tokens' && (
              <>
                {/* Admin Management */}
                <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Admin Management</h2>
                    <p className="text-sm text-gray-400">Manage admin access for the platform</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Add Admin */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-300">Add New Admin</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newAdminInput}
                          onChange={(e) => setNewAdminInput(e.target.value)}
                          placeholder="Enter X URL (https://x.com/username) or @username"
                          className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[rgb(215,231,40)] focus:ring-1 focus:ring-[rgb(215,231,40)] focus:outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && addAdmin()}
                        />
                        <button
                          onClick={addAdmin}
                          disabled={adminLoading || !newAdminInput.trim()}
                          className="px-6 py-3 bg-[rgb(215,231,40)] text-black font-medium rounded-xl hover:bg-[rgb(215,231,40)]/90 focus:outline-none focus:ring-2 focus:ring-[rgb(215,231,40)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {adminLoading ? 'Adding...' : 'Add Admin'}
                        </button>
                      </div>
                    </div>

                    {/* Current Admins */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-300">Current Admins</label>
                      <div className="space-y-2">
                        {/* Core Admins */}
                        <div className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-[rgb(215,231,40)] rounded-full"></div>
                            <span className="text-white">@soumalyapaul19</span>
                            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Core Admin</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-[rgb(215,231,40)] rounded-full"></div>
                            <span className="text-white">@iathulnambiar</span>
                            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Core Admin</span>
                          </div>
                        </div>
                        
                        {/* Database Admins */}
                        {admins.filter(admin => !['soumalyapaul19', 'iathulnambiar'].includes(admin)).map((admin) => (
                          <div key={admin} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-white">@{admin}</span>
                              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Added Admin</span>
                            </div>
                            <button
                              onClick={() => removeAdmin(admin)}
                              className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded hover:bg-red-900/20"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        
                        {admins.filter(admin => !['soumalyapaul19', 'iathulnambiar'].includes(admin)).length === 0 && (
                          <p className="text-gray-500 text-sm italic p-3">No additional admins added</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Management */}
                <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">Token Management</h2>
                        <p className="text-sm text-gray-400">Review and manage submitted tokens</p>
                      </div>
                      <Link
                        href="/featured"
                        className="text-[rgb(215,231,40)] hover:text-[rgb(215,231,40)]/80 text-sm font-medium"
                      >
                        View Featured →
                      </Link>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="px-6 py-3 border-b border-gray-800">
                    <div className="flex gap-2">
                      {[
                        { key: 'pending', label: 'Pending', count: tokens.filter(t => !t.approved).length },
                        { key: 'approved', label: 'Approved', count: tokens.filter(t => t.approved && !t.featured).length },
                        { key: 'featured', label: 'Featured', count: tokens.filter(t => t.featured).length },
                        { key: 'all', label: 'All', count: tokens.length },
                      ].map((filter) => (
                        <button
                          key={filter.key}
                          onClick={() => setTokensFilter(filter.key as 'all' | 'pending' | 'approved' | 'featured')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tokensFilter === filter.key
                              ? 'bg-[rgb(215,231,40)] text-black'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          {filter.label} ({filter.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {tokens.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <p className="text-gray-400">No {tokensFilter} tokens found</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-900/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Token</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Creator</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {tokens.map((token) => (
                            <tr key={token._id} className="hover:bg-gray-900/30">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  {token.metadata?.image ? (
                                    <Image
                                      src={token.metadata.image}
                                      alt={token.metadata.name || 'Token'}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-xl object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(215,231,40)] to-[rgb(10,185,129)] flex items-center justify-center">
                                      <span className="text-sm font-bold text-black">
                                        {token.metadata?.symbol?.charAt(0) || 'T'}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {token.metadata?.name || 'Unnamed Token'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      ${token.metadata?.symbol || 'SYMBOL'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {token.twitterAuth ? (
                                  <div>
                                    <p className="text-sm text-white">{token.twitterAuth.name}</p>
                                    <p className="text-xs text-gray-400">@{token.twitterAuth.username}</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-400">Unknown</p>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex gap-2">
                                  {token.featured && (
                                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-[rgb(215,231,40)]/20 text-[rgb(215,231,40)]">
                                      Featured
                                    </span>
                                  )}
                                  {token.approved && (
                                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-400">
                                      Approved
                                    </span>
                                  )}
                                  {!token.approved && (
                                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-yellow-900/30 text-yellow-400">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <p className="text-sm text-white">
                                  {new Date(token.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: '2-digit'
                                  })}
                                </p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex gap-2">
                                  {!token.approved && (
                                    <button
                                      onClick={() => handleTokenAction(token._id, 'approve')}
                                      className="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded hover:bg-green-900/20"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {token.approved && !token.featured && (
                                    <button
                                      onClick={() => handleTokenAction(token._id, 'feature')}
                                      className="text-[rgb(215,231,40)] hover:text-[rgb(215,231,40)]/80 text-xs px-2 py-1 rounded hover:bg-[rgb(215,231,40)]/10"
                                    >
                                      Feature
                                    </button>
                                  )}
                                  {token.featured && (
                                    <button
                                      onClick={() => handleTokenAction(token._id, 'unfeature')}
                                      className="text-gray-400 hover:text-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-800"
                                    >
                                      Unfeature
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteToken(token._id)}
                                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/20"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <>
                {/* Referral Stats */}
                {referralStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total Referrers</p>
                          <p className="text-2xl font-bold text-white">{referralStats.totalReferrers}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total Referred Users</p>
                          <p className="text-2xl font-bold text-white">{referralStats.totalReferredUsers}</p>
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
                          <p className="text-sm text-gray-400">Tokens from Referrals</p>
                          <p className="text-2xl font-bold text-white">{referralStats.totalTokensFromReferrals}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Referrals List */}
                <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Referral Activity</h2>
                    <p className="text-sm text-gray-400">All users with referrals and their performance</p>
                  </div>

                  {referrals.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-400">No referral activity yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {referrals.map((referral) => (
                        <div key={referral._id} className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[rgb(215,231,40)] rounded-2xl flex items-center justify-center">
                                <span className="text-black font-bold text-lg">
                                  {referral.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-semibold">@{referral.username}</p>
                                <p className="text-gray-400 text-sm">Code: {referral.referralCode}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex gap-4">
                                <div className="text-center">
                                  <p className="text-xl font-bold text-[rgb(215,231,40)]">{referral.totalReferred}</p>
                                  <p className="text-xs text-gray-400">Referred</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xl font-bold text-green-400">{referral.totalTokensCreated}</p>
                                  <p className="text-xs text-gray-400">Tokens</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Referred Users */}
                          {referral.referredUsers && referral.referredUsers.length > 0 && (
                            <div className="bg-gray-900/50 rounded-xl p-4">
                              <h4 className="text-white font-medium mb-3">Referred Users ({referral.referredUsers.length})</h4>
                              <div className="space-y-3">
                                {referral.referredUsers.map((user) => (
                                  <div key={user.userId} className="flex items-center justify-between p-3 bg-black/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-400 text-xs font-bold">
                                          {user.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-white text-sm font-medium">{user.name}</p>
                                        <p className="text-gray-400 text-xs">@{user.username}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-white text-sm font-semibold">{user.tokensPurchased} tokens</p>
                                      <p className="text-gray-400 text-xs">
                                        Joined {new Date(user.referredAt).toLocaleDateString()}
                                      </p>
                                    </div>
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
              </>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h2 className="text-xl font-bold text-white">Authenticated Users</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Twitter</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Verified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-900/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Image
                                src={user.image || '/default-avatar.png'}
                                alt={user.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <p className="text-sm font-medium text-white">{user.name}</p>
                                <p className="text-xs text-gray-400">{user._id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-white">@{user.username || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-white">{user.email || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              user.emailVerified 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-yellow-900/30 text-yellow-400'
                            }`}>
                              {user.emailVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {users.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No users found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}