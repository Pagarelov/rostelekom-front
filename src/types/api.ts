// API Types based on Swagger documentation

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'employee' | 'manager';
  created_at: string;
  updated_at: string;
}

export interface UserRequest {
  username: string;
  name: string;
  password: string;
  role: 'employee' | 'manager';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: 'employee' | 'manager';
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  progress: number;
  deadline: string;
  employee_id: number;
  created_at: string;
  updated_at: string;
}

export interface TaskRequest {
  title: string;
  description: string;
  status: string;
  progress: number;
  deadline: string;
  employee_id: number;
}

export interface LoginResponse {
  token: string;
  role: 'employee' | 'manager';
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  progress: number;
  deadline: string;
  employee_id: number;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  user_id: number;
  username: string;
  role: 'employee' | 'manager';
  iat?: number;
  exp?: number;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  text: string;
  created_at: string;
}

export interface CommentRequest {
  task_id: number;
  text: string;
}

export interface ApiError {
  [key: string]: string;
}
