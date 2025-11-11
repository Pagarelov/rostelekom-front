import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { tasksAPI, usersAPI } from '../services/api';
import type { Task, TaskRequest, User } from '../types/api';
import CommentsSection from '../components/CommentsSection';

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskRequest>();

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      // fetchAllTasks будет вызван в useEffect ниже, когда users обновится
    };
    loadData();
  }, []);

  // Отдельный useEffect для загрузки задач, когда users обновится
  useEffect(() => {
    if (users.length > 0) {
      fetchAllTasks();
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      
      if (error.response?.status === 403) {
        const testUsers = [
          { id: 111112, username: '111112', name: 'Сотрудник 1', role: 'employee' as const, created_at: '', updated_at: '' },
          { id: 111113, username: '111113', name: 'Сотрудник 2', role: 'employee' as const, created_at: '', updated_at: '' }
        ];
        setUsers(testUsers);
      } else {
        setError('Ошибка загрузки пользователей');
      }
    }
  };

  const fetchAllTasks = async () => {
    try {
      setIsLoading(true);
      const allTasks: Task[] = [];
      const employeeUsers = users.filter(user => user.role === 'employee');
      
      for (const user of employeeUsers) {
        try {
          const response = await tasksAPI.getByEmployeeId(user.id);
          allTasks.push(...response.data);
        } catch (err) {
          // Игнорируем задачи, которые не удалось загрузить для отдельного сотрудника
        }
      }
      
      setTasks(allTasks);
    } catch (err) {
      setError('Ошибка загрузки задач');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TaskRequest) => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!data.employee_id) {
        setError('Необходимо выбрать сотрудника');
        return;
      }
      
      if (!data.title || !data.description || !data.status || data.progress < 0 || data.progress > 100) {
        setError('Пожалуйста, заполните все поля корректно');
        return;
      }
      
      const taskData = {
        ...data,
        employee_id: Number(data.employee_id),
        progress: Number(data.progress),
        deadline: new Date(data.deadline).toISOString()
      };
      
      await tasksAPI.create(taskData);
      reset();
      await fetchAllTasks();
    } catch (err: unknown) {
      const error = err as { 
        response?: { 
          data?: { message?: string; error?: string } 
          status?: number
          statusText?: string
        } 
      };
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          `Ошибка создания задачи (${error.response?.status}: ${error.response?.statusText})`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    reset({
      title: task.title,
      description: task.description,
      status: task.status,
      progress: task.progress,
      deadline: task.deadline,
      employee_id: task.employee_id
    });
  };

  const handleUpdate = async (data: TaskRequest) => {
    if (!selectedTask) return;
    
    try {
      setIsLoading(true);
      setError('');
      
      // Преобразуем строки в числа и форматируем дату
      const taskData = {
        ...data,
        employee_id: Number(data.employee_id),
        progress: Number(data.progress),
        deadline: new Date(data.deadline).toISOString() // Преобразуем в ISO формат
      };
      
      await tasksAPI.update(selectedTask.id, taskData);
      setSelectedTask(null);
      reset();
      await fetchAllTasks();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Ошибка обновления задачи');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту задачу?')) return;
    
    try {
      setIsLoading(true);
      setError('');
      await tasksAPI.delete(taskId);
      await fetchAllTasks();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Ошибка удаления задачи');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const user = users.find(u => u.id === employeeId);
    return user ? user.name : `ID: ${employeeId}`;
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Завершена';
      case 'in_progress':
        return 'В работе';
      case 'pending':
        return 'Ожидает';
      default:
        return status;
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

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <section className="page-section">
      <button type="button" className="back-link" onClick={handleBack}>
        Назад
      </button>
      <div>
        <h1 className="page-title">Управление задачами</h1>
        <p className="page-subtitle">
          Создавайте, обновляйте и контролируйте задачи сотрудников в едином пространстве.
        </p>
      </div>

      {error && (
        <div className="auth-message auth-message-error">
          {error}
        </div>
      )}

      <div className="page-grid page-grid--two">
        <div className="glass-card">
          <h2 className="card-title">
            {selectedTask ? 'Редактировать задачу' : 'Создать новую задачу'}
          </h2>
          <form className="form-card" onSubmit={handleSubmit(selectedTask ? handleUpdate : onSubmit)}>
            <div className="form-card__field">
              <label htmlFor="task-title">Название</label>
              <input
                id="task-title"
                {...register('title', { required: 'Название обязательно' })}
              />
              {errors.title && <span className="form-card__error">{errors.title.message}</span>}
            </div>

            <div className="form-card__field">
              <label htmlFor="task-description">Описание</label>
              <textarea
                id="task-description"
                rows={3}
                {...register('description', { required: 'Описание обязательно' })}
              />
              {errors.description && <span className="form-card__error">{errors.description.message}</span>}
            </div>

            <div className="form-card__field">
              <label htmlFor="task-employee">Сотрудник</label>
              <select
                id="task-employee"
                {...register('employee_id', { required: 'Сотрудник обязателен' })}
              >
                <option value="">Выберите сотрудника</option>
                {users.filter(u => u.role === 'employee').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {errors.employee_id && <span className="form-card__error">{errors.employee_id.message}</span>}
            </div>

            <div className="form-card__field">
              <label htmlFor="task-status">Статус</label>
              <select
                id="task-status"
                {...register('status', { required: 'Статус обязателен' })}
              >
                <option value="">Выберите статус</option>
                <option value="pending">Ожидает</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершена</option>
              </select>
              {errors.status && <span className="form-card__error">{errors.status.message}</span>}
            </div>

            <div className="form-card__field">
              <label htmlFor="task-progress">Прогресс (%)</label>
              <input
                id="task-progress"
                type="number"
                min="0"
                max="100"
                {...register('progress', { required: 'Прогресс обязателен', min: 0, max: 100 })}
              />
              {errors.progress && <span className="form-card__error">{errors.progress.message}</span>}
            </div>

            <div className="form-card__field">
              <label htmlFor="task-deadline">Срок выполнения</label>
              <input
                id="task-deadline"
                type="datetime-local"
                {...register('deadline', { required: 'Срок обязателен' })}
              />
              {errors.deadline && <span className="form-card__error">{errors.deadline.message}</span>}
            </div>

            <div className="form-actions">
              <button className="pill-button" type="submit" disabled={isLoading}>
                {isLoading ? 'Сохранение...' : (selectedTask ? 'Обновить' : 'Создать')}
              </button>

              {selectedTask && (
                <button
                  className="pill-button pill-button--secondary"
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    reset();
                  }}
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="glass-card">
          <h2 className="card-title">Список задач</h2>
          {isLoading ? (
            <p className="muted-text muted-text--center">Загрузка...</p>
          ) : (
            <div className="list-card">
              {tasks.map(task => (
                <div key={task.id} className="list-item">
                  <div className="list-item__header">
                    <h4 className="list-item__title">{task.title}</h4>
                    <div className="list-item__actions">
                      <button className="chip-button chip-button--warning" onClick={() => handleEdit(task)}>
                        Редактировать
                      </button>
                      <button className="chip-button chip-button--danger" onClick={() => handleDelete(task.id)}>
                        Удалить
                      </button>
                    </div>
                  </div>

                  <p className="list-item__description">{task.description}</p>

                  <div className="list-item__meta-line">
                    <span className="muted-text"><strong>Сотрудник:</strong> {getEmployeeName(task.employee_id)}</span>
                    <span className={getStatusTagClass(task.status)}>{getStatusText(task.status)}</span>
                  </div>

                  <div className="list-item__section">
                    <div className="list-item__meta list-item__meta--between">
                      <span>Прогресс</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="progress-bar progress-bar--compact">
                      <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                    </div>
                  </div>

                  <div className="list-item__footer list-item__footer--spaced">
                    <span className="list-item__timestamp">
                      Создана: {new Date(task.created_at).toLocaleString()}
                    </span>
                    <span className="list-item__timestamp">
                      Срок: {new Date(task.deadline).toLocaleString()}
                    </span>
                  </div>

                  <div className="list-item__section">
                    <CommentsSection taskId={task.id} />
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <p className="muted-text muted-text--center muted-text--italic">
                  Задач пока нет
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TasksPage;
