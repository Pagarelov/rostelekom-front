import api from './axiosConfig';
import type { Task, TaskRequest } from '../types';

export const taskApi = {
  createTask: async (data: TaskRequest): Promise<Task> => {
    console.log('taskApi.createTask вызван с данными:', data);
    try {
      const response = await api.post<Task>('/tasks', data);
      console.log('Ответ от сервера:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка в taskApi.createTask:', error);
      throw error;
    }
  },

  getTaskById: async (id: number): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  getTasksByEmployeeId: async (employeeId: number): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks', {
      params: { employee_id: employeeId },
    });
    return response.data;
  },

  updateTask: async (id: number, data: TaskRequest): Promise<void> => {
    await api.put(`/tasks/${id}`, data);
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

