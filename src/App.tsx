import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmployeesPage from './pages/EmployeesPage';
import ManagerTasksPage from './pages/ManagerTasksPage';
import MyTasksPage from './pages/MyTasksPage';
import TaskDetailPage from './pages/TaskDetailPage';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'manager') {
    return <ManagerTasksPage />;
  }
  
  return <MyTasksPage />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/employees"
            element={
              <ProtectedRoute requiredRole="manager">
                <AppLayout>
                  <EmployeesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TaskDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
