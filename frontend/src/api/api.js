import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async (config) => {
  const { value: token } = await Preferences.get({ key: 'token' });
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await Preferences.remove({ key: 'token' });
      await Preferences.remove({ key: 'user' });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
