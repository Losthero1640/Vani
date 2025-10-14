import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import VoiceProfilePage from './VoiceProfilePage';
import AttendanceHistoryPage from './AttendanceHistoryPage';
import ScanQRPage from './ScanQRPage';

const StudentDashboard: React.FC = () => {
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/student', icon: '🏠' },
        { name: 'Voice Profile', href: '/student/voice-profile', icon: '🎤' },
        { name: 'Scan QR', href: '/student/scan-qr', icon: '📱' },
        { name: 'Attendance History', href: '/student/history', icon: '📋' },
    ];

    const isActive = (path: string) => {
        if (path === '/student') {
            return location.pathname === '/student';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <Layout title="Student Dashboard">
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
                        <Route path="/" element={<StudentHome />} />
                        <Route path="/voice-profile" element={<VoiceProfilePage />} />
                        <Route path="/scan-qr" element={<ScanQRPage />} />
                        <Route path="/history" element={<AttendanceHistoryPage />} />
                    </Routes>
                </div>
            </div>
        </Layout>
    );
};

const StudentHome: React.FC = () => (
    <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to Voice Attendance System</h2>
            <p className="text-gray-600 mb-4">
                Use this system to mark your attendance using voice verification.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">📝 Setup Voice Profile</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Record your voice to create a unique profile for attendance verification.
                    </p>
                    <Link
                        to="/student/voice-profile"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                        Setup Profile
                    </Link>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">📱 Mark Attendance</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Scan the QR code provided by your instructor to mark attendance.
                    </p>
                    <Link
                        to="/student/scan-qr"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                        Scan QR Code
                    </Link>
                </div>
            </div>
        </div>
    </div>
);



export default StudentDashboard;