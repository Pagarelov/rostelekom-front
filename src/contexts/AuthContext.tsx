import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';
import type { LoginRequest, User, JwtPayload } from '../types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  role: 'employee' | 'manager' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<'employee' | 'manager' | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole') as 'employee' | 'manager' | null;
      const username = localStorage.getItem('username');
      
      if (token && userRole) {
        setRole(userRole);
        
        // Декодируем JWT токен для получения данных пользователя
        try {
          console.log('=== ДЕКОДИРОВАНИЕ JWT ТОКЕНА ПРИ ИНИЦИАЛИЗАЦИИ ===');
          console.log('Токен:', token);
          
          const decoded = jwtDecode<JwtPayload>(token);
          console.log('Декодированные данные из токена:', decoded);
          
          setUser({
            id: decoded.user_id,
            username: decoded.username,
            name: decoded.username, // Используем username как имя
            role: decoded.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          console.log('✅ Пользователь установлен из JWT токена при инициализации:', {
            id: decoded.user_id,
            username: decoded.username,
            role: decoded.role
          });
          console.log('=== КОНЕЦ ДЕКОДИРОВАНИЯ JWT ПРИ ИНИЦИАЛИЗАЦИИ ===');
          
        } catch (jwtError) {
          console.error('Ошибка декодирования JWT токена при инициализации:', jwtError);
          // Fallback если не удалось декодировать токен
          setUser({
            id: 0,
            username: username || '',
            name: username || '',
            role: userRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, role: userRole } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('username', credentials.username);
      
      setRole(userRole);
      
      // Декодируем JWT токен для получения данных пользователя
      try {
        console.log('=== ДЕКОДИРОВАНИЕ JWT ТОКЕНА ===');
        console.log('Токен:', token);
        
        const decoded = jwtDecode<JwtPayload>(token);
        console.log('Декодированные данные из токена:', decoded);
        
        setUser({
          id: decoded.user_id,
          username: decoded.username,
          name: decoded.username, // Используем username как имя
          role: decoded.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        console.log('✅ Пользователь установлен из JWT токена:', {
          id: decoded.user_id,
          username: decoded.username,
          role: decoded.role
        });
        console.log('=== КОНЕЦ ДЕКОДИРОВАНИЯ JWT ===');
        
      } catch (jwtError) {
        console.error('Ошибка декодирования JWT токена:', jwtError);
        // Fallback если не удалось декодировать токен
        setUser({
          id: 0,
          username: credentials.username,
          name: credentials.username,
          role: userRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    setUser(null);
    setRole(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
