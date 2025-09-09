"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface NavigationProps {
  currentPage?: string;
}

export default function Navigation({ currentPage }: NavigationProps) {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/landing' });
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Create', href: '/create', icon: '🚀' },
    { name: 'Featured', href: '/featured', icon: '⭐' },
    { name: 'Referrals', href: '/referrals', icon: '👥' },
  ];

  return (
    <div className="border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <Link href={session?.user ? "/dashboard" : "/landing"} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[rgb(215,231,40)] rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">SprkClub</h1>
                <p className="text-sm text-gray-400">Token Launchpad</p>
              </div>
            </Link>
          </div>
          
          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-6">
            {session?.user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
                      currentPage === item.name.toLowerCase()
                        ? 'text-[rgb(215,231,40)] bg-[rgb(215,231,40)]/10'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Link
                  href="/featured"
                  className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  Featured
                </Link>
                <Link
                  href="/auth/signin"
                  className="bg-[rgb(215,231,40)] text-black px-6 py-2 rounded-xl font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          {session?.user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 bg-[rgb(215,231,40)] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{session.user.name}</p>
                  <p className="text-gray-400 text-xs">@{session.user.username}</p>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800 text-sm"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="text-gray-400 hover:text-white p-2"
              onClick={() => {
                // You can implement mobile menu toggle here
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}