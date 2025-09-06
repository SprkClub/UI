"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/create');
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[rgb(215,231,40)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to Pool Creator...</p>
      </div>
    </div>
  );
}
