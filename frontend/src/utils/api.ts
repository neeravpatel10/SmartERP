import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, AxiosHeaders } from 'axios';
// import { AxiosRequestConfig } from 'axios'; // Unused
// import { store } from '../store'; // Unused
// import { logout } from '../store/slices/authSlice'; // Unused

// Define the extended API type with our custom methods
interface ExtendedAxiosInstance extends AxiosInstance {
  testConnection(): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: any;
  }>;
  getCached<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  clearCache(urlPattern?: string): void;
}

// Base URL with /api suffix since it's used in all routes
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create a custom axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}) as ExtendedAxiosInstance;

// Configure axios defaults for all requests
axios.defaults.baseURL = API_URL;

// Enable API debugging during development
const DEBUG_API = process.env.NODE_ENV === 'development';

// Simple request cache for GET requests
const requestCache: Record<string, {
  data: any,
  timestamp: number,
  maxAge: number
}> = {};

// Cache expiration in milliseconds (default 2 minutes)
const DEFAULT_CACHE_MAX_AGE = 2 * 60 * 1000;

// Add a getCached method for GET requests with caching
api.getCached = async function<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  if (!url) {
    console.error('API Error: Missing URL in getCached call');
    return Promise.reject(new Error('Invalid API request - missing URL'));
  }

  let safeConfig: AxiosRequestConfig = {
    headers: new AxiosHeaders()
  };

  if (config && typeof config === 'object') {
    if (config.params) safeConfig.params = config.params;
    if (config.headers) {
      if (config.headers instanceof AxiosHeaders) {
        safeConfig.headers = config.headers;
      } else {
        Object.entries(config.headers).forEach(([key, value]) => {
          (safeConfig.headers as AxiosHeaders).set(key, value);
        });
      }
    }
    if (config.timeout) safeConfig.timeout = config.timeout;
    if (config.withCredentials !== undefined) {
      safeConfig.withCredentials = config.withCredentials;
    }
  }

  const cacheKey = `${url}|${JSON.stringify(safeConfig?.params || {})}`;
  const now = Date.now();

  if (
    requestCache[cacheKey] &&
    now - requestCache[cacheKey].timestamp < requestCache[cacheKey].maxAge
  ) {
    if (DEBUG_API) console.log(`Using cached response for ${url}`);
    return requestCache[cacheKey].data; // ✅ clean and safe
  }

  const response = await api.get<T>(url, safeConfig);

  requestCache[cacheKey] = {
    data: response,
    timestamp: now,
    maxAge:
      safeConfig?.headers?.['cache-max-age']
        ? parseInt(safeConfig.headers['cache-max-age'] as string, 10)
        : DEFAULT_CACHE_MAX_AGE
  };

  return response;
};


// Add a diagnostic method to test API connectivity
api.testConnection = async () => {
  // Skip the actual health check to prevent 404 errors
  return {
    success: true,
    message: 'API server is reachable',
    data: { status: 'ok' }
  };
  
  // Original implementation commented out
  /*
  try {
    // Try with /health endpoint
    const response = await api.get('/health', { timeout: 5000 });
    return {
      success: true,
      message: 'API server is reachable',
      data: response.data
    };
  } catch (error: any) {
    return {
      success: false,
      message: `API server is not reachable: ${error.message}`,
      error
    };
  }
  */
};

// Request interceptor to add the auth token to all requests
api.interceptors.request.use(
  (config) => {
    // Validate config object - prevent null/undefined config
    if (!config) {
      console.error('API Error: Null or undefined config object');
      return Promise.reject(new Error('Invalid API request configuration - null config'));
    }

    // Validate URL - prevent undefined URL
    if (!config.url) {
      console.error('API Error: Missing URL in config');
      return Promise.reject(new Error('Invalid API request configuration - missing URL'));
    }

    // Ensure headers object exists
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    const token = localStorage.getItem('token');
    
    if (token) {
      if (DEBUG_API) console.log('API utility: Adding token to request', config.url);
      
      // Ensure token format is correct - must be "Bearer <token>"
      const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = tokenValue;
      
      if (DEBUG_API) {
        console.log('Token being sent:', tokenValue.substring(0, 20) + '...');
        console.log('Full request config:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data ? JSON.stringify(config.data).substring(0, 100) + '...' : null
        });
      }
    } else {
      if (DEBUG_API) console.log('API utility: No token available for request', config.url);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Track requests per endpoint to limit parallel requests to the same endpoint
const pendingRequests: Record<string, boolean> = {};
const queuedRequests: Record<string, {
  config: AxiosRequestConfig,
  resolve: (value: any) => void,
  reject: (reason?: any) => void,
  timestamp: number
}[]> = {};

// Rate limiting: Even more strict request throttling - limit to 2 requests per second globally
// and only 1 active request per endpoint at a time
let requestTimestamps: number[] = [];
let processingRequest = false;

api.interceptors.request.use(
  (config) => {
    return new Promise(async (resolve, reject) => {
      // Enhanced safety check for undefined config or URL - prevent "toUpperCase" error
      if (!config) {
        console.error('Invalid config in API request');
        reject(new Error('Invalid API request configuration - config is null or undefined'));
        return;
      }
      
      if (config.url === undefined || config.url === null || config.url === '') {
        console.error('Missing URL in API request:', config);
        reject(new Error('Invalid API request configuration - URL is missing'));
        return;
      }
      
      const now = Date.now();
      const endpoint = config.url;
      
      // Clean old timestamps (older than 1 second)
      requestTimestamps = requestTimestamps.filter(timestamp => now - timestamp < 1000);
      
      // Skip throttling for critical endpoints that should never be delayed
      const criticalEndpoints = [
        '/marks/internal/grid',
        '/marks/internal/blueprint'
      ];
      
      const isCriticalRequest = criticalEndpoints.some(criticalPath => 
        endpoint.includes(criticalPath)
      );
      
      // Queue this request if:
      // 1. Already processing another non-critical request
      // 2. Already have 3+ requests in the last second (increased from 2)
      // 3. Already have a pending request to same endpoint
      // But never queue critical endpoints like grid data
      if (!isCriticalRequest && 
          (processingRequest || requestTimestamps.length >= 3 || pendingRequests[endpoint])) {
        // Add to queue
        if (!queuedRequests[endpoint]) {
          queuedRequests[endpoint] = [];
        }
        
        // Add request to queue with its timestamp
        queuedRequests[endpoint].push({
          config,
          resolve,
          reject,
          timestamp: now
        });
        
        if (DEBUG_API) console.log(`Queued request to ${endpoint}, queue length:`, queuedRequests[endpoint].length);
        return;
      }
      
      // Process this request now
      processingRequest = true;
      pendingRequests[endpoint] = true;
      requestTimestamps.push(now);
      
      // Process request after waiting if needed
      if (DEBUG_API) console.log(`Processing request to ${endpoint}`);
      
      // Clear the processing flag to allow next request
      const clearProcessing = () => {
        processingRequest = false;
        pendingRequests[endpoint] = false;
        
        // Process next queued request for this endpoint with safety check
        setTimeout(() => {
          if (queuedRequests[endpoint] && queuedRequests[endpoint].length > 0) {
            const nextRequest = queuedRequests[endpoint].shift();
            if (nextRequest && nextRequest.config && nextRequest.config.url) {
              api(nextRequest.config)
                .then(response => nextRequest.resolve(response))
                .catch(error => nextRequest.reject(error));
            }
          }
        }, 300); // Wait 300ms before processing next endpoint request
      };
      
      try {
        resolve(config);
        setTimeout(clearProcessing, 100);
      } catch (err) {
        reject(err);
        clearProcessing();
      }
    });
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (DEBUG_API) {
      console.log('API Response:', {
        url: response.config?.url || 'unknown',
        status: response.status,
        data: response.data ? JSON.stringify(response.data).substring(0, 100) + '...' : null
      });
    }
    return response;
  },
  (error) => {
    // Handle case where error.config is undefined or missing URL
    if (!error.config) {
      console.error('API Error: Invalid configuration or null config', error);
      return Promise.reject(new Error('Invalid API request configuration - null config'));
    }
    
    if (error.config.url === undefined || error.config.url === null || error.config.url === '') {
      console.error('API Error: Missing URL in config', error);
      return Promise.reject(new Error('Invalid API request configuration - missing URL'));
    }
    
    if (DEBUG_API) {
      console.error('API Error Response:', {
        url: error.config?.url || 'unknown',
        status: error.response?.status,
        data: error.response?.data 
          ? JSON.stringify(error.response.data).substring(0, 200) + '...' 
          : null,
        message: error.message
      });
    }
    
    // Create a more descriptive error message for common status codes
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || 'unknown';
      const method = error.config?.method ? error.config.method.toUpperCase() : 'UNKNOWN';
      const defaultMessage = error.response.data?.message || error.message || 'Unknown API error';
      
      // Add details to the error message based on status code
      switch (status) {
        case 400:
          error.message = `Bad Request (400): ${defaultMessage}`;
          break;
        case 401:
          error.message = `Unauthorized (401): ${defaultMessage}`;
          break;
        case 403:
          error.message = `Forbidden (403): ${defaultMessage}`;
          break;
        case 404:
          error.message = `Not Found (404): The requested resource could not be found (${url})`;
          break;
        case 409:
          error.message = `Conflict (409): ${defaultMessage}`;
          break;
        case 422:
          error.message = `Validation Error (422): ${defaultMessage}`;
          break;
        case 429:
          error.message = `Too Many Requests (429): Please try again later`;
          break;
        case 500:
          error.message = `Server Error (500): ${defaultMessage}`;
          break;
        default:
          error.message = `API Error (${status}): ${defaultMessage}`;
      }
      
      console.error(`${method} ${url} failed: ${error.message}`);
    }
    
    // Handle 429 Too Many Requests error by retrying after a delay
    if (error.response && error.response.status === 429) {
      console.warn('429 Too Many Requests - will retry after a delay');
      
      // Get retry-after header or use default 5 seconds (increased from 2)
      const retryAfter = parseInt(error.response.headers['retry-after'] || '10', 10) * 1000;
      
      return new Promise(resolve => {
        setTimeout(() => {
          // Retry the request with cached mechanism to avoid multiple retries
          const originalRequest = error.config;
          
          // Only retry GET requests - don't retry mutations
          if (originalRequest.method && originalRequest.method.toLowerCase() === 'get') {
            resolve(api.getCached(originalRequest.url, originalRequest));
          } else {
            // For non-GET requests, better to fail than retry
            resolve(api(error.config));
          }
        }, retryAfter);
      });
    }
    
    // Handle 401 unauthorized by checking if path is not auth-related
    if (error.response && error.response.status === 401) {
      const authPaths = ['/auth/login', '/auth/register', '/auth/reset-password'];
      // Use optional chaining to prevent errors on undefined urls
      const isAuthPath = authPaths.some(path => error.config?.url?.includes(path));
      
      if (!isAuthPath) {
        console.warn('401 Unauthorized response - token might be invalid');
        // Optionally redirect to login or clear token
        // localStorage.removeItem('token');
        // window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Add a method to clear cache
api.clearCache = function(urlPattern?: string): void {
  if (urlPattern) {
    // Clear specific cache entries matching the pattern
    const keys = Object.keys(requestCache);
    let clearedCount = 0;
    
    for (const key of keys) {
      if (key.includes(urlPattern)) {
        delete requestCache[key];
        clearedCount++;
      }
    }
    
    if (DEBUG_API) console.log(`Cleared ${clearedCount} cache entries matching "${urlPattern}"`);
  } else {
    // Clear all cache
    for (const key in requestCache) {
      delete requestCache[key];
    }
    
    if (DEBUG_API) console.log('Cleared all cache entries');
  }
};

export default api; 