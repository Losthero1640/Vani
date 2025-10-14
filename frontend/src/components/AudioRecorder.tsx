import React, { useState, useRef, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    onError?: (error: string) => void;
    maxDuration?: number;
    minDuration?: number;
    className?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
    onRecordingComplete,
    onError,
    maxDuration = 20,
    minDuration = 3,
    className = '',
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startRecording = useCallback(async () => {
        try {
            // Request microphone access with better error handling
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
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
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.onerror = (event: any) => {
                onError?.(`Recording error: ${event.error?.message || 'Unknown error'}`);
                setIsRecording(false);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    const newTime = prev + 1;
                    if (newTime >= maxDuration) {
                        stopRecording();
                        return newTime;
                    }
                    return newTime;
                });
            }, 1000);
        } catch (err: any) {
            console.error('Microphone access error:', err);

            if (err.name === 'NotAllowedError') {
                onError?.('Microphone permission denied. Please allow microphone access and try again.');
            } else if (err.name === 'NotFoundError') {
                onError?.('No microphone found. Please connect a microphone and try again.');
            } else if (err.name === 'NotReadableError') {
                onError?.('Microphone is being used by another application. Please close other apps and try again.');
            } else {
                onError?.(`Failed to access microphone: ${err.message || 'Unknown error'}`);
            }
        }
    }, [maxDuration, onError]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    const playRecording = useCallback(() => {
        if (audioBlob && !isPlaying) {
            const audio = new Audio(URL.createObjectURL(audioBlob));
            audioRef.current = audio;

            audio.onended = () => {
                setIsPlaying(false);
                audioRef.current = null;
            };

            audio.play();
            setIsPlaying(true);
        }
    }, [audioBlob, isPlaying]);

    const stopPlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsPlaying(false);
        }
    }, []);

    const acceptRecording = useCallback(() => {
        if (audioBlob && recordingTime >= minDuration) {
            onRecordingComplete(audioBlob, recordingTime);
        }
    }, [audioBlob, recordingTime, minDuration, onRecordingComplete]);

    const resetRecording = useCallback(() => {
        setAudioBlob(null);
        setRecordingTime(0);
        stopPlayback();
    }, [stopPlayback]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
            <div className="text-center space-y-4">
                {/* Recording Indicator */}
                <div className="w-32 h-32 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                    <svg
                        className={`w-16 h-16 ${isRecording ? 'text-red-500 animate-pulse' : 'text-primary-600'
                            }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>

                {/* Timer */}
                {(isRecording || audioBlob) && (
                    <div className="text-2xl font-bold text-gray-900">
                        {formatTime(recordingTime)}
                    </div>
                )}

                {/* Status Text */}
                <div className="text-sm text-gray-600">
                    {isRecording && 'Recording...'}
                    {audioBlob && !isRecording && `Recording complete (${recordingTime}s)`}
                    {!isRecording && !audioBlob && `Ready to record (${minDuration}-${maxDuration}s)`}
                </div>

                {/* Controls */}
                <div className="space-y-3">
                    {!isRecording && !audioBlob && (
                        <button
                            onClick={startRecording}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Start Recording
                        </button>
                    )}

                    {isRecording && (
                        <button
                            onClick={stopRecording}
                            disabled={recordingTime < minDuration}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Stop Recording
                            {recordingTime < minDuration && ` (${minDuration - recordingTime}s remaining)`}
                        </button>
                    )}

                    {audioBlob && !isRecording && (
                        <div className="flex justify-center space-x-3">
                            <button
                                onClick={isPlaying ? stopPlayback : playRecording}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                {isPlaying ? (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Stop
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Play
                                    </>
                                )}
                            </button>

                            <button
                                onClick={resetRecording}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Record Again
                            </button>

                            <button
                                onClick={acceptRecording}
                                disabled={recordingTime < minDuration}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                                Accept Recording
                            </button>
                        </div>
                    )}
                </div>

                {/* Duration Info */}
                {!isRecording && !audioBlob && (
                    <div className="text-xs text-gray-500">
                        Minimum {minDuration} seconds, maximum {maxDuration} seconds
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioRecorder;