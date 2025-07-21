import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCostBreakdown: (id) => api.get(`/products/${id}/cost-breakdown`),
  updateCosts: (id, data) => api.put(`/products/${id}/costs`, data),
};

export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getPricing: (id) => api.get(`/customers/${id}/pricing`),
  updatePricing: (id, productId, price) => 
    api.put(`/customers/${id}/pricing/${productId}`, { price }),
};

export const workersAPI = {
  getAll: () => api.get('/workers'),
  getById: (id) => api.get(`/workers/${id}`),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
  getVacations: (id) => api.get(`/workers/${id}/vacations`),
  addVacation: (id, data) => api.post(`/workers/${id}/vacations`, data),
  removeVacation: (id, vacationId) => api.delete(`/workers/${id}/vacations/${vacationId}`),
};

export const planningAPI = {
  getCurrent: () => api.get('/planning/current'),
  save: (data) => api.post('/planning/save', data),
  getSalesPlan: (weekIndex) => api.get(`/planning/sales/${weekIndex}`),
  getProductionPlan: (weekIndex) => api.get(`/planning/production/${weekIndex}`),
  updateSales: (data) => api.post('/planning/sales', data),
  updateProduction: (data) => api.post('/planning/production', data),
  getInventory: () => api.get('/planning/inventory'),
};

export const dashboardAPI = {
  getKPIs: () => api.get('/dashboard/kpis'),
  getWeeklySummary: () => api.get('/dashboard/weekly-summary'),
  getProductionEfficiency: () => api.get('/dashboard/production-efficiency'),
  getSalesAnalytics: () => api.get('/dashboard/sales-analytics'),
};

export const reportsAPI = {
  generateProductionReport: (params) => api.post('/reports/production', params),
  generateSalesReport: (params) => api.post('/reports/sales', params),
  generateInventoryReport: (params) => api.post('/reports/inventory', params),
  exportData: (type, format) => api.get(`/reports/export/${type}/${format}`, {
    responseType: 'blob'
  }),
};

export default api;