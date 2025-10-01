import React, { createContext, useContext, ReactNode } from 'react';
import { useNotification } from '../hooks/useNotification';

interface NotificationContextType {
    showSuccess: (message: string) => string;
    showError: (message: string) => string;
    showWarning: (message: string) => string;
    showInfo: (message: string) => string;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const { showSuccess, showError, showWarning, showInfo, removeNotification } = useNotification();

    const value: NotificationContextType = {
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};