"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Wait for session to load
    
    if (session?.user) {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard');
    }
    // If not authenticated, stay on this page and show the landing page
  }, [session, status, router]);

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
