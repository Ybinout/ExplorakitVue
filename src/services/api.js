import axios from 'axios';
import { clearSession, getSession } from './session';

const origin = process.env.VUE_APP_API_BASE_URL
  || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

const api = axios.create({
  baseURL: `${origin.replace(/\/$/, '')}/api`,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  try {
    const user = getSession();
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  } catch (error) {
    clearSession();
  }
  return config;
});

export default api;
