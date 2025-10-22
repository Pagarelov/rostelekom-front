import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Progress, 
  Slider, 
  Button, 
  Space, 
  Input, 
  List, 
  Avatar, 
  Tag, 
  message,
  Spin 
} from 'antd';
import { ArrowLeftOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';
import { taskApi } from '../api/taskApi';
import { commentApi } from '../api/commentApi';
import { userApi } from '../api/userApi';
import { useAuth } from '../contexts/AuthContext';
import type { Task, Comment, User } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<Record<number, User>>({});
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchTask = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const taskData = await taskApi.getTaskById(Number(id));
      setTask(taskData);
      setProgress(taskData.progress);
    } catch (error) {
      message.error('Ошибка при загрузке задачи');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    
    try {
      const commentsData = await commentApi.getCommentsByTaskId(Number(id));
      setComments(commentsData);
      
      // Загружаем информацию о пользователях
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const usersData: Record<number, User> = {};
      
      for (const userId of userIds) {
        try {
          const userData = await userApi.getUserById(userId);
          usersData[userId] = userData;
        } catch (error) {
          console.error('Error fetching user:', userId);
        }
      }
      
      setUsers(usersData);
    } catch (error) {
      message.error('Ошибка при загрузке комментариев');
    }
  };

  useEffect(() => {
    fetchTask();
    fetchComments();
  }, [id]);

  const handleProgressUpdate = async () => {
    if (!task) return;
    
    setSubmitting(true);
    try {
      await taskApi.updateTask(task.id, {
        ...task,
        employee_id: task.employee_id,
        deadline: dayjs(task.deadline).format('YYYY-MM-DD'),
        progress,
        status: progress === 100 ? 'completed' : 'in_progress',
      });
      message.success('Прогресс обновлен');
      fetchTask();
    } catch (error) {
      message.error('Ошибка при обновлении прогресса');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!id || !commentText.trim()) return;
    
    setSubmitting(true);
    try {
      await commentApi.createComment({
        task_id: Number(id),
        text: commentText,
      });
      message.success('Комментарий добавлен');
      setCommentText('');
      fetchComments();
    } catch (error) {
      message.error('Ошибка при добавлении комментария');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !task) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  const isEmployee = user?.role === 'employee';
  const canEditProgress = isEmployee && user?.id === task.employee_id;

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Назад
      </Button>

      <Card title={task.title} style={{ marginBottom: 16 }}>
        <Descriptions column={1}>
          <Descriptions.Item label="Описание">
            {task.description}
          </Descriptions.Item>
          <Descriptions.Item label="Дедлайн">
            <Tag color={dayjs(task.deadline).isBefore(dayjs()) ? 'red' : 'green'}>
              {dayjs(task.deadline).format('DD.MM.YYYY')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Tag color={task.status === 'completed' ? 'success' : 'processing'}>
              {task.status === 'completed' ? 'Завершена' : task.status === 'in_progress' ? 'В работе' : 'Ожидает'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Прогресс">
            <Progress percent={task.progress} />
          </Descriptions.Item>
          <Descriptions.Item label="Создана">
            {dayjs(task.created_at).format('DD.MM.YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>

        {canEditProgress && (
          <div style={{ marginTop: 24 }}>
            <h3>Обновить прогресс</h3>
            <Slider
              value={progress}
              onChange={setProgress}
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
              style={{ marginBottom: 16 }}
            />
            <Button 
              type="primary" 
              onClick={handleProgressUpdate}
              loading={submitting}
              disabled={progress === task.progress}
            >
              Сохранить прогресс
            </Button>
          </div>
        )}
      </Card>

      <Card title="Комментарии">
        <List
          dataSource={comments}
          locale={{ emptyText: 'Пока нет комментариев' }}
          renderItem={(comment) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space>
                    <span>{users[comment.user_id]?.name || 'Пользователь'}</span>
                    <span style={{ fontSize: 12, color: '#888' }}>
                      {dayjs(comment.created_at).format('DD.MM.YYYY HH:mm')}
                    </span>
                  </Space>
                }
                description={comment.text}
              />
            </List.Item>
          )}
        />

        <div style={{ marginTop: 16 }}>
          <TextArea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Добавить комментарий..."
            style={{ marginBottom: 8 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleCommentSubmit}
            loading={submitting}
            disabled={!commentText.trim()}
          >
            Отправить
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TaskDetailPage;

