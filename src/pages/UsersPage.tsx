import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import type { User, UserRequest } from '../types/api';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const navigate = useNavigate();

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

  const getRoleText = (role: string) => {
    return role === 'manager' ? 'Руководитель' : 'Сотрудник';
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
        <h1 className="page-title">Управление пользователями</h1>
        <p className="page-subtitle">
          Создавайте, обновляйте и удаляйте учетные записи сотрудников, контролируйте их роли.
        </p>
      </div>

      {error && (
        <div className="auth-message auth-message-error">
          {error}
        </div>
      )}

      <div className="page-grid page-grid--two">
        {selectedUser && (
          <div className="glass-card">
            <h2 className="card-title">Редактировать пользователя</h2>
            <form className="form-card" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-card__field">
                <label htmlFor="user-username">Имя пользователя</label>
                <input
                  id="user-username"
                  {...register('username', { required: 'Имя пользователя обязательно' })}
                />
                {errors.username && <span className="form-card__error">{errors.username.message}</span>}
              </div>

              <div className="form-card__field">
                <label htmlFor="user-name">Полное имя</label>
                <input
                  id="user-name"
                  {...register('name', { required: 'Полное имя обязательно' })}
                />
                {errors.name && <span className="form-card__error">{errors.name.message}</span>}
              </div>

              <div className="form-card__field">
                <label htmlFor="user-password">Новый пароль (оставьте пустым, чтобы не изменять)</label>
                <input
                  id="user-password"
                  type="password"
                  {...register('password')}
                />
              </div>

              <div className="form-card__field">
                <label htmlFor="user-role">Роль</label>
                <select
                  id="user-role"
                  {...register('role', { required: 'Роль обязательна' })}
                >
                  <option value="employee">Сотрудник</option>
                  <option value="manager">Руководитель</option>
                </select>
                {errors.role && <span className="form-card__error">{errors.role.message}</span>}
              </div>

              <div className="form-actions">
                <button className="pill-button" type="submit" disabled={isLoading}>
                  {isLoading ? 'Сохранение...' : 'Обновить'}
                </button>
                <button
                  className="pill-button pill-button--secondary"
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    reset();
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="glass-card">
          <h2 className="card-title">Список пользователей</h2>
          {isLoading ? (
            <p className="muted-text" style={{ textAlign: 'center' }}>Загрузка...</p>
          ) : (
            <div className="list-card">
              {users.map(user => (
                <div key={user.id} className="list-item">
                  <div className="list-item__header">
                    <div>
                      <h4 className="list-item__title">{user.name}</h4>
                      <p className="muted-text">@{user.username}</p>
                    </div>
                    <div className="list-item__actions">
                      <button className="chip-button chip-button--warning" onClick={() => handleEdit(user)}>
                        Редактировать
                      </button>
                      <button className="chip-button chip-button--danger" onClick={() => handleDelete(user.id)}>
                        Удалить
                      </button>
                    </div>
                  </div>

                  <div className="list-item__footer">
                    <span className="tag">{getRoleText(user.role)}</span>
                    <span className="list-item__timestamp">
                      Создан: {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <p className="muted-text" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                  Пользователей пока нет
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UsersPage;
