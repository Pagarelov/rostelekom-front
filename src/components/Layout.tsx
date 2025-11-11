import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, role } = useAuth();

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <h1 className="app-nav__brand">Система управления задачами</h1>
        <div className="app-nav__meta">
          <span className="app-nav__user">
            Добро пожаловать, {user?.username} ({role === 'manager' ? 'Руководитель' : 'Сотрудник'})
          </span>
          <button className="app-nav__logout" onClick={logout}>
            Выйти
          </button>
        </div>
      </nav>
      
      <main className="app-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
