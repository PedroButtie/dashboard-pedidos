import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname.includes('localhost') ? 'http://localhost:3001' : window.location.origin);

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(t) {
  localStorage.setItem('token', t);
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export async function login(username, password) {
  const { data } = await api.post('/api/auth/login', { username, password });
  setToken(data.token);
  return data.user;
}

export async function fetchOrders() {
  const { data } = await api.get('/api/orders');
  return data;
}

export async function updateOrderStatus(id, status) {
  const { data } = await api.post(`/api/orders/${id}/status`, { status });
  return data;
}

export const API_BASE = API_URL;
