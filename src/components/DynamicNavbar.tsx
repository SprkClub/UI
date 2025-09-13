"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface DynamicNavbarProps {
  currentPage?: string;
  isLandingPage?: boolean;
}

export default function DynamicNavbar({ currentPage, isLandingPage }: DynamicNavbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/landing' });
  };

  // Authenticated user navigation items
  const authNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Create', href: '/create', icon: '🚀' },
    { name: 'Profile', href: '/referrals', icon: '👤' },
  ];

  // Landing page navigation items (public)
  const landingNavItems = [
    { name: 'Features', href: '#features', icon: '⭐' },
    { name: 'How it Works', href: '#work', icon: '⚙️' },
    { name: 'Roadmap', href: '#roadmap', icon: '🗺️' },
    { name: 'Featured', href: '/featured', icon: '💎' },
  ];

  const getLinkStyle = (itemName: string) => {
    const isActive = pathname === `/${itemName.toLowerCase()}` ||
                     currentPage === itemName.toLowerCase();

    if (isLandingPage) {
      return `text-sm font-medium transition-colors px-4 py-2 rounded-lg ${
        isActive
          ? 'text-[rgb(215,231,40)] bg-[rgb(215,231,40)]/10'
          : 'text-white hover:text-[rgb(215,231,40)] hover:bg-white/5'
      }`;
    }

    return `text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
      isActive
        ? 'text-[rgb(215,231,40)] bg-[rgb(215,231,40)]/10'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;
  };

  return (
    <nav className={`${isLandingPage ? 'absolute top-0 left-0 right-0 z-50 bg-transparent' : 'border-b border-gray-800 bg-black'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <Link
              href={session?.user ? "/dashboard" : "/landing"}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-[rgb(215,231,40)] rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">SprkClub</h1>
                <p className={`text-sm ${isLandingPage ? 'text-gray-300' : 'text-gray-400'}`}>
                  Token Launchpad
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {session?.user ? (
              // Authenticated user navigation
              <>
                {authNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={getLinkStyle(item.name)}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </>
            ) : isLandingPage ? (
              // Landing page navigation (public features)
              <>
                {landingNavItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={getLinkStyle(item.name)}
                    onClick={(e) => {
                      if (item.href.startsWith('#')) {
                        e.preventDefault();
                        const element = document.querySelector(item.href);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </a>
                ))}
              </>
            ) : (
              // Default public navigation
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
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[rgb(215,231,40)] rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{session.user.name}</p>
                  <p className={`text-xs ${isLandingPage ? 'text-gray-300' : 'text-gray-400'}`}>
                    @{session.user.username}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className={`transition-colors px-3 py-2 rounded-lg text-sm ${
                  isLandingPage
                    ? 'text-gray-300 hover:text-white hover:bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className={`p-2 ${isLandingPage ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden pb-6 ${isLandingPage ? 'bg-black/90 backdrop-blur-md rounded-lg mt-2' : ''}`}>
            <div className="space-y-2 px-4">
              {session?.user ? (
                // Mobile authenticated navigation
                <>
                  {authNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block py-3 px-4 rounded-lg ${getLinkStyle(item.name)}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left py-3 px-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : isLandingPage ? (
                // Mobile landing page navigation
                <>
                  {landingNavItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="block py-3 px-4 text-white hover:text-[rgb(215,231,40)] hover:bg-white/5 rounded-lg transition-colors"
                      onClick={(e) => {
                        if (item.href.startsWith('#')) {
                          e.preventDefault();
                          const element = document.querySelector(item.href);
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }
                        setMobileMenuOpen(false);
                      }}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </a>
                  ))}
                </>
              ) : (
                // Mobile default navigation
                <>
                  <Link
                    href="/featured"
                    className="block py-3 px-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Featured
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="block py-3 px-4 bg-[rgb(215,231,40)] text-black rounded-lg font-semibold hover:bg-[rgb(215,231,40)]/90 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}