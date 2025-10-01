from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"


class AttendanceSessionBase(BaseModel):
    class_name: str = Field(..., min_length=1, max_length=100)
    room_number: str = Field(..., min_length=1, max_length=20)


class AttendanceSessionCreate(AttendanceSessionBase):
    pass


class AttendanceSessionResponse(AttendanceSessionBase):
    id: int
    admin_id: int
    qr_code: str
    session_date: datetime
    is_active: bool
    random_words: Optional[str] = None
    
    class Config:
        from_attributes = True


class AttendanceRecordBase(BaseModel):
    status: AttendanceStatus
    spoken_word: Optional[str] = None


class AttendanceRecordCreate(AttendanceRecordBase):
    session_id: int
    student_id: int
    verification_score: Optional[float] = None


class AttendanceRecordResponse(AttendanceRecordBase):
    id: int
    session_id: int
    student_id: int
    verification_score: Optional[float] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AttendanceMarkRequest(BaseModel):
    qr_code: str = Field(..., description="QR code from session")
    spoken_word: str = Field(..., description="Word that was spoken")


class AttendanceMarkResponse(BaseModel):
    success: bool
    message: str
    status: AttendanceStatus
    similarity_score: Optional[float] = None
    timestamp: datetime


class QRGenerateRequest(BaseModel):
    class_name: str = Field(..., min_length=1, max_length=100)
    room_number: str = Field(..., min_length=1, max_length=20)


class QRGenerateResponse(BaseModel):
    success: bool
    qr_code: str
    session_id: int
    qr_image_base64: str
    expires_at: datetime


class AttendanceStatsResponse(BaseModel):
    total_sessions: int
    active_sessions: int
    total_students: int
    present_today: int
    absent_today: int
    attendance_rate: float