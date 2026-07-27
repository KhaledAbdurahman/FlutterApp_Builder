import axios from 'axios';
import { getStoredToken } from '@/utils/auth-storage';

const API_BASE_URL = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_BASE_PORT}/api/`;

const ApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: '*/*',
  },
});

ApiClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

export { API_BASE_URL, ApiClient };
