import React, { useState, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AttendanceMarkerProps {
    sessionInfo: {
        session_id: number;
        class_name: string;
        room_number: string;
        random_word: string;
    };
    onSubmit: (audioBlob: Blob) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

const AttendanceMarker: React.FC<AttendanceMarkerProps> = ({
    sessionInfo,
    onSubmit,
    onCancel,
    isSubmitting
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            setError('');

            // Request microphone access with better error handling
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Try different MIME types for better compatibility, prioritizing WAV
            let mimeType = '';
            const supportedTypes = [
                'audio/wav',
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg;codecs=opus'
            ];

            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    console.log(`Using audio format: ${mimeType}`);
                    break;
                }
            }

            if (!mimeType) {
                console.warn('No supported audio format found, letting browser choose');
            }

            const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const finalMimeType = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.onerror = (event: any) => {
                setError(`Recording error: ${event.error?.message || 'Unknown error'}`);
                setIsRecording(false);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 10) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err: any) {
            console.error('Microphone access error:', err);

            if (err.name === 'NotAllowedError') {
                setError('Microphone permission denied. Please allow microphone access and try again.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.');
            } else if (err.name === 'NotReadableError') {
                setError('Microphone is being used by another application. Please close other apps and try again.');
            } else {
                setError(`Failed to access microphone: ${err.message || 'Unknown error'}`);
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const handleSubmit = async () => {
        if (!audioBlob) return;

        try {
            await onSubmit(audioBlob);
        } catch (err: any) {
            setError(err.message || 'Failed to submit attendance');
        }
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
        setError('');
    };

    return (
        <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="text-sm text-green-800 font-medium">
                            Successfully joined session!
                        </p>
                        <p className="text-sm text-green-700">
                            {sessionInfo.class_name} - {sessionInfo.room_number}
                        </p>
                    </div>
                </div>
            </div>

            {/* Random Word Display */}
            <div className="text-center space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                        Please say the following word clearly:
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                        "{sessionInfo.random_word}"
                    </p>
                </div>

                {/* Voice Recording Interface */}
                <div className="bg-gray-50 rounded-lg p-8">
                    <div className="w-32 h-32 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                        <svg className={`w-16 h-16 ${isRecording ? 'text-red-500 animate-pulse' : 'text-primary-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                    </div>

                    {/* Recording Status */}
                    {isRecording && (
                        <div className="mb-4">
                            <div className="text-2xl font-bold text-red-600">
                                {recordingTime}s
                            </div>
                            <div className="text-sm text-gray-600">Recording...</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${(recordingTime / 10) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Audio Playback */}
                    {audioBlob && !isRecording && (
                        <div className="mb-4">
                            <div className="text-lg font-medium text-green-600 mb-2">
                                Recording Complete!
                            </div>
                            <audio controls className="mx-auto">
                                <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {!isRecording && !audioBlob && (
                            <button
                                onClick={startRecording}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                </svg>
                                Start Recording
                            </button>
                        )}

                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                </svg>
                                Stop Recording
                            </button>
                        )}

                        {audioBlob && !isRecording && (
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={resetRecording}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                >
                                    Record Again
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                                    Submit Attendance
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Cancel Button */}
                    <div className="mt-4">
                        <button
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                            Cancel and scan another QR code
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceMarker;