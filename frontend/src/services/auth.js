// frontend/src/services/auth.js
import api from './api';

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  // store token
  if (res.data && res.data.access_token) {
    localStorage.setItem('token', res.data.access_token);
  }
  return res.data;
}

export async function register(email, password, full_name) {
  const res = await api.post('/auth/register', { email, password, full_name });
  return res.data;
}
