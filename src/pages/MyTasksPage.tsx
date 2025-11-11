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
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      const response = await tasksAPI.getByEmployeeId(user.id);
      setTasks(response.data);
      initializeTaskEdits(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
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

  const getStatusTagClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'tag tag--success';
      case 'in_progress':
        return 'tag tag--warning';
      case 'pending':
        return 'tag';
      default:
        return 'tag';
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
    <section className="page-section">
      <div>
        <h1 className="page-title">Мои задачи</h1>
        <p className="page-subtitle">
          Обновляйте прогресс и оставляйте комментарии по задачам, назначенным вам руководителем.
        </p>
      </div>

      {error && (
        <div className="auth-message auth-message-error">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="muted-text muted-text--center">Загрузка задач...</p>
      ) : (
        <div className="page-grid page-grid--spacious">
          {tasks.map(task => {
            const taskEdit = taskUpdates[task.id] ?? {
              progress: task.progress ?? 0,
              status: task.status ?? 'pending',
              isDirty: false,
              isSaving: false,
              error: undefined,
              success: undefined,
            };

            const cardClassName = `glass-card task-card${isOverdue(task) ? ' task-card--overdue' : ''}`;

            return (
              <div key={task.id} className={cardClassName}>
                <div className="task-card__header">
                  <div className="task-card__heading">
                    <h3 className="task-card__title">{task.title}</h3>
                    <p className="task-card__description">{task.description}</p>
                  </div>
                  <div className="task-card__labels">
                    <span className={getStatusTagClass(taskEdit.status)}>{getStatusText(taskEdit.status)}</span>
                    {taskEdit.isDirty && !taskEdit.isSaving && (
                      <span className="task-card__hint task-card__hint--warning">Изменения не сохранены</span>
                    )}
                    {taskEdit.isSaving && (
                      <span className="task-card__hint task-card__hint--muted">Сохранение...</span>
                    )}
                    {isOverdue(task) && <span className="tag tag--danger">Просрочена</span>}
                  </div>
                </div>

                <div className="task-card__section">
                  <div className="task-progress">
                    <div className="task-progress__header">
                      <span>Прогресс выполнения</span>
                      <span>{taskEdit.progress}%</span>
                    </div>
                    <div className="progress-bar task-progress__bar">
                      <div className="progress-fill" style={{ width: `${taskEdit.progress}%` }} />
                    </div>
                  </div>

                  <div className="task-controls">
                    <span className="task-controls__label">Обновить прогресс</span>
                    <div className="task-controls__inputs">
                      <input
                        className="task-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={taskEdit.progress}
                        onChange={(e) => handleProgressChange(task.id, Number(e.target.value))}
                        disabled={taskEdit.isSaving}
                      />
                      <input
                        className="task-number"
                        type="number"
                        min={0}
                        max={100}
                        value={taskEdit.progress}
                        onChange={(e) => handleProgressChange(task.id, Number(e.target.value))}
                        disabled={taskEdit.isSaving}
                      />
                    </div>
                  </div>

                  <div className="task-controls">
                    <span className="task-controls__label">Статус</span>
                    <select
                      className="task-select"
                      value={taskEdit.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      disabled={taskEdit.isSaving}
                    >
                      <option value="pending">Ожидает</option>
                      <option value="in_progress">В работе</option>
                      <option value="completed">Завершена</option>
                    </select>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      className="pill-button"
                      onClick={() => handleSaveTask(task.id)}
                      disabled={!taskEdit.isDirty || taskEdit.isSaving}
                    >
                      {taskEdit.isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                    <button
                      type="button"
                      className="pill-button pill-button--secondary"
                      onClick={() => handleResetTask(task.id)}
                      disabled={taskEdit.isSaving || !taskEdit.isDirty}
                    >
                      Отменить изменения
                    </button>
                  </div>

                  {(taskEdit.error || taskEdit.success) && (
                    <div className="task-card__feedback">
                      {taskEdit.error && (
                        <div className="auth-message auth-message-error">{taskEdit.error}</div>
                      )}
                      {taskEdit.success && (
                        <div className="auth-message auth-message-success">{taskEdit.success}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="task-card__meta">
                  <div className="task-meta__item">
                    <span className="task-meta__label">Создана</span>
                    <span className="task-meta__value">{new Date(task.created_at).toLocaleString()}</span>
                  </div>
                  <div className="task-meta__item">
                    <span className="task-meta__label">Срок</span>
                    <span className={`task-meta__value${isOverdue(task) ? ' task-meta__value--danger' : ''}`}>
                      {new Date(task.deadline).toLocaleString()}
                    </span>
                  </div>
                  <div className="task-meta__item">
                    <span className="task-meta__label">Обновлена</span>
                    <span className="task-meta__value">{new Date(task.updated_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="task-card__comments">
                  <CommentsSection taskId={task.id} />
                </div>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <div className="glass-card task-card task-card--empty">
              <h3 className="task-card__title">У вас пока нет задач</h3>
              <p className="muted-text muted-text--center">Ожидайте назначения задач от руководителя</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default MyTasksPage;
