import axios from 'axios';
import { auth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = auth.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (token) => api.post('/auth/google', { token }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'tags' && Array.isArray(data[key])) {
        data[key].forEach(tag => formData.append('tags[]', tag));
      } else if (key === 'receipt' && data[key]) {
        formData.append('receipt', data[key]);
      } else {
        formData.append(key, data[key]);
      }
    });
    return api.post('/transactions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importPDF: (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/transactions/import/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getById: (id) => api.get(`/transactions/${id}`),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getStats: (params) => api.get('/transactions/stats/summary', { params }),
  getTrends: (params) => api.get('/transactions/stats/trends', { params }),
};

// Categories API
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  getStats: (id) => api.get(`/categories/${id}/stats`),
};

export default api;