// SchEdu/frontend/src/services/authService.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export async function login(email, password, role) {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
    role,
  });

  // Store token and role in localStorage
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('role', response.data.role);
  if (response.data.id) localStorage.setItem('user_id', String(response.data.id));
  return response.data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getRole() {
  return localStorage.getItem('role');
}
