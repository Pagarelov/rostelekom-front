import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { jwtDecode } from 'jwt-decode';
import { commentsAPI, usersAPI } from '../services/api';
import type { Comment, CommentRequest, User, JwtPayload } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

interface CommentsSectionProps {
  taskId: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<Map<number, User>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CommentRequest>();

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  useEffect(() => {
    const loadUsersForComments = async () => {
      if (comments.length === 0) return;
      
      const userIds = [...new Set(comments.map(comment => comment.user_id))];
      
      await Promise.all(
        userIds.map(async (userId) => {
          if (!users.has(userId)) {
            await fetchUserById(userId);
          }
        })
      );
    };
    
    loadUsersForComments();
  }, [comments, users]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await commentsAPI.getByTaskId(taskId);
      setComments(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Ошибка загрузки комментариев');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserById = async (userId: number) => {
    if (users.has(userId)) {
      return users.get(userId);
    }

    try {
      const response = await usersAPI.getById(userId);
      const userData = response.data;
      setUsers(prev => {
        const updated = new Map(prev);
        updated.set(userId, userData);
        return updated;
      });
      return userData;
    } catch (err) {
      console.error(`Ошибка загрузки пользователя ${userId}:`, err);
      return null;
    }
  };

  const onSubmit = async (data: CommentRequest) => {
    try {
      setIsLoading(true);
      setError('');
      await commentsAPI.create({ ...data, task_id: taskId });
      reset();
      await fetchComments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Ошибка создания комментария');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Требуется авторизация');
        return;
      }
      
      if (!user) {
        setError('Пользователь не авторизован');
        return;
      }
      
      let tokenRole: string | null = null;
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        tokenRole = decoded.role;
      } catch (e) {
        console.warn('Failed to decode token:', e);
      }
      
      console.log('Deleting comment:', {
        commentId,
        userId: user.id,
        userRole: user.role,
        tokenRole,
        isManager: user.role === 'manager',
        tokenRoleIsManager: tokenRole === 'manager'
      });
      
      const comment = comments.find(c => c.id === commentId);
      if (!comment) {
        setError('Комментарий не найден');
        return;
      }
      
      if (tokenRole !== 'manager' && comment.user_id !== user.id) {
        setError('Только руководитель может удалять комментарии других пользователей');
        return;
      }
      
      await commentsAPI.delete(commentId);
      await fetchComments();
    } catch (err: unknown) {
      const error = err as { 
        response?: { 
          status?: number;
          data?: { message?: string } 
        } 
      };
      
      console.error('Delete comment error:', error);
      
      if (error.response?.status === 403) {
        setError('Недостаточно прав для удаления комментария. Убедитесь, что вы вошли как руководитель.');
      } else {
        setError(error.response?.data?.message || 'Ошибка удаления комментария');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (userId: number) => {
    if (user?.id === userId) {
      return user.username || `Пользователь ${userId}`;
    }
    
    const cachedUser = users.get(userId);
    if (cachedUser) {
      return cachedUser.name || cachedUser.username || `Пользователь ${userId}`;
    }
    
    void fetchUserById(userId);
    
    return `Пользователь ${userId}`;
  };

  const getUserRole = (userId: number) => {
    if (user?.id === userId) {
      return user.role;
    }
    
    const cachedUser = users.get(userId);
    if (cachedUser) {
      return cachedUser.role;
    }
    
    void fetchUserById(userId);
    
    return 'unknown';
  };

  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    // Пользователь может удалить свой комментарий
    if (user.id === comment.user_id) return true;
    // Руководитель может удалить любой комментарий
    if (user.role === 'manager') return true;
    return false;
  };

  return (
    <div className="comments-card glass-card">
      <h3 className="comments-title">Комментарии</h3>

      {error && (
        <div className="auth-message auth-message-error comments-error">
          {error}
        </div>
      )}

      <form className="form-card comments-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-card__field">
          <label htmlFor={`comment-text-${taskId}`}>Добавить комментарий</label>
          <textarea
            id={`comment-text-${taskId}`}
            rows={3}
            placeholder="Введите ваш комментарий..."
            {...register('text', { required: 'Текст комментария обязателен' })}
          />
          {errors.text && <span className="form-card__error">{errors.text.message}</span>}
        </div>

        <button className="pill-button comments-submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Отправка...' : 'Отправить комментарий'}
        </button>
      </form>

      <div className="comments-list">
        {isLoading && comments.length === 0 ? (
          <p className="muted-text comments-empty muted-text--center">Загрузка комментариев...</p>
        ) : comments.length === 0 ? (
          <p className="muted-text comments-empty comments-empty--italic muted-text--center">
            Комментариев пока нет
          </p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-item__header">
                <div className="comment-item__author">
                  <span className="comment-item__name">{getUserName(comment.user_id)}</span>
                  <span className={getUserRole(comment.user_id) === 'manager' ? 'tag tag--info' : 'tag'}>
                    {getUserRole(comment.user_id) === 'manager' ? 'Руководитель' : 'Сотрудник'}
                  </span>
                </div>

                {canDeleteComment(comment) && (
                  <button className="chip-button chip-button--danger" onClick={() => handleDelete(comment.id)}>
                    Удалить
                  </button>
                )}
              </div>

              <p className="comment-item__text">{comment.text}</p>

              <div className="comment-item__footer">
                <span className="comment-item__timestamp">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
