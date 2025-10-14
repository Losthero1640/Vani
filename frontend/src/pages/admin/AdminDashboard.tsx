import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { AttendanceStats } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import StudentsPage from './StudentsPage';
import SessionsPage from './SessionsPage';
import QRGeneratorPage from './QRGeneratorPage';
import ReportsPage from './ReportsPage';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminAPI.getDashboard();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: '📊' },
        { name: 'Students', href: '/admin/students', icon: '👥' },
        { name: 'Sessions', href: '/admin/sessions', icon: '🏫' },
        { name: 'QR Generator', href: '/admin/qr-generator', icon: '📱' },
        { name: 'Reports', href: '/admin/reports', icon: '📈' },
    ];

    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <Layout title="Admin Dashboard">
            <div className="flex">
                <nav className="w-64 bg-white rounded-lg shadow-sm mr-6">
                    <div className="p-4">
                        <ul className="space-y-2">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive(item.href)
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <span className="mr-3">{item.icon}</span>
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                <div className="flex-1">
                    <Routes>
                        <Route path="/" element={<DashboardHome stats={stats} loading={loading} />} />
                        <Route path="/students" element={<StudentsPage />} />
                        <Route path="/sessions" element={<SessionsPage />} />
                        <Route path="/qr-generator" element={<QRGeneratorPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                    </Routes>
                </div>
            </div>
        </Layout>
    );
};

const DashboardHome: React.FC<{ stats: AttendanceStats | null; loading: boolean }> = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                <span className="text-white text-sm font-medium">📚</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats?.total_sessions || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                <span className="text-white text-sm font-medium">✅</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats?.active_sessions || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                <span className="text-white text-sm font-medium">👥</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Students</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats?.total_students || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                <span className="text-white text-sm font-medium">📊</span>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats?.attendance_rate || 0}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Present Today</p>
                        <p className="text-xl font-semibold text-green-600">{stats?.present_today || 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Absent Today</p>
                        <p className="text-xl font-semibold text-red-600">{stats?.absent_today || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};





export default AdminDashboard;