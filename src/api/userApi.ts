import api from './axiosConfig';
import type { User, UserRequest } from '../types';

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  createUser: async (data: UserRequest) => {
    const response = await api.post('/register', data);
    return response.data;
  },

  updateUser: async (id: number, data: UserRequest) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

