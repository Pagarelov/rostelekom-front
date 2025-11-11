import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import type { LoginRequest, UserRequest } from '../types/api';

type AuthTab = 'signin' | 'signup';

type RegisterFormData = UserRequest & {
  confirmPassword: string;
};

const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [loginError, setLoginError] = useState<string>('');
  const [registerError, setRegisterError] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRequest['role']>('employee');

  const {
    register: registerLoginField,
    handleSubmit: handleLoginSubmit,
    reset: resetLoginForm,
    formState: { errors: loginErrors },
  } = useForm<LoginRequest>();

  const {
    register: registerSignUpField,
    handleSubmit: handleRegisterSubmit,
    watch: watchRegister,
    reset: resetRegisterForm,
    setValue: setRegisterValue,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
    },
  });

  const passwordValue = watchRegister('password');
  const confirmPasswordValue = watchRegister('confirmPassword');

  useEffect(() => {
    setRegisterValue('role', selectedRole, { shouldValidate: true });
  }, [selectedRole, setRegisterValue]);

  const isPasswordMismatch = useMemo(
    () => !!confirmPasswordValue && passwordValue !== confirmPasswordValue,
    [passwordValue, confirmPasswordValue],
  );

  const onSubmitLogin = async (data: LoginRequest) => {
    try {
      setLoginLoading(true);
      setLoginError('');
      await login(data);
      resetLoginForm();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Не удалось войти. Проверьте данные и попробуйте снова.';
      setLoginError(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const onSubmitRegister = async ({ confirmPassword, ...payload }: RegisterFormData) => {
    if (payload.password !== confirmPassword) {
      setRegisterError('Пароли не совпадают');
      return;
    }

    try {
      setRegisterLoading(true);
      setRegisterError('');
      setRegisterSuccess('');
      await authAPI.register(payload);
      setRegisterSuccess('Регистрация прошла успешно! Теперь можно войти.');
      resetRegisterForm({ username: '', name: '', password: '', confirmPassword: '', role: selectedRole });
      setActiveTab('signin');
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Не удалось завершить регистрацию. Попробуйте снова.';
      setRegisterError(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'signin') {
      setRegisterError('');
      setRegisterSuccess('');
    } else {
      setLoginError('');
    }
  }, [activeTab]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Система управления задачами</h1>
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'signin' ? 'auth-tab-active' : ''}`}
            onClick={() => setActiveTab('signin')}
          >
            Вход
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'signup' ? 'auth-tab-active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Регистрация
          </button>
        </div>

        {activeTab === 'signin' ? (
          <form className="auth-form" onSubmit={handleLoginSubmit(onSubmitLogin)}>
            <div className="auth-field">
              <label htmlFor="login-username" className="auth-label">
                Логин
              </label>
              <input
                id="login-username"
                type="text"
                className="auth-input"
                placeholder="Логин"
                autoComplete="username"
                {...registerLoginField('username', { required: 'Укажите логин' })}
              />
              {loginErrors.username && <span className="auth-error-text">{loginErrors.username.message}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="login-password" className="auth-label">
                Пароль
              </label>
              <input
                id="login-password"
                type="password"
                className="auth-input"
                placeholder="Пароль"
                autoComplete="current-password"
                {...registerLoginField('password', { required: 'Введите пароль' })}
              />
              {loginErrors.password && <span className="auth-error-text">{loginErrors.password.message}</span>}
            </div>

            {loginError && <div className="auth-message auth-message-error">{loginError}</div>}

            <button className="auth-button" type="submit" disabled={loginLoading}>
              {loginLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit(onSubmitRegister)}>
            <input type="hidden" {...registerSignUpField('role', { required: 'Выберите роль' })} />

            <div className="auth-field">
              <label htmlFor="register-name" className="auth-label">
                Полное имя
              </label>
              <input
                id="register-name"
                type="text"
                className="auth-input"
                placeholder="Полное имя"
                autoComplete="name"
                {...registerSignUpField('name', { required: 'Введите полное имя' })}
              />
              {registerErrors.name && <span className="auth-error-text">{registerErrors.name.message}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="register-username" className="auth-label">
                Логин
              </label>
              <input
                id="register-username"
                type="text"
                className="auth-input"
                placeholder="Логин"
                autoComplete="username"
                {...registerSignUpField('username', {
                  required: 'Укажите логин',
                  pattern: {
                    value: /^[a-zA-Z0-9_.-]+$/,
                    message: 'Логин может содержать латиницу, цифры и символы ._-',
                  },
                })}
              />
              {registerErrors.username && <span className="auth-error-text">{registerErrors.username.message}</span>}
            </div>

            <div className="auth-field auth-field-inline">
              <label className="auth-label">Роль</label>
              <div className="auth-role-toggle">
                <button
                  type="button"
                  className={`auth-role-option ${selectedRole === 'employee' ? 'auth-role-option-active' : ''}`}
                  onClick={() => setSelectedRole('employee')}
                >
                  Сотрудник
                </button>
                <button
                  type="button"
                  className={`auth-role-option ${selectedRole === 'manager' ? 'auth-role-option-active' : ''}`}
                  onClick={() => setSelectedRole('manager')}
                >
                  Руководитель
                </button>
              </div>
              {registerErrors.role && <span className="auth-error-text">{registerErrors.role.message}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="register-password" className="auth-label">
                Пароль
              </label>
              <input
                id="register-password"
                type="password"
                className="auth-input"
                placeholder="Пароль"
                autoComplete="new-password"
                {...registerSignUpField('password', {
                  required: 'Введите пароль',
                  minLength: { value: 6, message: 'Минимум 6 символов' },
                })}
              />
              {registerErrors.password && <span className="auth-error-text">{registerErrors.password.message}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm-password" className="auth-label">
                Подтвердите пароль
              </label>
              <input
                id="register-confirm-password"
                type="password"
                className="auth-input"
                placeholder="Подтвердите пароль"
                autoComplete="new-password"
                {...registerSignUpField('confirmPassword', { required: 'Повторите пароль' })}
              />
              {(registerErrors.confirmPassword || isPasswordMismatch) && (
                <span className="auth-error-text">
                  {registerErrors.confirmPassword?.message ?? 'Пароли не совпадают'}
                </span>
              )}
            </div>

            {registerError && <div className="auth-message auth-message-error">{registerError}</div>}
            {registerSuccess && <div className="auth-message auth-message-success">{registerSuccess}</div>}

            <button className="auth-button" type="submit" disabled={registerLoading || isPasswordMismatch}>
              {registerLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;

