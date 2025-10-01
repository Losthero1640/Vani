import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const ConnectionStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const checkApiStatus = async () => {
            if (!isOnline) {
                setApiStatus('disconnected');
                return;
            }

            setApiStatus('checking');
            try {
                const isHealthy = await apiClient.healthCheck();
                setApiStatus(isHealthy ? 'connected' : 'disconnected');
            } catch {
                setApiStatus('disconnected');
            }
        };

        checkApiStatus();
        const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [isOnline]);

    if (isOnline && apiStatus === 'connected') {
        return null; // Don't show anything when everything is working
    }

    const getStatusInfo = () => {
        if (!isOnline) {
            return {
                color: 'bg-red-500',
                text: 'No internet connection',
                icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728-12.728L18.364 18.364M12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.635 2.25 12 6.615 2.25 12 2.25z" />
                    </svg>
                ),
            };
        }

        if (apiStatus === 'checking') {
            return {
                color: 'bg-yellow-500',
                text: 'Checking connection...',
                icon: (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                ),
            };
        }

        return {
            color: 'bg-red-500',
            text: 'Server connection lost',
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        };
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div className={`${statusInfo.color} text-white px-4 py-2 text-sm flex items-center justify-center space-x-2`}>
                {statusInfo.icon}
                <span>{statusInfo.text}</span>
                {apiStatus === 'disconnected' && (
                    <button
                        onClick={() => window.location.reload()}
                        className="ml-4 text-xs underline hover:no-underline"
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
};

export default ConnectionStatus;