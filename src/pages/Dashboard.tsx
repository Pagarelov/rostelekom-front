import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { role } = useAuth();

  return (
    <section className="page-section">
      <div>
        <h1 className="page-title">Главная страница</h1>
        <p className="page-subtitle">
          Быстрый доступ ко всем возможностям системы управления задачами.
        </p>
      </div>

      {role === 'manager' ? (
        <div className="page-section">
          <h2 className="section-heading">Панель руководителя</h2>
          <div className="page-grid page-grid--two">
            <div className="glass-card glass-card--interactive">
              <h3 className="card-title">Управление задачами</h3>
              <p className="card-text">Создавайте, назначайте и контролируйте задачи сотрудников.</p>
              <Link to="/tasks" className="cta-link cta-link--primary">
                Перейти к задачам
              </Link>
            </div>
            <div className="glass-card glass-card--interactive">
              <h3 className="card-title">Управление сотрудниками</h3>
              <p className="card-text">Просматривайте информацию о сотрудниках и обновляйте их данные.</p>
              <Link to="/users" className="cta-link cta-link--success">
                Перейти к сотрудникам
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="page-section">
          <h2 className="section-heading">Панель сотрудника</h2>
          <div className="glass-card glass-card--interactive section-card">
            <h3 className="card-title">Мои задачи</h3>
            <p className="card-text">Просматривайте и обновляйте свои задачи, комментируйте прогресс.</p>
            <Link to="/my-tasks" className="cta-link cta-link--primary">
              Перейти к задачам
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
