/**
 * Lazy Loaded Components
 * 
 * Code-split components for better initial load performance.
 * These components are loaded on-demand when first accessed.
 */

import React, { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// Loading fallback component
export const LoadingFallback: React.FC<{ name?: string }> = ({ name }) => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <span className="text-slate-400 text-sm">
        {name ? `Loading ${name}...` : 'Loading...'}
      </span>
    </div>
  </div>
);

// Generic lazy wrapper with error boundary
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  componentName?: string
): React.FC<P> {
  const LazyComponent = React.lazy(importFn);
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={<LoadingFallback name={componentName} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// ==================== Lazy Loaded Feature Components ====================

// Settings page - large component with many sub-features
export const LazySettings = React.lazy(() => 
  import('./Settings').then(module => ({ default: module.Settings }))
);

// FAQ page - content-heavy component
export const LazyFAQ = React.lazy(() => 
  import('./FAQ').then(module => ({ default: module.FAQ }))
);

// Mobile Access - optional feature
export const LazyMobileAccess = React.lazy(() => 
  import('./MobileAccess').then(module => ({ default: module.MobileAccess }))
);

// Onboarding Tutorial - first-time setup only
export const LazyOnboardingTutorial = React.lazy(() => 
  import('./OnboardingTutorial').then(module => ({ default: module.OnboardingTutorial }))
);

// What's New Modal - shown occasionally
export const LazyWhatsNewModal = React.lazy(() => 
  import('./WhatsNewModal').then(module => ({ default: module.WhatsNewModal }))
);

// Keyboard Shortcuts Modal - optional feature
export const LazyKeyboardShortcutsModal = React.lazy(() => 
  import('./KeyboardShortcutsModal').then(module => ({ default: module.KeyboardShortcutsModal }))
);

// ==================== Wrapped Components with Suspense ====================

import type { SettingsProps } from './Settings';

// Settings with built-in Suspense
export const SettingsLazy: React.FC<SettingsProps> = (props) => (
  <Suspense fallback={<LoadingFallback name="Settings" />}>
    <LazySettings {...props} />
  </Suspense>
);

// FAQ with built-in Suspense (no props)
export const FAQLazy: React.FC = () => (
  <Suspense fallback={<LoadingFallback name="FAQ" />}>
    <LazyFAQ />
  </Suspense>
);

// Re-export types
export type { SettingsProps };

