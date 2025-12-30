/**
 * Performance Utilities
 * Helper functions for performance optimization
 */

/**
 * Debounce function for expensive operations
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options?: IntersectionObserverInit
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        img.src = src;
        observer.unobserve(img);
      }
    });
  }, options);

  observer.observe(img);

  return () => observer.unobserve(img);
}

/**
 * Check if code is running in production
 */
export const isProduction = import.meta.env.PROD;

/**
 * Log performance metrics (only in development)
 */
export function logPerformance(label: string, fn: () => void): void {
  if (!isProduction && 'performance' in window) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
}

