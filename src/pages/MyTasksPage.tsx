import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tasksAPI } from '../services/api';
import type { Task } from '../types/api';
import CommentsSection from '../components/CommentsSection';

interface TaskEditState {
  progress: number;
  status: string;
  isDirty: boolean;
  isSaving: boolean;
  error?: string;
  success?: string;
}

const MyTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [taskUpdates, setTaskUpdates] = useState<Record<number, TaskEditState>>({});

  useEffect(() => {
    if (user?.id) {
      fetchMyTasks();
    }
  }, [user?.id]);

  const initializeTaskEdits = (tasksData: Task[]) => {
    const nextState: Record<number, TaskEditState> = {};

    tasksData.forEach(task => {
      nextState[task.id] = {
        progress: task.progress ?? 0,
        status: task.status ?? 'pending',
        isDirty: false,
        isSaving: false,
        error: undefined,
        success: undefined,
      };
    });

    setTaskUpdates(nextState);
  };

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
      initializeTaskEdits(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Ошибка загрузки задач:', error);
      setError(error.response?.data?.message || 'Ошибка загрузки задач');
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeDeadline = (deadline: string) => {
    const parsedDeadline = new Date(deadline);
    return Number.isNaN(parsedDeadline.getTime())
      ? deadline
      : parsedDeadline.toISOString();
  };

  const handleProgressChange = (taskId: number, nextProgress: number) => {
    setTaskUpdates(prev => {
      const current = prev[taskId] ?? {
        progress: tasks.find(t => t.id === taskId)?.progress ?? 0,
        status: tasks.find(t => t.id === taskId)?.status ?? 'pending',
        isDirty: false,
        isSaving: false,
        error: undefined,
        success: undefined,
      };

      if (current.isSaving) {
        return prev;
      }

      const safeProgress = Number.isNaN(nextProgress) ? current.progress : nextProgress;
      const clampedProgress = Math.min(100, Math.max(0, safeProgress));
      let nextStatus = current.status;

      if (clampedProgress === 100) {
        nextStatus = 'completed';
      } else if (clampedProgress === 0) {
        nextStatus = 'pending';
      } else if (nextStatus === 'pending') {
        nextStatus = 'in_progress';
      }

      return {
        ...prev,
        [taskId]: {
          ...current,
          progress: clampedProgress,
          status: nextStatus,
          isDirty: true,
          error: undefined,
          success: undefined,
        },
      };
    });
  };

  const handleStatusChange = (taskId: number, status: string) => {
    setTaskUpdates(prev => {
      const current = prev[taskId];
      if (!current || current.isSaving) {
        return prev;
      }

      let progress = current.progress;

      if (status === 'completed') {
        progress = 100;
      } else if (status === 'pending' && progress !== 0) {
        progress = 0;
      } else if (status === 'in_progress' && progress === 0) {
        progress = 10;
      }

      return {
        ...prev,
        [taskId]: {
          ...current,
          status,
          progress,
          isDirty: true,
          error: undefined,
          success: undefined,
        },
      };
    });
  };

  const handleResetTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: {
        progress: task.progress ?? 0,
        status: task.status ?? 'pending',
        isDirty: false,
        isSaving: false,
        error: undefined,
        success: undefined,
      },
    }));
  };

  const refreshTaskFromServer = async (taskId: number) => {
    try {
      const response = await tasksAPI.getById(taskId);
      const updatedTask = response.data;

      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      setTaskUpdates(prev => ({
        ...prev,
        [taskId]: {
          progress: updatedTask.progress ?? 0,
          status: updatedTask.status ?? 'pending',
          isDirty: false,
          isSaving: false,
          error: undefined,
          success: 'Изменения сохранены',
        },
      }));
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      const message = errorResponse.response?.data?.message || 'Не удалось получить обновлённую задачу';

      setError(message);
      setTaskUpdates(prev => ({
        ...prev,
        [taskId]: {
          ...(prev[taskId] ?? {
            progress: 0,
            status: 'pending',
            isDirty: false,
            isSaving: false,
          }),
          isSaving: false,
          error: message,
          success: undefined,
        },
      }));
    }
  };

  const handleSaveTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    const taskEditState = taskUpdates[taskId];

    if (!task || !taskEditState || taskEditState.isSaving || !taskEditState.isDirty) {
      return;
    }

    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: {
        ...taskEditState,
        isSaving: true,
        error: undefined,
        success: undefined,
      },
    }));

    try {
      await tasksAPI.update(taskId, {
        title: task.title,
        description: task.description,
        status: taskEditState.status,
        progress: taskEditState.progress,
        deadline: normalizeDeadline(task.deadline),
        employee_id: task.employee_id,
      });

      await refreshTaskFromServer(taskId);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      const message = errorResponse.response?.data?.message || 'Ошибка обновления задачи';

      setError(message);
      setTaskUpdates(prev => ({
        ...prev,
        [taskId]: {
          ...(prev[taskId] ?? {
            progress: task.progress ?? 0,
            status: task.status ?? 'pending',
            isDirty: false,
            isSaving: false,
          }),
          isSaving: false,
          error: message,
          success: undefined,
        },
      }));
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

  const isOverdue = (task: Task) => {
    const deadlineDate = new Date(task.deadline);
    const status = taskUpdates[task.id]?.status ?? task.status;

    if (Number.isNaN(deadlineDate.getTime())) {
      return false;
    }

    return deadlineDate < new Date() && status !== 'completed';
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
          {tasks.map(task => {
            const taskEdit = taskUpdates[task.id] ?? {
              progress: task.progress ?? 0,
              status: task.status ?? 'pending',
              isDirty: false,
              isSaving: false,
              error: undefined,
              success: undefined,
            };

            return (
              <div
                key={task.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  borderLeft: isOverdue(task) ? '4px solid var(--danger-color)' : '4px solid var(--accent-color)',
                  transition: 'box-shadow 0.25s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', flex: 1 }}>{task.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ 
                      backgroundColor: getStatusColor(taskEdit.status), 
                      color: 'white', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(taskEdit.status)}
                    </span>
                    {taskEdit.isDirty && !taskEdit.isSaving && (
                      <span style={{ color: '#ffc107', fontSize: '12px', fontWeight: 'bold' }}>Изменения не сохранены</span>
                    )}
                    {taskEdit.isSaving && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Сохранение...</span>
                    )}
                    {isOverdue(task) && (
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
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{taskEdit.progress}%</span>
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
                      width: `${taskEdit.progress}%`,
                      height: '100%',
                      backgroundColor: 'var(--accent-color)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Обновить прогресс:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={taskEdit.progress}
                      onChange={(e) => handleProgressChange(task.id, Number(e.target.value))}
                      disabled={taskEdit.isSaving}
                      style={{ 
                        flex: 1, 
                        minWidth: '160px',
                        maxWidth: '240px',
                        accentColor: 'var(--accent-color)'
                      }}
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={taskEdit.progress}
                      onChange={(e) => handleProgressChange(task.id, Number(e.target.value))}
                      disabled={taskEdit.isSaving}
                      style={{
                        width: '70px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Статус:</span>
                    <select
                      value={taskEdit.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      disabled={taskEdit.isSaving}
                      style={{ 
                        minWidth: '160px',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="pending">Ожидает</option>
                      <option value="in_progress">В работе</option>
                      <option value="completed">Завершена</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => handleSaveTask(task.id)}
                      disabled={!taskEdit.isDirty || taskEdit.isSaving}
                      style={{
                        backgroundColor: 'var(--accent-color)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '6px',
                        cursor: !taskEdit.isDirty || taskEdit.isSaving ? 'not-allowed' : 'pointer',
                        opacity: !taskEdit.isDirty || taskEdit.isSaving ? 0.6 : 1,
                        transition: 'background-color 0.25s'
                      }}
                      onMouseEnter={(e) => {
                        if (!(!taskEdit.isDirty || taskEdit.isSaving)) {
                          e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                      }}
                    >
                      {taskEdit.isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetTask(task.id)}
                      disabled={taskEdit.isSaving || !taskEdit.isDirty}
                      style={{
                        backgroundColor: 'var(--text-muted)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '6px',
                        cursor: taskEdit.isSaving || !taskEdit.isDirty ? 'not-allowed' : 'pointer',
                        opacity: taskEdit.isSaving || !taskEdit.isDirty ? 0.6 : 1,
                        transition: 'background-color 0.25s'
                      }}
                      onMouseEnter={(e) => {
                        if (!(taskEdit.isSaving || !taskEdit.isDirty)) {
                          e.currentTarget.style.backgroundColor = '#6c757d';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--text-muted)';
                      }}
                    >
                      Отменить изменения
                    </button>
                  </div>

                  {(taskEdit.error || taskEdit.success) && (
                    <div style={{ marginTop: '0.75rem' }}>
                      {taskEdit.error && (
                        <div style={{
                          color: 'var(--danger-color)',
                          backgroundColor: 'rgba(220, 53, 69, 0.1)',
                          border: '1px solid var(--danger-color)',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          fontSize: '13px'
                        }}>
                          {taskEdit.error}
                        </div>
                      )}
                      {taskEdit.success && (
                        <div style={{
                          color: 'var(--success-color)',
                          backgroundColor: 'rgba(40, 167, 69, 0.1)',
                          border: '1px solid var(--success-color)',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          fontSize: '13px'
                        }}>
                          {taskEdit.success}
                        </div>
                      )}
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
                    <span style={{ color: isOverdue(task) ? 'var(--danger-color)' : 'var(--text-primary)' }}>
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
            );
          })}
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
