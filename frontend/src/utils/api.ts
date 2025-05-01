import axios, { AxiosResponse, AxiosError } from 'axios';
// import { AxiosRequestConfig } from 'axios'; // Unused
// import { store } from '../store'; // Unused
// import { logout } from '../store/slices/authSlice'; // Unused

// Base URL with /api suffix since it's used in all routes
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create a custom axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure axios defaults for all requests
axios.defaults.baseURL = API_URL;

// Request interceptor to add the auth token to all requests
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API utility: Adding token to request', config.url);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Also add the interceptor to the global axios instance
axios.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    console.log(`Global axios interceptor: Token is ${token ? 'present' : 'null'} for URL:`, config.url);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log('Global axios: Adding token to request', config.url);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('401 Unauthorized error', error.response.data);
      // Clear token if it's invalid
      localStorage.removeItem('token');
      
      // Redirect to login page on 401 errors
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Add the same response interceptor to the global axios instance
axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error('401 Unauthorized error', error.response.data);
      // Clear token if it's invalid
      localStorage.removeItem('token');
      
      // Redirect to login page on 401 errors
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 