import { LoginRequest, LoginResponse, User, Student, AttendanceSession, AttendanceStats, AttendanceRecord } from '../types';
import { apiClient } from './apiClient';

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return await apiClient.post('/auth/login', data);
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    return await apiClient.get('/auth/me');
  },

  refreshToken: async (): Promise<{ access_token: string }> => {
    return await apiClient.post('/auth/refresh');
  },
};

export const adminAPI = {
  getDashboard: async (): Promise<AttendanceStats> => {
    return await apiClient.get('/admin/dashboard');
  },

  getStudents: async (): Promise<Student[]> => {
    return await apiClient.get('/admin/students');
  },

  createSession: async (data: { class_name: string; room_number: string }): Promise<AttendanceSession> => {
    return await apiClient.post('/admin/classes', data);
  },

  getSessions: async (): Promise<AttendanceSession[]> => {
    return await apiClient.get('/admin/classes');
  },

  getSessionAttendance: async (sessionId: number): Promise<{
    attendance_records: {
      student_id: string;
      student_name: string;
      branch: string;
      year: number;
      status: string;
      verification_score?: number;
      timestamp: string;
      spoken_word?: string;
    }[];
    session_info: AttendanceSession;
  }> => {
    return await apiClient.get(`/admin/classes/${sessionId}/attendance`);
  },

  generateQR: async (data: { class_name: string; room_number: string }): Promise<{
    success: boolean;
    qr_code: string;
    session_id: number;
    qr_image_base64: string;
    expires_at: string;
  }> => {
    return await apiClient.post('/admin/qr-generate', data);
  },

  deactivateSession: async (sessionId: number): Promise<void> => {
    await apiClient.post(`/admin/classes/${sessionId}/deactivate`);
  },

  exportAttendance: async (sessionId?: number): Promise<Blob> => {
    const url = sessionId 
      ? `/admin/attendance/export?session_id=${sessionId}`
      : '/admin/attendance/export';
    return await apiClient.downloadFile(url);
  },
};

export const studentAPI = {
  enroll: async (data: { student_id: string; name: string; branch: string; year: number }): Promise<Student> => {
    return await apiClient.post('/student/enroll', data);
  },

  getProfile: async (): Promise<Student> => {
    return await apiClient.get('/student/profile');
  },

  updateProfile: async (data: Partial<Student>): Promise<Student> => {
    return await apiClient.put('/student/profile', data);
  },

  createVoiceProfile: async (audioFile: File): Promise<{
    success: boolean;
    message: string;
  }> => {
    return await apiClient.uploadFile('/student/voice-profile', audioFile, 'audio_file');
  },

  joinSession: async (qrCode: string): Promise<{
    session_id: number;
    class_name: string;
    room_number: string;
    random_word: string;
  }> => {
    return await apiClient.post(`/student/join-session?qr_code=${encodeURIComponent(qrCode)}`);
  },

  markAttendance: async (sessionId: number, spokenWord: string, audioFile: File): Promise<{
    success: boolean;
    status: string;
    message?: string;
  }> => {
    const url = `/student/mark-attendance?session_id=${sessionId}&spoken_word=${encodeURIComponent(spokenWord)}`;
    return await apiClient.uploadFile(url, audioFile, 'audio_file');
  },

  getAttendanceHistory: async (): Promise<AttendanceRecord[]> => {
    return await apiClient.get('/student/attendance-history');
  },
};

export const voiceAPI = {
  getRandomWord: async (): Promise<{ word: string; timestamp: string }> => {
    return await apiClient.get('/voice/random-word');
  },

  getProfileInfo: async (studentId: string): Promise<{
    exists: boolean;
    created_at?: string;
    last_updated?: string;
  }> => {
    return await apiClient.get(`/voice/profile/${studentId}`);
  },

  deleteProfile: async (studentId: string): Promise<void> => {
    await apiClient.delete(`/voice/profile/${studentId}`);
  },
};

export default apiClient;