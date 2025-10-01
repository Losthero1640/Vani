import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage: React.FC = () => {
    const { user, login, loading } = useAuth();
    const [userType, setUserType] = useState<'admin' | 'student'>('student');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        student_id: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (user) {
        return <Navigate to={user.user_type === 'admin' ? '/admin' : '/student'} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const loginData = {
                user_type: userType,
                ...(userType === 'admin'
                    ? { username: formData.username, password: formData.password }
                    : { student_id: formData.student_id }
                ),
            };

            const response = await login(loginData);

            if (!response.success) {
                setError(response.message);
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Voice Attendance System
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to mark your attendance
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="flex mb-6">
                        <button
                            type="button"
                            onClick={() => setUserType('student')}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg border ${userType === 'student'
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType('admin')}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg border-t border-r border-b ${userType === 'admin'
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Admin
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {userType === 'admin' ? (
                            <>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                        Username
                                    </label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Enter your username"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
                                    Student ID
                                </label>
                                <input
                                    id="student_id"
                                    name="student_id"
                                    type="text"
                                    required
                                    value={formData.student_id}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Enter your student ID"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            New student? Contact your administrator for enrollment.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;