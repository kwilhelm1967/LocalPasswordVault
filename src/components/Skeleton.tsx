/**
 * Skeleton Components
 * 
 * Loading placeholders for better perceived performance.
 */

import React from "react";

// Base skeleton with shimmer animation
export const Skeleton: React.FC<{
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}> = ({ className = "", variant = 'text', width, height }) => {
  const baseClasses = "animate-pulse bg-slate-700/50";
  
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Entry card skeleton
export const EntryCardSkeleton: React.FC = () => (
  <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
    <div className="flex items-start gap-3">
      {/* Icon */}
      <Skeleton variant="rectangular" width={40} height={40} />
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="40%" height={12} />
        <div className="flex gap-1 mt-2">
          <Skeleton variant="rectangular" width={24} height={4} />
          <Skeleton variant="rectangular" width={24} height={4} />
          <Skeleton variant="rectangular" width={24} height={4} />
        </div>
      </div>
    </div>
  </div>
);

// Entry list skeleton
export const EntryListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <EntryCardSkeleton key={i} />
    ))}
  </div>
);

// Dashboard stat card skeleton
export const StatCardSkeleton: React.FC = () => (
  <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="rectangular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="50%" height={12} />
        <Skeleton variant="text" width="30%" height={24} />
      </div>
    </div>
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Stats row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Security score */}
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width={120} height={20} />
        <Skeleton variant="text" width={60} height={32} />
      </div>
      <Skeleton variant="rectangular" width="100%" height={8} className="rounded-full" />
    </div>
    
    {/* Recent entries */}
    <div className="space-y-3">
      <Skeleton variant="text" width={150} height={16} />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-slate-800/30 rounded-lg p-3 flex items-center gap-3">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="flex-1 space-y-1">
              <Skeleton variant="text" width="40%" height={14} />
              <Skeleton variant="text" width="25%" height={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Sidebar skeleton
export const SidebarSkeleton: React.FC = () => (
  <div className="w-64 bg-slate-800/50 border-r border-slate-700/50 p-4 space-y-4">
    {/* Brand */}
    <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
      <Skeleton variant="rectangular" width={36} height={36} />
      <div className="space-y-1">
        <Skeleton variant="text" width={100} height={14} />
        <Skeleton variant="text" width={70} height={10} />
      </div>
    </div>
    
    {/* Search */}
    <Skeleton variant="rectangular" width="100%" height={36} className="rounded-lg" />
    
    {/* Add button */}
    <Skeleton variant="rectangular" width="100%" height={36} className="rounded-lg" />
    
    {/* Nav items */}
    <div className="space-y-2 pt-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" width="100%" height={32} className="rounded-lg" />
      ))}
    </div>
  </div>
);

// Full page loading skeleton
export const PageSkeleton: React.FC = () => (
  <div className="h-screen flex overflow-hidden">
    <SidebarSkeleton />
    <div className="flex-1">
      <DashboardSkeleton />
    </div>
  </div>
);

