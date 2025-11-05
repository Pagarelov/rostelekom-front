import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { tasksAPI, usersAPI } from '../services/api';
import type { Task, TaskRequest, User } from '../types/api';
import CommentsSection from '../components/CommentsSection';

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

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
      console.log('=== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ ===');
      console.log('Загружаем список пользователей...');
      const response = await usersAPI.getAll();
      console.log('✅ Получены пользователи:', response.data);
      console.log('Количество пользователей:', response.data.length);
      response.data.forEach((user, index) => {
        console.log(`Пользователь ${index + 1}:`, {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        });
      });
      console.log('=== КОНЕЦ ЗАГРУЗКИ ПОЛЬЗОВАТЕЛЕЙ ===');
      setUsers(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      console.error('❌ Error fetching users:', error);
      
      if (error.response?.status === 403) {
        console.log('Нет доступа к списку пользователей. Создаем тестовых пользователей...');
        // Создаем тестовых пользователей для демонстрации
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
      console.log('Загружаем все задачи. Пользователи:', users);
      
      // Fetch tasks for all employees
      const allTasks: Task[] = [];
      const employeeUsers = users.filter(user => user.role === 'employee');
      console.log('Сотрудники для загрузки задач:', employeeUsers);
      
      for (const user of employeeUsers) {
        try {
          console.log(`Загружаем задачи для сотрудника ${user.name} (ID: ${user.id})`);
          const response = await tasksAPI.getByEmployeeId(user.id);
          console.log(`Получены задачи для ${user.name}:`, response.data);
          allTasks.push(...response.data);
        } catch (err) {
          console.error(`Error fetching tasks for user ${user.id}:`, err);
        }
      }
      
      console.log('Всего загружено задач:', allTasks.length);
      setTasks(allTasks);
    } catch (err) {
      console.error('Ошибка загрузки всех задач:', err);
      setError('Ошибка загрузки задач');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: TaskRequest) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Валидация данных
      if (!data.employee_id) {
        setError('Необходимо выбрать сотрудника');
        return;
      }
      
      if (!data.title || !data.description || !data.status || data.progress < 0 || data.progress > 100) {
        setError('Пожалуйста, заполните все поля корректно');
        return;
      }
      
      // Преобразуем строки в числа и форматируем дату
      const taskData = {
        ...data,
        employee_id: Number(data.employee_id),
        progress: Number(data.progress),
        deadline: new Date(data.deadline).toISOString() // Преобразуем в ISO формат
      };
      
      console.log('=== СОЗДАНИЕ ЗАДАЧИ ===');
      console.log('Исходные данные формы:', data);
      console.log('Обработанные данные:', taskData);
      console.log('Employee ID тип:', typeof taskData.employee_id, 'значение:', taskData.employee_id);
      console.log('Выбранный сотрудник из списка:', users.find(u => u.id === taskData.employee_id));
      
      const response = await tasksAPI.create(taskData);
      console.log('✅ Задача создана успешно:', response.data);
      console.log('=== КОНЕЦ СОЗДАНИЯ ЗАДАЧИ ===');
      reset();
      await fetchAllTasks();
    } catch (err: unknown) {
      const error = err as { 
        response?: { 
          data?: { message?: string; error?: string; details?: any } 
          status?: number
          statusText?: string
        } 
      };
      console.error('Ошибка создания задачи:', error);
      console.error('Детали ошибки:', error.response?.data);
      console.error('Статус:', error.response?.status);
      console.error('Статус текст:', error.response?.statusText);
      
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#ffc107';
      case 'pending': return '#6c757d';
      default: return '#007bff';
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Управление задачами</h1>
      
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Create/Edit Task Form */}
        <div style={{ 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          padding: '1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            {selectedTask ? 'Редактировать задачу' : 'Создать новую задачу'}
          </h2>
          <form onSubmit={handleSubmit(selectedTask ? handleUpdate : onSubmit)}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Название:</label>
              <input
                {...register('title', { required: 'Название обязательно' })}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              />
              {errors.title && <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{errors.title.message}</span>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Описание:</label>
              <textarea
                {...register('description', { required: 'Описание обязательно' })}
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
              {errors.description && <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{errors.description.message}</span>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Сотрудник:</label>
              <select
                {...register('employee_id', { 
                  required: 'Сотрудник обязателен'
                })}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Выберите сотрудника</option>
                {users.filter(u => u.role === 'employee').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {errors.employee_id && <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{errors.employee_id.message}</span>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Статус:</label>
              <select
                {...register('status', { required: 'Статус обязателен' })}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Выберите статус</option>
                <option value="pending">Ожидает</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Завершена</option>
              </select>
              {errors.status && <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{errors.status.message}</span>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Прогресс (%):</label>
              <input
                {...register('progress', { 
                  required: 'Прогресс обязателен', 
                  min: 0, 
                  max: 100
                })}
                type="number"
                min="0"
                max="100"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              />
              {errors.progress && <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{errors.progress.message}</span>}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Срок выполнения:</label>
              <input
                {...register('deadline', { required: 'Срок обязателен' })}
                type="datetime-local"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              />
              {errors.deadline && <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{errors.deadline.message}</span>}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
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
                {isLoading ? 'Сохранение...' : (selectedTask ? 'Обновить' : 'Создать')}
              </button>
              
              {selectedTask && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    reset();
                  }}
                  style={{
                    backgroundColor: 'var(--text-muted)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.25s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6c757d';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--text-muted)';
                  }}
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tasks List */}
        <div style={{ 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          padding: '1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Список задач</h2>
          {isLoading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Загрузка...</p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {tasks.map(task => (
                <div
                  key={task.id}
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
                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{task.title}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(task)}
                        style={{
                          backgroundColor: 'var(--warning-color)',
                          color: 'black',
                          border: 'none',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'background-color 0.25s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e0a800';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--warning-color)';
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{
                          backgroundColor: 'var(--danger-color)',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
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
                    </div>
                  </div>
                  
                  <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>{task.description}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}><strong>Сотрудник:</strong> {getEmployeeName(task.employee_id)}</span>
                    <span style={{ 
                      backgroundColor: getStatusColor(task.status), 
                      color: 'white', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}>
                      {task.status}
                    </span>
                  </div>
                  
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Прогресс:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{task.progress}%</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: 'var(--bg-primary)', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${task.progress}%`,
                        height: '100%',
                        backgroundColor: 'var(--accent-color)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '0.5rem', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div><strong>Создана:</strong> {new Date(task.created_at).toLocaleString()}</div>
                    <div><strong>Срок:</strong> {new Date(task.deadline).toLocaleString()}</div>
                  </div>
                  
                  <div style={{ marginTop: '1rem' }}>
                    <CommentsSection taskId={task.id} />
                  </div>
                </div>
              ))}
              
              {tasks.length === 0 && (
                <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                  Задач пока нет
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
