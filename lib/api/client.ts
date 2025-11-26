import axios from 'axios';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const API_KEY = process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

// Debug: Always log what we have (will help debug Vercel)
console.log('🔍 API Client Initialized');
console.log('📍 Gateway URL:', API_GATEWAY_URL);
console.log('🔑 API Key exists:', !!API_KEY);
console.log('🔑 API Key length:', API_KEY.length);
console.log('🔑 API Key first 8 chars:', API_KEY.substring(0, 8));

// Debug: Log if API key is missing
if (!API_KEY) {
  console.error('❌ CRITICAL: NEXT_PUBLIC_GATEWAY_API_KEY is NOT SET!');
  console.error('This will cause 401 errors on all API requests');
  console.error('Expected key to start with: cc0108c5');
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
  // Always log what we're sending
  console.log('📤 Making request to:', config.url);
  console.log('🔑 X-API-Key header:', config.headers['X-API-Key'] ? 'SET' : 'EMPTY');
  
  if (API_KEY) {
    config.headers['X-API-Key'] = API_KEY;
    console.log('✅ API Key added to request');
  } else {
    console.error('❌ NO API KEY TO ADD!');
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

