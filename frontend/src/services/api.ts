import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Error de conexión';
    return Promise.reject(new Error(Array.isArray(msg) ? msg.join(', ') : msg));
  },
);

// --- Customers ---
export const customersApi = {
  getAll: (search?: string) =>
    api.get('/customers', { params: search ? { search } : {} }).then(r => r.data),
  getOne: (id: string) => api.get(`/customers/${id}`).then(r => r.data),
  getByPhone: (phone: string) => api.get(`/customers/telefono/${phone}`).then(r => r.data),
  create: (data: any) => api.post('/customers', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/customers/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// --- Vehicles ---
export const vehiclesApi = {
  getByCustomer: (customerId: string) =>
    api.get(`/vehicles/customer/${customerId}`).then(r => r.data),
  getOne: (id: string) => api.get(`/vehicles/${id}`).then(r => r.data),
  create: (data: any) => api.post('/vehicles', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/vehicles/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
};

// --- Service Records ---
export const servicesApi = {
  getByVehicle: (vehicleId: string) =>
    api.get(`/service-records/vehicle/${vehicleId}`).then(r => r.data),
  getUpcoming: () => api.get('/service-records/upcoming').then(r => r.data),
  getDashboard: () => api.get('/service-records/dashboard').then(r => r.data),
  create: (data: any) => api.post('/service-records', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/service-records/${id}`, data).then(r => r.data),
};

// --- Notifications ---
export const notificationsApi = {
  sendManual: (serviceRecordId: string) =>
    api.post(`/notifications/send/${serviceRecordId}`).then(r => r.data),
  runScheduler: () => api.post('/notifications/run-scheduler').then(r => r.data),
};
