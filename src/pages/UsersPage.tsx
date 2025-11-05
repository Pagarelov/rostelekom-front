import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { usersAPI } from '../services/api';
import type { User, UserRequest } from '../types/api';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserRequest>();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    reset({
      username: user.username,
      name: user.name,
      role: user.role,
      password: '' // Don't pre-fill password
    });
  };

  const onSubmit = async (data: UserRequest) => {
    if (!selectedUser) return;
    
    try {
      setIsLoading(true);
      setError('');
      await usersAPI.update(selectedUser.id, data);
      setSelectedUser(null);
      reset();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления пользователя');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    
    try {
      setIsLoading(true);
      setError('');
      await usersAPI.delete(userId);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления пользователя');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'manager' ? '#007bff' : '#6c757d';
  };

  const getRoleText = (role: string) => {
    return role === 'manager' ? 'Руководитель' : 'Сотрудник';
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Управление пользователями</h1>
      
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Edit User Form */}
        {selectedUser && (
          <div style={{ 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px', 
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Редактировать пользователя</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Имя пользователя:</label>
                <input
                  {...register('username', { required: 'Имя пользователя обязательно' })}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                />
                {errors.username && <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{errors.username.message}</span>}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Полное имя:</label>
                <input
                  {...register('name', { required: 'Полное имя обязательно' })}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                />
                {errors.name && <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{errors.name.message}</span>}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Новый пароль (оставьте пустым, чтобы не изменять):</label>
                <input
                  {...register('password')}
                  type="password"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Роль:</label>
                <select
                  {...register('role', { required: 'Роль обязательна' })}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="employee">Сотрудник</option>
                  <option value="manager">Руководитель</option>
                </select>
                {errors.role && <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>{errors.role.message}</span>}
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
                  {isLoading ? 'Сохранение...' : 'Обновить'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
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
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div style={{ 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          padding: '1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Список пользователей</h2>
          {isLoading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Загрузка...</p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {users.map(user => (
                <div
                  key={user.id}
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
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{user.name}</h4>
                      <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}>@{user.username}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(user)}
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
                        onClick={() => handleDelete(user.id)}
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
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      backgroundColor: user.role === 'manager' ? 'var(--info-color)' : 'var(--text-muted)',
                      color: 'white', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {getRoleText(user.role)}
                    </span>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Создан: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Пользователей пока нет
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
