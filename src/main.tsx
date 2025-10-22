import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import './index.css';
import App from './App.tsx';

// Устанавливаем русскую локаль для dayjs
dayjs.locale('ru');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={ruRU}>
      <App />
    </ConfigProvider>
  </StrictMode>,
);
