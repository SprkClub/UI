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

  useEffect(() => {
    // Load landing page scripts and styles
    const loadLandingAssets = () => {
      // Set the page title
      document.title = 'SprkClub.Fun - The Ultimate Token Launchpad';
      
      // Add meta viewport if not present
      if (!document.querySelector('meta[name="viewport"]')) {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1';
        document.head.appendChild(viewport);
      }
    };

    loadLandingAssets();
  }, []);

  // If user is authenticated, don't show landing page content
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

  return (
    <div className="min-h-screen">
      <iframe 
        src="/landing/index.html"
        className="w-full h-screen border-0"
        title="SprkClub Landing Page"
        style={{ minHeight: '100vh' }}
      />
    </div>
  );
}