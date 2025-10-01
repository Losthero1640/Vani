export interface User {
  id: number;
  user_type: 'admin' | 'student';
  username?: string;
  student_id?: string;
  name?: string;
  is_active: boolean;
}

export interface LoginRequest {
  user_type: 'admin' | 'student';
  username?: string;
  password?: string;
  student_id?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  access_token?: string;
  token_type: string;
  user_type?: 'admin' | 'student';
  user_id?: number;
  username?: string;
  student_id?: string;
}

export interface Student {
  id: number;
  user_id: number;
  student_id: string;
  name: string;
  branch: string;
  year: number;
  voice_profile_path?: string;
  enrollment_date: string;
}

export interface AttendanceSession {
  id: number;
  class_name: string;
  room_number: string;
  admin_id: number;
  qr_code: string;
  session_date: string;
  is_active: boolean;
  random_words?: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late';
  verification_score?: number;
  timestamp: string;
  spoken_word?: string;
}

export interface AttendanceStats {
  total_sessions: number;
  active_sessions: number;
  total_students: number;
  present_today: number;
  absent_today: number;
  attendance_rate: number;
}