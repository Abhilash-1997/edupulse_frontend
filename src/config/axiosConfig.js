import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include credentials for CORS
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // If token exists, attach to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to normalize response shape
// Some Spring Boot controllers (e.g. StudentController) return raw entities
// without the ApiResponse { success, message, data } wrapper. This normalizer
// detects those and wraps them so pages can always use response.data.data.
api.interceptors.response.use(
  (response) => {
    // Skip normalization for blob/binary responses (PDF downloads, etc.)
    if (response.config?.responseType === 'blob' || response.config?.responseType === 'arraybuffer') {
      return response;
    }

    const data = response.data;

    // If the response already has ApiResponse structure, pass through
    if (data && typeof data === 'object' && 'success' in data) {
      return response;
    }

    // Otherwise, wrap raw data into ApiResponse-like structure
    // This handles controllers that return ResponseEntity<T> directly
    response.data = {
      success: true,
      message: 'OK',
      data: data
    };

    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - user doesn't have permission
          break;
        case 404:
          // Not found
          break;
        case 500:
          // Server error
          break;
        default:
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
    } else {
      // Something happened in setting up the request
    }

    return Promise.reject(error);
  }
);

export default api;
