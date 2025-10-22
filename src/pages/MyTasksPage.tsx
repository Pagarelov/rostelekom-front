import React, { useState, useEffect } from 'react';
import { Card, Progress, Tag, Empty, Spin, Row, Col } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { useAuth } from '../contexts/AuthContext';
import type { Task } from '../types';
import dayjs from 'dayjs';

const MyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Загружаем задачи для пользователя:', user.id, user.name);
      const data = await taskApi.getTasksByEmployeeId(user.id);
      console.log('Полученные задачи:', data);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const getDeadlineColor = (deadline: string) => {
    const now = dayjs();
    const deadlineDate = dayjs(deadline);
    const daysLeft = deadlineDate.diff(now, 'day');
    
    if (daysLeft < 0) return 'red';
    if (daysLeft <= 3) return 'orange';
    return 'green';
  };

  const getDeadlineText = (deadline: string) => {
    const now = dayjs();
    const deadlineDate = dayjs(deadline);
    const daysLeft = deadlineDate.diff(now, 'day');
    
    if (daysLeft < 0) return `Просрочено на ${Math.abs(daysLeft)} дн.`;
    if (daysLeft === 0) return 'Сегодня';
    if (daysLeft === 1) return 'Завтра';
    return `Осталось ${daysLeft} дн.`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div>
        <h1>Мои задачи</h1>
        <Empty description="У вас пока нет задач" />
      </div>
    );
  }

  return (
    <div>
      <h1>Мои задачи</h1>
      <Row gutter={[16, 16]}>
        {tasks.map(task => (
          <Col xs={24} sm={12} lg={8} key={task.id}>
            <Card
              hoverable
              onClick={() => navigate(`/tasks/${task.id}`)}
              style={{ height: '100%' }}
            >
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 8 }}>{task.title}</h3>
                <div style={{ 
                  color: '#666', 
                  fontSize: 14,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {task.description}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 4, fontSize: 12, color: '#888' }}>
                  Прогресс выполнения
                </div>
                <Progress 
                  percent={task.progress} 
                  status={task.progress === 100 ? 'success' : 'active'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag 
                  icon={task.progress === 100 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                  color={getDeadlineColor(task.deadline)}
                >
                  {getDeadlineText(task.deadline)}
                </Tag>
                <span style={{ fontSize: 12, color: '#888' }}>
                  {dayjs(task.deadline).format('DD.MM.YYYY')}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default MyTasksPage;

