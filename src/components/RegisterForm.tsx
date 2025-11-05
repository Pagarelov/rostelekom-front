import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authAPI } from '../services/api';
import type { UserRequest } from '../types/api';

const RegisterForm: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserRequest>();

  const onSubmit = async (data: UserRequest) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      await authAPI.register(data);
      setSuccess('Регистрация успешна! Теперь вы можете войти в систему.');
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Регистрация</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
            Имя пользователя:
          </label>
          <input
            {...register('username', { required: 'Имя пользователя обязательно' })}
            type="text"
            id="username"
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)'
            }}
          />
          {errors.username && (
            <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>
              {errors.username.message}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
            Полное имя:
          </label>
          <input
            {...register('name', { required: 'Полное имя обязательно' })}
            type="text"
            id="name"
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)'
            }}
          />
          {errors.name && (
            <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>
              {errors.name.message}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
            Пароль:
          </label>
          <input
            {...register('password', { required: 'Пароль обязателен', minLength: { value: 6, message: 'Пароль должен содержать минимум 6 символов' } })}
            type="password"
            id="password"
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)'
            }}
          />
          {errors.password && (
            <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>
              {errors.password.message}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="role" style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
            Роль:
          </label>
          <select
            {...register('role', { required: 'Роль обязательна' })}
            id="role"
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">Выберите роль</option>
            <option value="employee">Сотрудник</option>
            <option value="manager">Руководитель</option>
          </select>
          {errors.role && (
            <span style={{ color: 'var(--danger-color)', fontSize: '14px' }}>
              {errors.role.message}
            </span>
          )}
        </div>

        {error && (
          <div style={{ 
            color: 'var(--danger-color)', 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: 'rgba(220, 53, 69, 0.1)', 
            border: '1px solid var(--danger-color)',
            borderRadius: '4px' 
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            color: 'var(--success-color)', 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: 'rgba(40, 167, 69, 0.1)', 
            border: '1px solid var(--success-color)',
            borderRadius: '4px' 
          }}>
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'var(--success-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'background-color 0.25s'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#218838';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--success-color)';
            }
          }}
        >
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
