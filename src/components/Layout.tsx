import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, role } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <nav style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        color: 'var(--text-primary)', 
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
          Система управления задачами
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Добро пожаловать, {user?.username} ({role === 'manager' ? 'Руководитель' : 'Сотрудник'})
          </span>
          <button
            onClick={logout}
            style={{
              backgroundColor: 'var(--danger-color)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.25s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#c82333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger-color)';
            }}
          >
            Выйти
          </button>
        </div>
      </nav>
      
      <main style={{ padding: '2rem', backgroundColor: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
