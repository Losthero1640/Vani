import React, { useState, useRef } from 'react';

const CameraTest: React.FC = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState('');
    const [permissionStatus, setPermissionStatus] = useState<string>('');
    const videoRef = useRef<HTMLVideoElement>(null);

    const testCamera = async () => {
        try {
            setError('');
            setPermissionStatus('Requesting camera access...');

            // Request camera permission
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment' // Try to use back camera
                }
            });

            setStream(mediaStream);
            setPermissionStatus('Camera access granted!');

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

        } catch (err: any) {
            console.error('Camera test failed:', err);

            if (err.name === 'NotAllowedError') {
                setError('Camera permission denied. Please allow camera access and try again.');
                setPermissionStatus('Permission denied');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device.');
                setPermissionStatus('No camera found');
            } else {
                setError(`Camera error: ${err.message}`);
                setPermissionStatus('Error occurred');
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setPermissionStatus('Camera stopped');

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Camera Test</h3>

            <div className="space-y-4">
                <div className="flex space-x-4">
                    <button
                        onClick={testCamera}
                        disabled={!!stream}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                        Test Camera
                    </button>

                    {stream && (
                        <button
                            onClick={stopCamera}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Stop Camera
                        </button>
                    )}
                </div>

                {permissionStatus && (
                    <div className={`p-3 rounded-md ${permissionStatus.includes('granted') ? 'bg-green-50 text-green-800' :
                            permissionStatus.includes('denied') || permissionStatus.includes('Error') ? 'bg-red-50 text-red-800' :
                                'bg-blue-50 text-blue-800'
                        }`}>
                        <p className="text-sm font-medium">{permissionStatus}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {stream && (
                    <div className="mt-4">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full max-w-md h-64 bg-black rounded-lg object-cover"
                        />
                    </div>
                )}

                <div className="text-xs text-gray-500">
                    <p>This test checks if your browser can access the camera.</p>
                    <p>If this works but QR scanning doesn't, there might be an issue with the QR scanner library.</p>
                </div>
            </div>
        </div>
    );
};

export default CameraTest;