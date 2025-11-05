import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import type { LoginRequest } from '../types/api';

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      setError('');
      await login(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка входа');
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
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Вход в систему</h2>
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
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', color: 'var(--text-primary)' }}>
            Пароль:
          </label>
          <input
            {...register('password', { required: 'Пароль обязателен' })}
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

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
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
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
