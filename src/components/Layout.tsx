import React from 'react';
import { Layout as AntLayout, Menu, Button, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TeamOutlined,
  ProjectOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const managerMenuItems = [
    {
      key: '/employees',
      icon: <TeamOutlined />,
      label: 'Сотрудники',
      onClick: () => navigate('/employees'),
    },
    {
      key: '/dashboard',
      icon: <ProjectOutlined />,
      label: 'Задачи',
      onClick: () => navigate('/dashboard'),
    },
  ];

  const employeeMenuItems = [
    {
      key: '/dashboard',
      icon: <ProjectOutlined />,
      label: 'Мои задачи',
      onClick: () => navigate('/dashboard'),
    },
  ];

  const menuItems = user?.role === 'manager' ? managerMenuItems : employeeMenuItems;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          color: 'white', 
          fontSize: 20, 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          Трекер задач
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <AntLayout style={{ marginLeft: 200 }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <div>
            <Text strong>{user?.name}</Text>
            <Text type="secondary" style={{ marginLeft: 16 }}>
              {user?.role === 'manager' ? 'Руководитель' : 'Сотрудник'}
            </Text>
          </div>
          <Button 
            type="text" 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Выход
          </Button>
        </Header>
        <Content style={{ margin: '24px 16px', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default AppLayout;

