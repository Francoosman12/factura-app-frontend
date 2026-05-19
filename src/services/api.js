import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ============ FACTURAS ============
export const facturasAPI = {
  listar: (params = {}) => api.get('/facturas', { params }).then((r) => r.data),
  obtener: (id) => api.get(`/facturas/${id}`).then((r) => r.data),
  crear: (data) => api.post('/facturas', data).then((r) => r.data),
  actualizar: (id, data) => api.put(`/facturas/${id}`, data).then((r) => r.data),
  eliminar: (id) => api.delete(`/facturas/${id}`).then((r) => r.data),
  siguienteNumero: (prefijo = 'COT-') =>
    api.get('/facturas/siguiente-numero', { params: { prefijo } }).then((r) => r.data),
};

// ============ CLIENTES ============
export const clientesAPI = {
  listar: (search = '') => api.get('/clientes', { params: { search } }).then((r) => r.data),
  obtener: (id) => api.get(`/clientes/${id}`).then((r) => r.data),
  crear: (data) => api.post('/clientes', data).then((r) => r.data),
  actualizar: (id, data) => api.put(`/clientes/${id}`, data).then((r) => r.data),
  eliminar: (id) => api.delete(`/clientes/${id}`).then((r) => r.data),
};

// ============ EMISORES ============
export const emisoresAPI = {
  listar: () => api.get('/emisores').then((r) => r.data),
  obtener: (id) => api.get(`/emisores/${id}`).then((r) => r.data),
  crear: (data) => api.post('/emisores', data).then((r) => r.data),
  actualizar: (id, data) => api.put(`/emisores/${id}`, data).then((r) => r.data),
  eliminar: (id) => api.delete(`/emisores/${id}`).then((r) => r.data),
};

export default api;