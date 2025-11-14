/**
 * API Configuration
 * Handles API base URL for different environments
 */

// Get API URL from environment or use default
const getApiUrl = () => {
  // Check if VITE_API_URL is explicitly set
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  // Production: use environment variable (required for cross-origin deployments)
  if (import.meta.env.PROD) {
    if (envApiUrl) {
      return envApiUrl;
    }
    // If no env var, log warning and try same origin (for same-domain deployments)
    console.warn('VITE_API_URL not set in production. Using same origin. This may cause CORS issues if backend is on different domain.');
    return window.location.origin;
  }
  
  // Development: use environment variable or localhost
  return envApiUrl || 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();

// Log API URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

export default API_BASE_URL;

