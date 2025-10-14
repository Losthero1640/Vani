from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
import uuid
import logging
from datetime import datetime, timedelta

from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.user import Student, Admin
from app.schemas.attendance import AttendanceSessionCreate, QRGenerateRequest

logger = logging.getLogger(__name__)


class AttendanceService:
    
    def create_session(
        self, 
        db: Session, 
        session_data: AttendanceSessionCreate, 
        admin_id: int
    ) -> Tuple[bool, str, Optional[AttendanceSession]]:
        try:
            qr_code = str(uuid.uuid4())
            
            session = AttendanceSession(
                class_name=session_data.class_name,
                room_number=session_data.room_number,
                admin_id=admin_id,
                qr_code=qr_code,
                is_active=True
            )
            
            db.add(session)
            db.commit()
            db.refresh(session)
            
            logger.info(f"Attendance session created: {session.id}")
            return True, "Session created successfully", session
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create session: {e}")
            return False, f"Failed to create session: {str(e)}", None
    
    def get_session_by_id(self, db: Session, session_id: int) -> Optional[AttendanceSession]:
        return db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    
    def get_session_by_qr_code(self, db: Session, qr_code: str) -> Optional[AttendanceSession]:
        return db.query(AttendanceSession).filter(AttendanceSession.qr_code == qr_code).first()
    
    def get_admin_sessions(
        self, 
        db: Session, 
        admin_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[AttendanceSession]:
        return db.query(AttendanceSession).filter(
            AttendanceSession.admin_id == admin_id
        ).offset(skip).limit(limit).all()
    
    def get_active_sessions(self, db: Session, admin_id: int) -> List[AttendanceSession]:
        return db.query(AttendanceSession).filter(
            AttendanceSession.admin_id == admin_id,
            AttendanceSession.is_active == True
        ).all()
    
    def deactivate_session(self, db: Session, session_id: int, admin_id: int) -> bool:
        try:
            session = db.query(AttendanceSession).filter(
                AttendanceSession.id == session_id,
                AttendanceSession.admin_id == admin_id
            ).first()
            
            if session:
                session.is_active = False
                db.commit()
                logger.info(f"Session {session_id} deactivated")
                return True
            return False
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to deactivate session: {e}")
            return False
    
    def get_session_attendance(
        self, 
        db: Session, 
        session_id: int, 
        admin_id: int
    ) -> Tuple[bool, str, List[dict]]:
        try:
            session = db.query(AttendanceSession).filter(
                AttendanceSession.id == session_id,
                AttendanceSession.admin_id == admin_id
            ).first()
            
            if not session:
                return False, "Session not found or access denied", []
            
            records = db.query(AttendanceRecord).filter(
                AttendanceRecord.session_id == session_id
            ).all()
            
            attendance_data = []
            for record in records:
                student = db.query(Student).filter(Student.id == record.student_id).first()
                if student:
                    attendance_data.append({
                        "student_id": student.student_id,
                        "student_name": student.name,
                        "branch": student.branch,
                        "year": student.year,
                        "status": record.status,
                        "verification_score": record.verification_score,
                        "timestamp": record.timestamp,
                        "spoken_word": record.spoken_word
                    })
            
            return True, "Attendance retrieved successfully", attendance_data
            
        except Exception as e:
            logger.error(f"Failed to get session attendance: {e}")
            return False, f"Failed to get attendance: {str(e)}", []
    
    def get_attendance_stats(self, db: Session, admin_id: int) -> dict:
        try:
            total_sessions = db.query(AttendanceSession).filter(
                AttendanceSession.admin_id == admin_id
            ).count()
            
            active_sessions = db.query(AttendanceSession).filter(
                AttendanceSession.admin_id == admin_id,
                AttendanceSession.is_active == True
            ).count()
            
            today = datetime.utcnow().date()
            today_sessions = db.query(AttendanceSession).filter(
                AttendanceSession.admin_id == admin_id,
                AttendanceSession.session_date >= today,
                AttendanceSession.session_date < today + timedelta(days=1)
            ).all()
            
            present_today = 0
            absent_today = 0
            
            for session in today_sessions:
                records = db.query(AttendanceRecord).filter(
                    AttendanceRecord.session_id == session.id
                ).all()
                
                for record in records:
                    if record.status == "present":
                        present_today += 1
                    else:
                        absent_today += 1
            
            total_students = db.query(Student).count()
            
            attendance_rate = 0.0
            if present_today + absent_today > 0:
                attendance_rate = (present_today / (present_today + absent_today)) * 100
            
            return {
                "total_sessions": total_sessions,
                "active_sessions": active_sessions,
                "total_students": total_students,
                "present_today": present_today,
                "absent_today": absent_today,
                "attendance_rate": round(attendance_rate, 2)
            }
            
        except Exception as e:
            logger.error(f"Failed to get attendance stats: {e}")
            return {
                "total_sessions": 0,
                "active_sessions": 0,
                "total_students": 0,
                "present_today": 0,
                "absent_today": 0,
                "attendance_rate": 0.0
            }


attendance_service = AttendanceService()