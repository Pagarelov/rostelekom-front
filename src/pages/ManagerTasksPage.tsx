import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, message, Tag, Progress } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../api/taskApi';
import { userApi } from '../api/userApi';
import type { Task, TaskRequest, User } from '../types';
import dayjs from 'dayjs';

const ManagerTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const data = await userApi.getUsers();
      console.log('Все пользователи:', data); // Отладочная информация
      // Временно показываем всех пользователей для тестирования
      const employees = data.filter(u => u.role === 'employee' || u.role === 'manager');
      console.log('Сотрудники (employee + manager):', employees); // Отладочная информация
      setUsers(employees);
    } catch (error) {
      message.error('Ошибка при загрузке сотрудников');
    }
  };

  const fetchTasks = async (employeeId?: number) => {
    setLoading(true);
    try {
      if (employeeId) {
        const data = await taskApi.getTasksByEmployeeId(employeeId);
        setTasks(data);
      } else if (users.length > 0) {
        // Загружаем задачи всех сотрудников
        const allTasks = await Promise.all(
          users.map(user => taskApi.getTasksByEmployeeId(user.id))
        );
        setTasks(allTasks.flat());
      }
    } catch (error) {
      message.error('Ошибка при загрузке задач');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchTasks(selectedEmployee || undefined);
    }
  }, [users, selectedEmployee]);

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    console.log('handleSubmit вызван с данными:', values);
    try {
      const taskData: TaskRequest = {
        employee_id: values.employee_id,
        title: values.title,
        description: values.description,
        deadline: values.deadline.format('YYYY-MM-DDTHH:mm:ssZ'),
        progress: 0,
        status: 'pending',
      };
      console.log('Отправляемые данные задачи:', taskData);
      await taskApi.createTask(taskData);
      message.success('Задача создана');
      setModalVisible(false);
      fetchTasks(selectedEmployee || undefined);
    } catch (error) {
      console.error('Ошибка при создании задачи:', error);
      message.error('Ошибка при создании задачи');
    }
  };

  const getDeadlineColor = (deadline: string) => {
    const now = dayjs();
    const deadlineDate = dayjs(deadline);
    const daysLeft = deadlineDate.diff(now, 'day');
    
    if (daysLeft < 0) return 'red';
    if (daysLeft <= 3) return 'orange';
    return 'green';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Сотрудник',
      dataIndex: 'employee_id',
      key: 'employee_id',
      render: (employeeId: number) => {
        const user = users.find(u => u.id === employeeId);
        return user?.name || employeeId;
      },
    },
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Прогресс',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number) => <Progress percent={progress} size="small" />,
    },
    {
      title: 'Дедлайн',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline: string) => (
        <Tag color={getDeadlineColor(deadline)}>
          {dayjs(deadline).format('DD.MM.YYYY')}
        </Tag>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          pending: { text: 'Ожидает', color: 'default' },
          in_progress: { text: 'В работе', color: 'processing' },
          completed: { text: 'Завершена', color: 'success' },
        };
        const s = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: any, record: Task) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/tasks/${record.id}`)}
        >
          Подробнее
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Задачи</h1>
        <Space>
          <Select
            placeholder="Все сотрудники"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => setSelectedEmployee(value)}
          >
            {users.map(user => (
              <Select.Option key={user.id} value={user.id}>
                {user.name}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Создать задачу
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="Создать задачу"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
         <Form
           form={form}
           layout="vertical"
           onFinish={handleSubmit}
           onFinishFailed={(errorInfo) => {
             console.log('Ошибка валидации формы:', errorInfo);
           }}
         >
          <Form.Item
            name="employee_id"
            label="Сотрудник"
            rules={[{ required: true, message: 'Выберите сотрудника' }]}
          >
            <Select placeholder="Выберите сотрудника">
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Название задачи"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
            rules={[{ required: true, message: 'Введите описание' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="deadline"
            label="Дедлайн"
            rules={[{ required: true, message: 'Выберите дедлайн' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>

           <Form.Item>
             <Space>
               <Button 
                 type="primary" 
                 htmlType="submit"
                 onClick={() => {
                   console.log('Нажата кнопка Создать');
                 }}
               >
                 Создать
               </Button>
               <Button onClick={() => setModalVisible(false)}>
                 Отмена
               </Button>
             </Space>
           </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerTasksPage;

