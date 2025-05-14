/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttles a function to be called at most once in the specified time period
 * 
 * @param func The function to throttle
 * @param limit The time limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Create a memoized fetch function that avoids duplicate requests in quick succession
 * 
 * @param fetchFn The fetch function to memoize 
 * @param keyFn Optional function to generate a cache key from args
 * @param ttl Time to live for cache entries in milliseconds (default: 10 seconds)
 */
export function memoizedFetch<T extends (...args: any[]) => Promise<any>>(
  fetchFn: T,
  keyFn?: (...args: Parameters<T>) => string,
  ttl: number = 10000
) {
  // Cache for storing previous results
  const cache: Record<string, {
    promise: Promise<any>,
    timestamp: number
  }> = {};
  
  return async function(...args: Parameters<T>): Promise<ReturnType<T>> {
    // Generate cache key from args
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    const now = Date.now();
    
    // If we have a cached result and it's not expired, use it
    if (cache[key] && now - cache[key].timestamp < ttl) {
      return cache[key].promise as ReturnType<T>;
    }
    
    // Otherwise, make the actual request
    const promise = fetchFn(...args);
    
    // Update the cache
    cache[key] = {
      promise,
      timestamp: now
    };
    
    return promise as ReturnType<T>;
  };
}

/**
 * Cache results of expensive function calls using React's useRef and useMemo hooks
 * 
 * @example
 * // In a component:
 * const cachedFetch = useApiCache(
 *   (id) => api.get(`/items/${id}`),
 *   (id) => `item-${id}`,
 *   30000 // 30 seconds
 * );
 * 
 * // Then use it:
 * useEffect(() => {
 *   cachedFetch(itemId).then(setData);
 * }, [itemId, cachedFetch]);
 */
export function createResourceCache() {
  // Cache storage
  const resourceCache: Record<string, {
    data: any,
    timestamp: number,
    error: any | null,
    promise: Promise<any> | null
  }> = {};
  
  // Default TTL: 2 minutes
  const DEFAULT_TTL = 2 * 60 * 1000;
  
  return {
    /**
     * Get a resource from cache or fetch it if not cached
     * @param key Cache key
     * @param fetchFn Function to fetch the resource if not cached
     * @param ttl Time to live in milliseconds
     */
    get: async function<T>(
      key: string,
      fetchFn: () => Promise<T>,
      ttl: number = DEFAULT_TTL
    ): Promise<T> {
      const now = Date.now();
      
      // Check if we have a valid cached entry
      if (
        resourceCache[key] && 
        resourceCache[key].data && 
        now - resourceCache[key].timestamp < ttl
      ) {
        return resourceCache[key].data;
      }
      
      // Check if we have a pending promise for this resource
      if (resourceCache[key] && resourceCache[key].promise) {
        return resourceCache[key].promise;
      }
      
      // Fetch the resource
      const promise = fetchFn()
        .then(data => {
          resourceCache[key] = {
            data,
            timestamp: Date.now(),
            error: null,
            promise: null
          };
          return data;
        })
        .catch(error => {
          resourceCache[key] = {
            data: null,
            timestamp: Date.now(),
            error,
            promise: null
          };
          throw error;
        });
      
      // Store the promise so concurrent requests can use it
      resourceCache[key] = {
        data: null,
        timestamp: 0,
        error: null,
        promise
      };
      
      return promise;
    },
    
    /**
     * Invalidate a cached resource
     * @param key Cache key to invalidate
     */
    invalidate: function(key: string): void {
      delete resourceCache[key];
    },
    
    /**
     * Clear the entire cache
     */
    clear: function(): void {
      Object.keys(resourceCache).forEach(key => {
        delete resourceCache[key];
      });
    }
  };
} 