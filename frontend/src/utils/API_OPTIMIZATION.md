# API Call Optimization Guide

This document outlines best practices and tools implemented to prevent excessive API calls in the ERP frontend application.

## Problem

The application was experiencing "429 Too Many Requests" errors due to sending too many API calls to the backend server. This was happening because:

1. Multiple components were making the same API calls independently
2. Components were not caching API responses
3. Network requests weren't properly throttled
4. Search inputs were triggering API requests on every keystroke
5. Components were refetching data too frequently

## Solution Components

### 1. API Utility with Caching and Throttling

The `api.ts` utility has been enhanced with:

- Request caching via the `getCached` method
- Request throttling to limit concurrent requests
- Queuing system to manage API call bursts
- Automatic retry with backoff for 429 errors

```typescript
// Example usage:
import api from '../utils/api';

// Use cached version for read operations
const response = await api.getCached('/departments', { params: { search: 'CS' } });

// Use regular methods for write operations
await api.post('/departments', newDepartment);
```

### 2. Helper Functions

New helper functions in `helpers.ts`:

- `debounce`: Delays function execution until after a wait period
- `throttle`: Limits function calls to a maximum frequency
- `memoizedFetch`: Caches API call results to prevent duplicate requests
- `createResourceCache`: Creates a cache for storing API responses

```typescript
// Example debounce usage
const debouncedSearch = debounce(() => {
  fetchResults(searchTerm);
}, 500);

// Call this whenever search term changes
debouncedSearch();
```

### 3. ApiCacheContext and useApi Hook

A centralized API cache context to share cached data across components:

```typescript
// In a component:
import { useApi } from '../contexts/ApiCacheContext';

function MyComponent() {
  const { getCached } = useApi();
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await getCached('/departments');
      // Use the data...
    };
    
    fetchData();
  }, [getCached]);
}
```

### 4. Reusable Components with Built-in Caching

Common data selection components to reuse across the application:

- `DepartmentSelector`: Fetches and caches department data

## Best Practices

1. **Always use getCached for read operations**
   ```typescript
   // ✅ Good
   const data = await api.getCached('/endpoint');
   
   // ❌ Bad
   const data = await api.get('/endpoint');
   ```

2. **Debounce search inputs**
   ```typescript
   // ✅ Good
   const debouncedSearch = useCallback(
     debounce(() => {
       fetchData();
     }, 500),
     [fetchData]
   );
   
   // On input change:
   setSearchTerm(e.target.value);
   // Let the debounce handle it
   ```

3. **Use centralized data fetching**
   ```typescript
   // ✅ Good: Use the useApi hook
   const { getCached } = useApi();
   
   // ❌ Bad: Import api directly in many components
   import api from '../utils/api';
   ```

4. **Use the resourceCache for complex scenarios**
   ```typescript
   const cache = createResourceCache();
   
   // Later:
   const data = await cache.get('key', fetchFunction, ttl);
   ```

5. **Share data between components**
   Use contexts, Redux, or other state management to share data between components instead of having each component fetch the same data.

## Monitoring API Calls

To monitor API calls in the browser console, open DevTools and look for:

1. Network requests to your API endpoints
2. Log messages with "API utility" prefix (when in development mode)
3. "Rate limiting" messages when throttling is active

If you see many redundant API calls or 429 errors, revisit your component's data fetching strategy using this guide. 