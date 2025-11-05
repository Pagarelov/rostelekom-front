import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { commentsAPI, usersAPI } from '../services/api';
import type { Comment, CommentRequest, User } from '../types/api';
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

  // Загружаем пользователей для комментариев
  useEffect(() => {
    const loadUsersForComments = async () => {
      if (comments.length === 0) return;
      
      // Получаем уникальные ID пользователей из комментариев
      const userIds = [...new Set(comments.map(comment => comment.user_id))];
      
      // Загружаем пользователей, которых еще нет в кэше
      for (const userId of userIds) {
        if (!users.has(userId)) {
          //await fetchUserById(userId);
        }
      }
    };
    
    loadUsersForComments();
  }, [comments]);

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

  // const fetchUserById = async (userId: number) => {
  //   // Если пользователь уже загружен, не загружаем повторно
  //   if (users.has(userId)) {
  //     return users.get(userId);
  //   }

  //   try {
  //     console.log(`Загружаем пользователя с ID: ${userId}`);
  //     const response = await usersAPI.getById(userId);
  //     const userData = response.data;
      
  //     // Добавляем в кэш
  //     setUsers(prev => new Map(prev).set(userId, userData));
  //     console.log(`Пользователь загружен:`, userData);
      
  //     return userData;
  //   } catch (err) {
  //     console.error(`Ошибка загрузки пользователя ${userId}:`, err);
  //     return null;
  //   }
  // };

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
    if (!window.confirm('Вы уверены, что хотите удалить этот комментарий?')) return;
    
    try {
      setIsLoading(true);
      setError('');
      await commentsAPI.delete(commentId);
      await fetchComments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Ошибка удаления комментария');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (userId: number) => {
    // Если это текущий пользователь, показываем его данные
    if (user?.id === userId) {
      return user.username || `Пользователь ${userId}`;
    }
    
    // Проверяем кэш
    const cachedUser = users.get(userId);
    if (cachedUser) {
      return cachedUser.name || cachedUser.username || `Пользователь ${userId}`;
    }
    
    // Загружаем пользователя асинхронно
    //fetchUserById(userId);
    
    // Показываем ID пока загружается
    return `Пользователь ${userId}`;
  };

  const getUserRole = (userId: number) => {
    // Если это текущий пользователь, используем его роль
    if (user?.id === userId) {
      return user.role;
    }
    
    // Проверяем кэш
    const cachedUser = users.get(userId);
    if (cachedUser) {
      return cachedUser.role;
    }
    
    // Загружаем пользователя асинхронно
    //fetchUserById(userId);
    
    // Показываем unknown пока загружается
    return 'unknown';
  };

  const canDeleteComment = (comment: Comment) => {
    return user?.id === comment.user_id || user?.role === 'manager';
  };

  return (
    <div style={{ 
      border: '1px solid var(--border-color)', 
      borderRadius: '8px', 
      padding: '1.5rem',
      backgroundColor: 'var(--bg-secondary)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Комментарии</h3>
      
      {error && (
        <div style={{ 
          color: 'var(--danger-color)', 
          marginBottom: '1rem', 
          padding: '10px', 
          backgroundColor: 'rgba(220, 53, 69, 0.1)', 
          border: '1px solid var(--danger-color)',
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Добавить комментарий:
          </label>
          <textarea
            {...register('text', { required: 'Текст комментария обязателен' })}
            rows={3}
            placeholder="Введите ваш комментарий..."
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid var(--border-color)', 
              borderRadius: '6px',
              resize: 'vertical',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
          {errors.text && (
            <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>
              {errors.text.message}
            </span>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'background-color 0.25s'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--accent-color)';
            }
          }}
        >
          {isLoading ? 'Отправка...' : 'Отправить комментарий'}
        </button>
      </form>

      {/* Comments List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {isLoading && comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка комментариев...</p>
        ) : comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Комментариев пока нет
          </p>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: 'var(--bg-tertiary)',
                transition: 'box-shadow 0.25s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{getUserName(comment.user_id)}</strong>
                  <span style={{ 
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: getUserRole(comment.user_id) === 'manager' ? 'var(--info-color)' : 'var(--text-muted)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {getUserRole(comment.user_id) === 'manager' ? 'Руководитель' : 'Сотрудник'}
                  </span>
                </div>
                
                {canDeleteComment(comment) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    style={{
                      backgroundColor: 'var(--danger-color)',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'background-color 0.25s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#c82333';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--danger-color)';
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>
              
              <p style={{ margin: '0.5rem 0', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                {comment.text}
              </p>
              
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {new Date(comment.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
