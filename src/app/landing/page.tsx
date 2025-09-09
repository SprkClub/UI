"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect logged-in users to dashboard
    if (session?.user) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // If user is authenticated, show loading while redirecting
  if (session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[rgb(215,231,40)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen">
      <iframe 
        src="/index.html"
        className="w-full h-screen border-0"
        title="SprkClub Landing Page"
        style={{ minHeight: '100vh' }}
      />
    </div>
  );
}