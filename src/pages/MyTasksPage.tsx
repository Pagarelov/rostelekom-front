import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tasksAPI } from '../services/api';
import type { Task } from '../types/api';
import CommentsSection from '../components/CommentsSection';

const MyTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      fetchMyTasks();
    }
  }, [user?.id]);

  const fetchMyTasks = async () => {
    if (!user?.id) {
      console.log('User ID не найден:', user);
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      console.log('=== ЗАГРУЗКА ЗАДАЧ СОТРУДНИКА ===');
      console.log('Пользователь:', user);
      console.log('Загружаем задачи для пользователя ID:', user.id);
      const response = await tasksAPI.getByEmployeeId(user.id);
      console.log('Получены задачи:', response.data);
      console.log('Количество задач:', response.data.length);
      console.log('=== КОНЕЦ ЗАГРУЗКИ ЗАДАЧ СОТРУДНИКА ===');
      setTasks(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Ошибка загрузки задач:', error);
      setError(error.response?.data?.message || 'Ошибка загрузки задач');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaskProgress = async (taskId: number, newProgress: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = {
        ...task,
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'pending'
      };

      await tasksAPI.update(taskId, {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        progress: updatedTask.progress,
        deadline: updatedTask.deadline,
        employee_id: updatedTask.employee_id
      });

      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления задачи');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#ffc107';
      case 'pending': return '#6c757d';
      default: return '#007bff';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'Завершена';
      case 'in_progress': return 'В работе';
      case 'pending': return 'Ожидает';
      default: return status;
    }
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && !tasks.find(t => t.deadline === deadline)?.status.includes('completed');
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Мои задачи</h1>
      
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

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Загрузка задач...</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tasks.map(task => (
            <div
              key={task.id}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                borderLeft: isOverdue(task.deadline) ? '4px solid var(--danger-color)' : '4px solid var(--accent-color)',
                transition: 'box-shadow 0.25s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{task.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ 
                    backgroundColor: getStatusColor(task.status), 
                    color: 'white', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {getStatusText(task.status)}
                  </span>
                  {isOverdue(task.deadline) && (
                    <span style={{ 
                      backgroundColor: 'var(--danger-color)', 
                      color: 'white', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ПРОСРОЧЕНА
                    </span>
                  )}
                </div>
              </div>
              
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {task.description}
              </p>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Прогресс выполнения:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{task.progress}%</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '12px', 
                  backgroundColor: 'var(--bg-primary)', 
                  borderRadius: '6px',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: `${task.progress}%`,
                    height: '100%',
                    backgroundColor: 'var(--accent-color)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                
                {task.status !== 'completed' && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Обновить прогресс:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={task.progress}
                      onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                      style={{ 
                        flex: 1, 
                        maxWidth: '200px',
                        accentColor: 'var(--accent-color)'
                      }}
                    />
                    <button
                      onClick={() => updateTaskProgress(task.id, 100)}
                      style={{
                        backgroundColor: 'var(--success-color)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'background-color 0.25s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#218838';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--success-color)';
                      }}
                    >
                      Завершить
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '6px',
                fontSize: '14px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Создана:</strong><br />
                  <span style={{ color: 'var(--text-secondary)' }}>{new Date(task.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Срок выполнения:</strong><br />
                  <span style={{ color: isOverdue(task.deadline) ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                    {new Date(task.deadline).toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Обновлена:</strong><br />
                  <span style={{ color: 'var(--text-secondary)' }}>{new Date(task.updated_at).toLocaleString()}</span>
                </div>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <CommentsSection taskId={task.id} />
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#666', marginBottom: '1rem' }}>У вас пока нет задач</h3>
              <p style={{ color: '#999' }}>Ожидайте назначения задач от руководителя</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
