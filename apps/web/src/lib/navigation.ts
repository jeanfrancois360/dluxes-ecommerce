/**
 * Navigation utilities with loading indicator support
 * Triggers NProgress for programmatic navigation
 */

import NProgress from 'nprogress';

// Custom event for programmatic navigation
const NAVIGATION_START_EVENT = 'navigation:start';

/**
 * Start navigation loading indicator
 * Called automatically by navigation helpers
 */
export function startNavigationLoading() {
  if (typeof window !== 'undefined') {
    NProgress.start();
    window.dispatchEvent(new CustomEvent(NAVIGATION_START_EVENT));
  }
}

/**
 * Get the navigation start event name
 */
export function getNavigationStartEvent() {
  return NAVIGATION_START_EVENT;
}

/**
 * Navigate to a URL with loading indicator
 * Use this instead of router.push() for automatic loading feedback
 */
export function navigateWithLoading(router: any, url: string) {
  startNavigationLoading();
  router.push(url);
}
