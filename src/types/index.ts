// Типы для API моделей

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'manager' | 'employee';
  created_at: string;
  updated_at: string;
}

export interface UserRequest {
  username: string;
  password: string;
  name: string;
  role: string;
}

export interface Task {
  id: number;
  employee_id: number;
  title: string;
  description: string;
  deadline: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface TaskRequest {
  employee_id: number;
  title: string;
  description: string;
  deadline: string;
  progress: number;
  status: string;
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

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

