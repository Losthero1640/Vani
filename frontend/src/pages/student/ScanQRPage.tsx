import React, { useState } from 'react';
import { studentAPI } from '../../services/api';
import QRScannerComponent from '../../components/QRScanner';
import AttendanceMarker from '../../components/AttendanceMarker';

interface SessionInfo {
    session_id: number;
    class_name: string;
    room_number: string;
    random_word: string;
}

const ScanQRPage: React.FC = () => {
    const [scannerActive, setScannerActive] = useState(false);
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [step, setStep] = useState<'scan' | 'record' | 'complete'>('scan');

    const handleQRScan = async (qrData: string) => {
        setScannerActive(false);
        setError('');

        try {
            // Parse QR code data
            const qrInfo = JSON.parse(qrData);

            if (qrInfo.type !== 'attendance_session') {
                setError('Invalid QR code. Please scan an attendance QR code.');
                return;
            }

            // Join the session
            const response = await studentAPI.joinSession(qrInfo.qr_code);

            setSessionInfo({
                session_id: response.session_id,
                class_name: response.class_name,
                room_number: response.room_number,
                random_word: response.random_word,
            });

            setStep('record');
        } catch (err: any) {
            if (err.message.includes('Voice profile not found')) {
                setError('Please set up your voice profile first before marking attendance.');
            } else {
                setError(err.message || 'Failed to join session. Please try again.');
            }
        }
    };

    const handleAttendanceSubmit = async (audioBlob: Blob) => {
        if (!sessionInfo) return;

        setSubmitting(true);
        setError('');

        try {
            const audioFile = new File([audioBlob], 'attendance-verification.webm', { type: 'audio/webm' });

            const response = await studentAPI.markAttendance(
                sessionInfo.session_id,
                sessionInfo.random_word,
                audioFile
            );

            if (response.success) {
                setSuccess(`Attendance marked as ${response.status}!`);
                setStep('complete');
            } else {
                setError(response.message || 'Failed to mark attendance');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit attendance');
            throw err; // Re-throw to let AttendanceMarker handle the error display
        } finally {
            setSubmitting(false);
        }
    };

    const resetProcess = () => {
        setStep('scan');
        setSessionInfo(null);
        setError('');
        setSuccess('');
        setScannerActive(false);
    };

    const handleCancelAttendance = () => {
        setStep('scan');
        setSessionInfo(null);
        setError('');
    };

    const handleScannerError = (error: string) => {
        setError(error);
        setScannerActive(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Mark Attendance</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Scan QR code and verify your voice to mark attendance
                    </p>
                </div>

                <div className="p-6">
                    {step === 'scan' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium">Instructions:</p>
                                        <ul className="mt-1 list-disc list-inside space-y-1">
                                            <li>Get the QR code from your instructor</li>
                                            <li>Click "Start Scanner" below</li>
                                            <li><strong>Allow camera access</strong> when your browser asks for permission</li>
                                            <li>Point your camera at the QR code with good lighting</li>
                                            <li>Ensure your voice profile is set up before scanning</li>
                                            <li>If camera doesn't work, check browser permissions and refresh</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {!scannerActive ? (
                                <div className="text-center">
                                    <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                    </div>
                                    <button
                                        onClick={() => setScannerActive(true)}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        </svg>
                                        Start Scanner
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <QRScannerComponent
                                        onScan={handleQRScan}
                                        onError={handleScannerError}
                                        isActive={scannerActive}
                                    />
                                    <div className="text-center">
                                        <button
                                            onClick={() => setScannerActive(false)}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Stop Scanner
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'record' && sessionInfo && (
                        <AttendanceMarker
                            sessionInfo={sessionInfo}
                            onSubmit={handleAttendanceSubmit}
                            onCancel={handleCancelAttendance}
                            isSubmitting={submitting}
                        />
                    )}

                    {step === 'complete' && (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-md p-6">
                                <div className="flex items-center justify-center mb-4">
                                    <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-green-900 mb-2">
                                    Attendance Submitted Successfully!
                                </h3>
                                <p className="text-sm text-green-700">
                                    {success}
                                </p>
                            </div>

                            <button
                                onClick={resetProcess}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                            >
                                Mark Another Attendance
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScanQRPage;