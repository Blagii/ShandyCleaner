import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import PopupNotification from './components/PopupNotification';
import { initAnalytics, trackPageView } from './utils/analytics';
import './index.css';

const PageTracker = () => {
  const location = useLocation();
  const { analyticsId } = useConfig();

  useEffect(() => {
    if (analyticsId) {
      initAnalytics(analyticsId);
      trackPageView(location.pathname + location.search);
    }
  }, [location, analyticsId]);

  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <ToastProvider>
          <ConfirmationProvider>
            <AuthProvider>
              <PageTracker />
              <PopupNotification />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </AuthProvider>
          </ConfirmationProvider>
        </ToastProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
