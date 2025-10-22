import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType } from '../types';
import { authApi } from '../api/authApi';
import { message } from 'antd';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем наличие токена и пользователя в localStorage при загрузке
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password });
      setToken(response.token);
      localStorage.setItem('token', response.token);
      
      // Получаем полную информацию о пользователе
      try {
        const userResponse = await fetch('/api/v1/users', {
          headers: {
            'Authorization': `Bearer ${response.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const users = await userResponse.json();
          const currentUser = users.find((u: User) => u.username === username);
          
          if (currentUser) {
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
            message.success('Вход выполнен успешно!');
            return;
          }
        }
      } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
      }
      
      // Fallback - если не удалось получить данные пользователя
      const userInfo: User = {
        id: 0,
        username,
        name: username,
        role: response.role as 'manager' | 'employee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
      message.success('Вход выполнен успешно!');
    } catch (error) {
      message.error('Неверное имя пользователя или пароль');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.info('Вы вышли из системы');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

