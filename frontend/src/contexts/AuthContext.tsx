import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, LoginResponse } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
    user: User | null;
    login: (data: LoginRequest) => Promise<LoginResponse>;
    logout: () => void;
    loading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    setUser(userData);

                    const currentUser = await authAPI.getCurrentUser();
                    setUser(currentUser);
                    localStorage.setItem('user', JSON.stringify(currentUser));
                } catch (error) {
                    console.error('Auth initialization failed:', error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (data: LoginRequest): Promise<LoginResponse> => {
        try {
            const response = await authAPI.login(data);

            if (response.success && response.access_token) {
                localStorage.setItem('access_token', response.access_token);

                const userData: User = {
                    id: response.user_id!,
                    user_type: response.user_type!,
                    username: response.username,
                    student_id: response.student_id,
                    is_active: true,
                };

                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            }

            return response;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setUser(null);

        authAPI.logout().catch(console.error);
    };

    const value: AuthContextType = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};