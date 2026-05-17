import axios from 'axios';
import { io } from 'socket.io-client';

// Use environment variable for backend URL, or fallback to current origin
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

axios.defaults.baseURL = API_BASE_URL;

// Global request interceptor for tokens
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getSocket = (serverId?: string) => {
  const socket = io(API_BASE_URL);
  if (serverId) {
    socket.emit('join-server', serverId);
  }
  return socket;
};

export default axios;
