import { useState, useCallback } from 'react';

interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const addNotification = useCallback((type: NotificationState['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: NotificationState = { id, type, message };
    
    setNotifications(prev => [...prev, notification]);
    
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    return addNotification('success', message);
  }, [addNotification]);

  const showError = useCallback((message: string) => {
    return addNotification('error', message);
  }, [addNotification]);

  const showWarning = useCallback((message: string) => {
    return addNotification('warning', message);
  }, [addNotification]);

  const showInfo = useCallback((message: string) => {
    return addNotification('info', message);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};