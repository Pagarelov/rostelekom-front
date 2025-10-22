import api from './axiosConfig';
import type { Comment, CommentRequest } from '../types';

export const commentApi = {
  createComment: async (data: CommentRequest): Promise<Comment> => {
    const response = await api.post<Comment>('/comments', data);
    return response.data;
  },

  getCommentById: async (id: number): Promise<Comment> => {
    const response = await api.get<Comment>(`/comments/${id}`);
    return response.data;
  },

  getCommentsByTaskId: async (taskId: number): Promise<Comment[]> => {
    const response = await api.get<Comment[]>('/comments', {
      params: { task_id: taskId },
    });
    return response.data;
  },

  updateComment: async (id: number, data: CommentRequest): Promise<void> => {
    await api.put(`/comments/${id}`, data);
  },

  deleteComment: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },
};

