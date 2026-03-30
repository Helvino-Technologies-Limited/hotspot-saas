import { useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const config = { method, url, ...options };
      if (data) config.data = data;
      const response = await api(config);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred';
      setError(message);
      if (!options.silent) toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = (url, params, opts) => request('GET', url, null, { params, ...opts });
  const post = (url, data, opts) => request('POST', url, data, opts);
  const put = (url, data, opts) => request('PUT', url, data, opts);
  const patch = (url, data, opts) => request('PATCH', url, data, opts);
  const del = (url, opts) => request('DELETE', url, null, opts);

  return { loading, error, get, post, put, patch, delete: del };
};
