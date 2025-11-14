/**
 * API Configuration
 * Handles API base URL for different environments
 */

// Get API URL from environment or use default
const getApiUrl = () => {
  // Production: use environment variable or same origin
  if (import.meta.env.PROD) {
    // Use VITE_API_URL if set, otherwise use same origin (for same-domain deployments)
    return import.meta.env.VITE_API_URL || window.location.origin;
  }
  // Development: use environment variable or localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();
export default API_BASE_URL;

