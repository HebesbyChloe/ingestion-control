import axios from 'axios';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

// Debug: Log if API key is missing (only in development)
if (!API_KEY && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ NEXT_PUBLIC_GATEWAY_API_KEY is not set in .env.local');
  console.warn('Add this to your .env.local file:');
  console.warn('NEXT_PUBLIC_GATEWAY_API_KEY=cc0108c5-5939-4d3a-b4ac-4da6bb4f52de');
}

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

// Request interceptor to add API key to all requests
apiClient.interceptors.request.use((config) => {
  if (API_KEY) {
    config.headers['X-API-Key'] = API_KEY;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('❌ 401 Unauthorized: Check API key in .env.local');
      console.error('Make sure NEXT_PUBLIC_GATEWAY_API_KEY is set to: cc0108c5-5939-4d3a-b4ac-4da6bb4f52de');
    }
    return Promise.reject(error);
  }
);

