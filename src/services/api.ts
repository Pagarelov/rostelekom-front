import axios, { type AxiosResponse } from 'axios';
import type { 
  User, 
  UserRequest, 
  LoginRequest, 
  LoginResponse, 
  Task, 
  TaskRequest, 
  Comment, 
  CommentRequest 
} from '../types/api';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> =>
    api.post('/login', data),
  
  register: (data: UserRequest): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/register', data),
};

// Users API
export const usersAPI = {
  getAll: (): Promise<AxiosResponse<User[]>> =>
    api.get('/users'),
  
  getById: (id: number): Promise<AxiosResponse<User>> =>
    api.get(`/users/${id}`),
  
  update: (id: number, data: UserRequest): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/users/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/users/${id}`),
};

// Tasks API
export const tasksAPI = {
  getByEmployeeId: (employeeId: number): Promise<AxiosResponse<Task[]>> =>
    api.get(`/tasks?employee_id=${employeeId}`),
  
  getById: (id: number): Promise<AxiosResponse<Task>> =>
    api.get(`/tasks/${id}`),
  
  create: (data: TaskRequest): Promise<AxiosResponse<Task>> =>
    api.post('/tasks', data),
  
  update: (id: number, data: TaskRequest): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/tasks/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/tasks/${id}`),
};

// Comments API
export const commentsAPI = {
  getByTaskId: (taskId: number): Promise<AxiosResponse<Comment[]>> =>
    api.get(`/comments?task_id=${taskId}`),
  
  getById: (id: number): Promise<AxiosResponse<Comment>> =>
    api.get(`/comments/${id}`),
  
  create: (data: CommentRequest): Promise<AxiosResponse<Comment>> =>
    api.post('/comments', data),
  
  update: (id: number, data: CommentRequest): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/comments/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/comments/${id}`),
};

export default api;
