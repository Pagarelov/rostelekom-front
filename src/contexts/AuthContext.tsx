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
        
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          
          setUser({
            id: decoded.user_id,
            username: decoded.username,
            name: decoded.username,
            role: decoded.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        } catch (jwtError) {
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
      
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        
        setUser({
          id: decoded.user_id,
          username: decoded.username,
          name: decoded.username,
          role: decoded.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      } catch (jwtError) {
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
