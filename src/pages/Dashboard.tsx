import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { role } = useAuth();

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Главная страница</h1>
      
      {role === 'manager' ? (
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Панель руководителя</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            <div style={{ 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform 0.25s, box-shadow 0.25s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Управление задачами</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Создавайте и назначайте задачи сотрудникам</p>
              <Link 
                to="/tasks" 
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  marginTop: '1rem',
                  transition: 'background-color 0.25s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                }}
              >
                Перейти к задачам
              </Link>
            </div>
            
            <div style={{ 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform 0.25s, box-shadow 0.25s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Управление сотрудниками</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Просматривайте и управляйте сотрудниками</p>
              <Link 
                to="/users" 
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--success-color)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  marginTop: '1rem',
                  transition: 'background-color 0.25s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#218838';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--success-color)';
                }}
              >
                Перейти к сотрудникам
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Панель сотрудника</h2>
          <div style={{ 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px', 
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            maxWidth: '500px',
            transition: 'transform 0.25s, box-shadow 0.25s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Мои задачи</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Просматривайте и обновляйте свои задачи</p>
            <Link 
              to="/my-tasks" 
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                textDecoration: 'none',
                borderRadius: '6px',
                marginTop: '1rem',
                transition: 'background-color 0.25s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-color)';
              }}
            >
              Перейти к задачам
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
