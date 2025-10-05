import { useState, useCallback } from 'react';

interface AlertState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    duration: 4000,
  });

  const showAlert = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration?: number
  ) => {
    console.log('useCustomAlert: Showing alert', { type, title, message, duration });
    setAlertState({
      visible: true,
      type,
      title,
      message,
      duration: duration || 4000,
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    showAlert('success', title, message, duration);
  }, [showAlert]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    showAlert('error', title, message, duration);
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    showAlert('warning', title, message, duration);
  }, [showAlert]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    showAlert('info', title, message, duration);
  }, [showAlert]);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    alertState,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideAlert,
  };
};
