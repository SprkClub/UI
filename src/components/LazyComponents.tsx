import { lazy, Suspense } from 'react';

// Lazy load heavy components for better performance
export const LazyTokenCard = lazy(() => import('./TokenCard'));
export const LazyWalletConnect = lazy(() => import('./WalletConnect'));
export const LazyDashboardChart = lazy(() => import('./DashboardChart'));

// Loading fallback components
const ComponentSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-700 h-32 rounded-lg"></div>
  </div>
);

// Wrapper components with suspense
export const TokenCardLazy = (props: any) => (
  <Suspense fallback={<ComponentSkeleton />}>
    <LazyTokenCard {...props} />
  </Suspense>
);

export const WalletConnectLazy = (props: any) => (
  <Suspense fallback={<div className="h-10 bg-gray-700 rounded animate-pulse"></div>}>
    <LazyWalletConnect {...props} />
  </Suspense>
);

export const DashboardChartLazy = (props: any) => (
  <Suspense fallback={<ComponentSkeleton />}>
    <LazyDashboardChart {...props} />
  </Suspense>
);