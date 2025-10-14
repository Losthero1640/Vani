import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
    onScan: (result: string) => void;
    onError?: (error: string) => void;
    isActive: boolean;
}

const QRScannerComponent: React.FC<QRScannerProps> = ({ onScan, onError, isActive }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const [hasCamera, setHasCamera] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
    const [scannerReady, setScannerReady] = useState(false);

    useEffect(() => {
        const initializeScanner = async () => {
            try {
                setIsLoading(true);

                // Check if camera is available
                const cameraAvailable = await QrScanner.hasCamera();
                setHasCamera(cameraAvailable);

                if (!cameraAvailable) {
                    onError?.('No camera found on this device');
                    setIsLoading(false);
                    return;
                }

                // Create QR scanner instance but don't start it yet
                if (videoRef.current) {
                    const qrScanner = new QrScanner(
                        videoRef.current,
                        (result) => {
                            onScan(result.data);
                        },
                        {
                            highlightScanRegion: true,
                            highlightCodeOutline: true,
                            preferredCamera: 'environment',
                        }
                    );

                    qrScannerRef.current = qrScanner;
                    setScannerReady(true);
                }

                setPermissionStatus('prompt');
                setIsLoading(false);
            } catch (error: any) {
                console.error('Scanner initialization failed:', error);
                setHasCamera(false);
                onError?.(error.message || 'Failed to initialize scanner');
                setIsLoading(false);
            }
        };

        initializeScanner();

        // Cleanup function
        return () => {
            if (qrScannerRef.current) {
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
            }
        };
    }, [onError, onScan]);

    const startScanner = async () => {
        if (!qrScannerRef.current || !scannerReady) {
            onError?.('Scanner not ready');
            return;
        }

        try {
            setPermissionStatus('checking');
            console.log('🎥 Starting QR scanner...');

            // Start the QR scanner - this will request camera permission
            await qrScannerRef.current.start();

            setPermissionStatus('granted');
            console.log('✅ QR scanner started successfully');

        } catch (error: any) {
            console.error('❌ Failed to start scanner:', error);

            if (error.name === 'NotAllowedError') {
                setPermissionStatus('denied');
                onError?.('Camera permission denied. Please allow camera access and try again.');
            } else if (error.name === 'NotFoundError') {
                setPermissionStatus('denied');
                onError?.('No camera found. Please connect a camera and try again.');
            } else if (error.name === 'NotReadableError') {
                setPermissionStatus('denied');
                onError?.('Camera is being used by another application. Please close other apps and try again.');
            } else if (error.message && error.message.includes('Permission')) {
                setPermissionStatus('denied');
                onError?.('Camera permission was denied. Please refresh the page and allow camera access.');
            } else {
                setPermissionStatus('prompt');
                onError?.(error.message || 'Failed to start camera');
            }
        }
    };

    const stopScanner = () => {
        if (qrScannerRef.current) {
            try {
                console.log('🛑 Stopping QR scanner...');
                qrScannerRef.current.stop();
                console.log('✅ QR scanner stopped');
            } catch (error) {
                console.warn('⚠️ Error stopping scanner:', error);
            }
        }
    };

    useEffect(() => {
        if (!scannerReady) return;

        if (isActive) {
            if (permissionStatus === 'prompt') {
                // Start scanner and request permission
                startScanner();
            } else if (permissionStatus === 'granted' && qrScannerRef.current) {
                // Ensure scanner is running
                qrScannerRef.current.start().catch((error) => {
                    console.warn('Scanner already running or failed to restart:', error);
                });
            }
        } else {
            // Stop scanner when not active
            stopScanner();
        }
    }, [isActive, scannerReady]);

    const handleRequestPermission = async () => {
        await startScanner();
    };

    // Show camera not available
    if (hasCamera === false) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600 text-center">
                    No camera found on this device.<br />
                    Please use a device with a camera to scan QR codes.
                </p>
            </div>
        );
    }

    // Show permission denied state
    if (permissionStatus === 'denied') {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-12 h-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-600 text-center font-medium mb-3">
                    Camera Permission Required
                </p>
                <p className="text-red-600 text-center text-sm mb-4">
                    Please allow camera access to scan QR codes.<br />
                    You may need to refresh the page after granting permission.
                </p>
                <button
                    onClick={handleRequestPermission}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                    Request Camera Access
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg object-cover"
                style={{ display: isLoading ? 'none' : 'block' }}
            />

            {(isLoading || permissionStatus === 'checking') && (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                        <p className="text-gray-600">
                            {permissionStatus === 'checking' ? 'Requesting camera permission...' : 'Initializing camera...'}
                        </p>
                    </div>
                </div>
            )}

            {!isLoading && isActive && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-primary-500 rounded-lg">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
                    </div>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                        Position QR code within the frame
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRScannerComponent;