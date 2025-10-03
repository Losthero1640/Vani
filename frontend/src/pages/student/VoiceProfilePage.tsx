import React, { useState, useRef, useEffect } from 'react';
import { studentAPI, voiceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const VoiceProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [uploading, setUploading] = useState(false);
    const [profileExists, setProfileExists] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        checkExistingProfile();
    }, []);

    const checkExistingProfile = async () => {
        if (!user?.student_id) return;

        try {
            const profileInfo = await voiceAPI.getProfileInfo(user.student_id);
            setProfileExists(profileInfo.exists);
        } catch (err) {
            console.error('Failed to check profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setError('');

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 30) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err: any) {
            setError('Failed to access microphone. Please check permissions.');
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

    const uploadVoiceProfile = async () => {
        if (!audioBlob) return;

        setUploading(true);
        setError('');

        try {
            const audioFile = new File([audioBlob], 'voice-profile.webm', { type: 'audio/webm' });
            await studentAPI.createVoiceProfile(audioFile);

            setSuccess('Voice profile created successfully!');
            setProfileExists(true);
            setAudioBlob(null);
            setRecordingTime(0);
        } catch (err: any) {
            setError(err.message || 'Failed to upload voice profile');
        } finally {
            setUploading(false);
        }
    };

    const deleteProfile = async () => {
        if (!user?.student_id) return;

        try {
            await voiceAPI.deleteProfile(user.student_id);
            setProfileExists(false);
            setSuccess('Voice profile deleted successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to delete voice profile');
        }
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
        setError('');
        setSuccess('');
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
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Voice Profile Setup</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Record your voice to enable attendance verification
                    </p>
                </div>

                <div className="p-6">
                    {profileExists ? (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                <div className="flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-green-800 font-medium">
                                        Voice profile is set up and ready!
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    Your voice profile has been created successfully. You can now mark attendance by scanning QR codes.
                                </p>

                                <div className="flex justify-center space-x-4">
                                    <button
                                        onClick={() => setProfileExists(false)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Update Profile
                                    </button>
                                    <button
                                        onClick={deleteProfile}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                    >
                                        Delete Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium">Instructions:</p>
                                        <ul className="mt-1 list-disc list-inside space-y-1">
                                            <li>Record at least 5-10 seconds of clear speech</li>
                                            <li>Speak in a quiet environment without background noise</li>
                                            <li>Use your normal speaking voice</li>
                                            <li>You can say anything - read a paragraph, count numbers, etc.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center space-y-6">
                                <div className="bg-gray-50 rounded-lg p-8">
                                    <div className="w-32 h-32 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                                        <svg className={`w-16 h-16 ${isRecording ? 'text-red-500 animate-pulse' : 'text-primary-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                        </svg>
                                    </div>

                                    {isRecording && (
                                        <div className="mb-4">
                                            <div className="text-2xl font-bold text-red-600">
                                                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                            </div>
                                            <div className="text-sm text-gray-600">Recording... (minimum 5 seconds)</div>
                                        </div>
                                    )}

                                    {audioBlob && !isRecording && (
                                        <div className="mb-4">
                                            <div className="text-lg font-medium text-green-600 mb-2">
                                                Recording Complete! ({recordingTime} seconds)
                                            </div>
                                            <audio controls className="mx-auto">
                                                <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                                                Your browser does not support the audio element.
                                            </audio>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {!isRecording && !audioBlob && (
                                            <button
                                                onClick={startRecording}
                                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
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
                                                disabled={recordingTime < 5}
                                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
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
                                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Record Again
                                                </button>
                                                <button
                                                    onClick={uploadVoiceProfile}
                                                    disabled={uploading}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {uploading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                                                    Save Profile
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                            <p className="text-sm text-green-600">{success}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceProfilePage;