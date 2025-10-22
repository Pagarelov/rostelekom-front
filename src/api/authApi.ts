import api from './axiosConfig';
import type { LoginRequest, LoginResponse } from '../types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', data);
    return response.data;
  },

  register: async (data: { username: string; password: string; name: string; role: string }) => {
    const response = await api.post('/register', data);
    return response.data;
  },
};

