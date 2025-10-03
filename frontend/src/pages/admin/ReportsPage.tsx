import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { AttendanceSession } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

interface AttendanceData {
    student_id: string;
    student_name: string;
    branch: string;
    year: number;
    status: string;
    verification_score?: number;
    timestamp: string;
    spoken_word?: string;
}

const ReportsPage: React.FC = () => {
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<number | null>(null);
    const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const data = await adminAPI.getSessions();
            setSessions(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch sessions');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async (sessionId: number) => {
        setLoadingAttendance(true);
        try {
            const response = await adminAPI.getSessionAttendance(sessionId);
            setAttendanceData(response.attendance_records || []);
            setSelectedSession(sessionId);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch attendance data');
        } finally {
            setLoadingAttendance(false);
        }
    };

    const handleExport = async (sessionId?: number) => {
        try {
            const blob = await adminAPI.exportAttendance(sessionId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = sessionId
                ? `attendance-session-${sessionId}.csv`
                : 'attendance-all-sessions.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message || 'Failed to export attendance data');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present':
                return 'bg-green-100 text-green-800';
            case 'absent':
                return 'bg-red-100 text-red-800';
            case 'late':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Attendance Reports</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                View and export attendance data
                            </p>
                        </div>
                        <button
                            onClick={() => handleExport()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export All
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Session
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedSession === session.id
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => fetchAttendance(session.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{session.class_name}</h3>
                                            <p className="text-sm text-gray-600">Room: {session.room_number}</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(session.session_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${session.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {session.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedSession && (
                        <div className="border-t pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Attendance Details
                                </h3>
                                <button
                                    onClick={() => handleExport(selectedSession)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export Session
                                </button>
                            </div>

                            {loadingAttendance ? (
                                <div className="flex items-center justify-center h-32">
                                    <LoadingSpinner />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Student ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Student Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Branch & Year
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Class Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Verification Score
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date & Time
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {attendanceData.map((record, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {record.student_id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {record.student_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{record.branch}</div>
                                                        <div className="text-sm text-gray-500">Year {record.year}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {sessions.find(s => s.id === selectedSession)?.class_name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}
                                                        >
                                                            {record.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {record.verification_score
                                                            ? `${(record.verification_score * 100).toFixed(1)}%`
                                                            : 'N/A'
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(record.timestamp).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {attendanceData.length === 0 && (
                                        <div className="text-center py-8">
                                            <div className="text-gray-400 mb-2">
                                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-sm font-medium text-gray-900">No attendance records</h3>
                                            <p className="text-sm text-gray-500">No students have marked attendance for this session yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {sessions.length === 0 && (
                        <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">No sessions found</h3>
                            <p className="text-sm text-gray-500">Create attendance sessions to view reports.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;