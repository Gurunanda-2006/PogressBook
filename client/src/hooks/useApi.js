import { useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

/**
 * A wrapper hook around our axios instance that handles error catching
 * and auto-logout on 401 Unauthorized responses.
 */
export const useApi = () => {
  const { logout } = useAuth();

  const handleRequest = useCallback(async (requestFn) => {
    try {
      const response = await requestFn();
      return { data: response.data, error: null };
    } catch (error) {
      // If the token expired or is invalid, force logout
      if (error.response && error.response.status === 401) {
        await logout();
      }
      return { 
        data: null, 
        error: error.response?.data?.error || error.message || 'An error occurred' 
      };
    }
  }, [logout]);

  const get = useCallback((url, config) => handleRequest(() => api.get(url, config)), [handleRequest]);
  const post = useCallback((url, data, config) => handleRequest(() => api.post(url, data, config)), [handleRequest]);
  const patch = useCallback((url, data, config) => handleRequest(() => api.patch(url, data, config)), [handleRequest]);
  const del = useCallback((url, config) => handleRequest(() => api.delete(url, config)), [handleRequest]);

  return { get, post, patch, del };
};
