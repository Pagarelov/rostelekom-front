import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { message } from 'antd';

const { Title, Text } = Typography;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string; name: string; role: string }) => {
    setLoading(true);
    try {
      console.log('Отправляемые данные:', values); // Отладочная информация
      await authApi.register(values);
      message.success('Пользователь создан успешно! Теперь вы можете войти в систему.');
      navigate('/login');
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      message.error(error.response?.data?.error || 'Ошибка при создании пользователя');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Трекер задач</Title>
          <Typography.Text type="secondary">
            Создание нового пользователя
          </Typography.Text>
        </div>
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Введите имя пользователя' },
              { min: 3, message: 'Минимум 3 символа' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Имя пользователя" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Минимум 6 символов' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
            />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Введите полное имя' }]}
          >
            <Input 
              prefix={<TeamOutlined />}
              placeholder="Полное имя" 
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Select placeholder="Выберите роль">
              <Select.Option value="employee">Сотрудник</Select.Option>
              <Select.Option value="manager">Руководитель</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              Создать пользователя
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text>
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
