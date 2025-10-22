import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { userApi } from '../api/userApi';
import type { User, UserRequest } from '../types';
import dayjs from 'dayjs';

const EmployeesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userApi.getUsers();
      setUsers(data);
    } catch (error) {
      message.error('Ошибка при загрузке сотрудников');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      name: user.name,
      role: user.role,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userApi.deleteUser(id);
      message.success('Сотрудник удален');
      fetchUsers();
    } catch (error) {
      message.error('Ошибка при удалении сотрудника');
    }
  };

  const handleSubmit = async (values: UserRequest) => {
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id, values);
        message.success('Сотрудник обновлен');
      } else {
        await userApi.createUser(values);
        message.success('Сотрудник создан');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('Ошибка при сохранении сотрудника');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Имя пользователя',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => role === 'manager' ? 'Руководитель' : 'Сотрудник',
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Вы уверены?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>Сотрудники</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Добавить сотрудника
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingUser ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="Имя пользователя"
            rules={[{ required: true, message: 'Введите имя пользователя' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: !editingUser, message: 'Введите пароль' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="name"
            label="Полное имя"
            rules={[{ required: true, message: 'Введите полное имя' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Select>
              <Select.Option value="employee">Сотрудник</Select.Option>
              <Select.Option value="manager">Руководитель</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Обновить' : 'Создать'}
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

export default EmployeesPage;

