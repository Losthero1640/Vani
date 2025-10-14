from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class AttendanceStatus(enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String, nullable=False)
    room_number = Column(String, nullable=False)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    qr_code = Column(String, unique=True, nullable=False)
    session_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    random_words = Column(Text, nullable=True)
    
    admin = relationship("Admin", backref="sessions")
    attendance_records = relationship("AttendanceRecord", back_populates="session")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    status = Column(String, nullable=False)
    verification_score = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    spoken_word = Column(String, nullable=True)
    
    session = relationship("AttendanceSession", back_populates="attendance_records")
    student = relationship("Student", backref="attendance_records")