from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VoiceEnrollmentRequest(BaseModel):
    student_id: str = Field(..., description="Student ID for voice enrollment")


class VoiceEnrollmentResponse(BaseModel):
    success: bool
    message: str
    profile_path: Optional[str] = None
    duration: Optional[float] = None


class VoiceVerificationRequest(BaseModel):
    student_id: str = Field(..., description="Student ID for verification")
    session_id: int = Field(..., description="Attendance session ID")
    spoken_word: str = Field(..., description="Word that was spoken")


class VoiceVerificationResponse(BaseModel):
    success: bool
    message: str
    similarity_score: float
    verification_result: bool
    timestamp: datetime


class RandomWordResponse(BaseModel):
    word: str
    timestamp: datetime


class VoiceProfileInfo(BaseModel):
    exists: bool
    duration: Optional[float] = None
    sample_rate: Optional[int] = None
    channels: Optional[int] = None
    file_size: Optional[int] = None
    error: Optional[str] = None


class AudioUploadResponse(BaseModel):
    success: bool
    message: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None