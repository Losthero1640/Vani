import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface QRResponse {
    success: boolean;
    qr_code: string;
    session_id: number;
    qr_image_base64: string;
    expires_at: string;
}

const QRGeneratorPage: React.FC = () => {
    const [formData, setFormData] = useState({
        class_name: '',
        room_number: '',
    });
    const [generating, setGenerating] = useState(false);
    const [qrResult, setQrResult] = useState<QRResponse | null>(null);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setError('');

        try {
            const result = await adminAPI.generateQR(formData);
            setQrResult(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate QR code');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadQR = () => {
        if (!qrResult) return;

        const link = document.createElement('a');
        link.href = `data:image/png;base64,${qrResult.qr_image_base64}`;
        link.download = `attendance-qr-${qrResult.session_id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintQR = () => {
        if (!qrResult) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Attendance QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
              }
              .qr-container { 
                border: 2px solid #000; 
                padding: 20px; 
                display: inline-block; 
                margin: 20px;
              }
              .qr-info { 
                margin-bottom: 20px; 
              }
              img { 
                max-width: 300px; 
                height: auto; 
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="qr-info">
                <h2>Voice Attendance System</h2>
                <h3>${formData.class_name}</h3>
                <p>Room: ${formData.room_number}</p>
                <p>Session ID: ${qrResult.session_id}</p>
                <p>Expires: ${new Date(qrResult.expires_at).toLocaleString()}</p>
              </div>
              <img src="data:image/png;base64,${qrResult.qr_image_base64}" alt="QR Code" />
              <p><strong>Scan this QR code to mark attendance</strong></p>
            </div>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleNewQR = () => {
        setQrResult(null);
        setFormData({ class_name: '', room_number: '' });
        setError('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">QR Code Generator</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Generate QR codes for attendance sessions
                    </p>
                </div>

                <div className="p-6">
                    {!qrResult ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Class Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.class_name}
                                        onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="e.g., Computer Science 101"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Room Number
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.room_number}
                                        onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="e.g., Room 101"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={generating}
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                >
                                    {generating ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Generate QR Code
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                <div className="flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-green-800 font-medium">
                                        QR Code generated successfully!
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">{formData.class_name}</h3>
                                    <p className="text-sm text-gray-600">Room: {formData.room_number}</p>
                                    <p className="text-sm text-gray-600">Session ID: {qrResult.session_id}</p>
                                    <p className="text-sm text-gray-600">
                                        Expires: {new Date(qrResult.expires_at).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex justify-center mb-6">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                                        <img
                                            src={`data:image/png;base64,${qrResult.qr_image_base64}`}
                                            alt="QR Code"
                                            className="w-64 h-64"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-center space-x-4">
                                    <button
                                        onClick={handleDownloadQR}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download
                                    </button>
                                    <button
                                        onClick={handlePrintQR}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print
                                    </button>
                                    <button
                                        onClick={handleNewQR}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Generate New QR
                                    </button>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium">Instructions:</p>
                                        <ul className="mt-1 list-disc list-inside space-y-1">
                                            <li>Share this QR code with students in your class</li>
                                            <li>Students can scan it with their phones to join the session</li>
                                            <li>The QR code will expire in 24 hours for security</li>
                                            <li>Students need to have their voice profile set up to mark attendance</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRGeneratorPage;