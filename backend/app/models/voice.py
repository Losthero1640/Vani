from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class VoiceProfile(Base):
    __tablename__ = "voice_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    file_path = Column(String, nullable=False)
    embedding_vector = Column(LargeBinary, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student = relationship("Student", backref="voice_profile")


class VoiceVerification(Base):
    __tablename__ = "voice_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"), nullable=False)
    audio_file_path = Column(String, nullable=False)
    similarity_score = Column(Float, nullable=False)
    verification_result = Column(Boolean, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student", backref="voice_verifications")
    session = relationship("AttendanceSession", backref="voice_verifications")