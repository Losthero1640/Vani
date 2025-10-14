from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.deps import get_current_student
from app.services.user_service import user_service
from app.services.voice_service import voice_service
from app.schemas.user import StudentCreate, StudentResponse, StudentUpdate
from app.schemas.voice import VoiceEnrollmentResponse
from app.schemas.attendance import AttendanceMarkRequest, AttendanceMarkResponse, AttendanceRecordResponse
from app.schemas.auth import CurrentUser
from app.models.user import Student
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.voice import VoiceProfile

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/enroll", response_model=StudentResponse)
async def enroll_student(student_data: StudentCreate, db: Session = Depends(get_db)):
    try:
        success, message, student = user_service.create_student(db, student_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        return StudentResponse(
            id=student.id,
            user_id=student.user_id,
            student_id=student.student_id,
            name=student.name,
            branch=student.branch,
            year=student.year,
            voice_profile_path=student.voice_profile_path,
            enrollment_date=student.enrollment_date
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Student enrollment failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Student enrollment failed"
        )


@router.post("/voice-profile", response_model=VoiceEnrollmentResponse)
async def create_voice_profile(
    audio_file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    try:
        student = user_service.get_student_by_id(db, current_user.id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Accept various audio formats including WebM
        accepted_types = [
            "audio/wav", "audio/mpeg", "audio/mp3", "audio/webm", 
            "audio/mp4", "audio/ogg", "audio/x-wav", "audio/wave"
        ]
        
        if audio_file.content_type not in accepted_types:
            logger.warning(f"Received audio file with content type: {audio_file.content_type}")
            # Don't reject immediately - let the voice service try to process it
            # Some browsers may send different content types
        
        success, result = voice_service.create_voice_profile_from_upload(
            audio_file.file, student.student_id
        )
        
        if success:
            existing_profile = db.query(VoiceProfile).filter(
                VoiceProfile.student_id == student.id
            ).first()
            
            if existing_profile:
                existing_profile.file_path = result
                existing_profile.last_updated = datetime.utcnow()
            else:
                voice_profile = VoiceProfile(
                    student_id=student.id,
                    file_path=result
                )
                db.add(voice_profile)
            
            student.voice_profile_path = result
            db.commit()
            
            profile_info = voice_service.get_profile_info(student.student_id)
            
            return VoiceEnrollmentResponse(
                success=True,
                message="Voice profile created successfully",
                profile_path=result,
                duration=profile_info.get("duration")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice profile creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Voice profile creation failed"
        )


@router.get("/profile", response_model=StudentResponse)
async def get_student_profile(
    current_user: CurrentUser = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    try:
        student = user_service.get_student_by_id(db, current_user.id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        return StudentResponse(
            id=student.id,
            user_id=student.user_id,
            student_id=student.student_id,
            name=student.name,
            branch=student.branch,
            year=student.year,
            voice_profile_path=student.voice_profile_path,
            enrollment_date=student.enrollment_date
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get student profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get student profile"
        )


@router.put("/profile", response_model=StudentResponse)
async def update_student_profile(
    update_data: StudentUpdate,
    current_user: CurrentUser = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    try:
        student = user_service.get_student_by_id(db, current_user.id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        update_dict = update_data.dict(exclude_unset=True)
        success, message = user_service.update_student(db, student.student_id, update_dict)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        db.refresh(student)
        
        return StudentResponse(
            id=student.id,
            user_id=student.user_id,
            student_id=student.student_id,
            name=student.name,
            branch=student.branch,
            year=student.year,
            voice_profile_path=student.voice_profile_path,
            enrollment_date=student.enrollment_date
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update student profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update student profile"
        )


@router.post("/join-session")
async def join_session(
    qr_code: str,
    current_user: CurrentUser = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    try:
        session = db.query(AttendanceSession).filter(
            AttendanceSession.qr_code == qr_code
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid QR code or session not found"
            )
        
        if not session.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is not active"
            )
        
        student = user_service.get_student_by_id(db, current_user.id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        if not voice_service.profile_exists(student.student_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Voice profile not found. Please enroll your voice first."
            )
        
        random_word = voice_service.get_random_word()
        
        return {
            "success": True,
            "message": "Successfully joined session",
            "session_id": session.id,
            "class_name": session.class_name,
            "room_number": session.room_number,
            "random_word": random_word
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to join session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join session"
        )


@router.post("/mark-attendance", response_model=AttendanceMarkResponse)
async def mark_attendance(
    session_id: int,
    spoken_word: str,
    audio_file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    try:
        student = user_service.get_student_by_id(db, current_user.id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        session = db.query(AttendanceSession).filter(
            AttendanceSession.id == session_id
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        if not session.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is not active"
            )
        
        existing_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session_id,
            AttendanceRecord.student_id == student.id
        ).first()
        
        if existing_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already marked for this session"
            )
        
        if not voice_service.profile_exists(student.student_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Voice profile not found. Please enroll first."
            )
        
        reference_file = voice_service.get_profile_path(student.student_id)
        score, is_match, message = voice_service.verify_voice_from_upload(
            reference_file, audio_file.file
        )
        
        attendance_status = "present" if is_match else "absent"
        
        attendance_record = AttendanceRecord(
            session_id=session_id,
            student_id=student.id,
            status=attendance_status,
            verification_score=score,
            spoken_word=spoken_word
        )
        
        db.add(attendance_record)
        db.commit()
        
        from datetime import datetime
        return AttendanceMarkResponse(
            success=is_match,
            message=f"Attendance marked as {attendance_status}. {message}",
            status=attendance_status,
            similarity_score=score,
            timestamp=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark attendance"
        )


@router.get("/attendance-history", response_model=List[AttendanceRecordResponse])
async def get_attendance_history(
    current_user: CurrentUser = Depends(get_current_student),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    try:
        student = user_service.get_student_by_id(db, current_user.id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        records = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student.id
        ).offset(skip).limit(limit).all()
        
        return [
            AttendanceRecordResponse(
                id=record.id,
                session_id=record.session_id,
                student_id=record.student_id,
                status=record.status,
                verification_score=record.verification_score,
                timestamp=record.timestamp,
                spoken_word=record.spoken_word
            )
            for record in records
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get attendance history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get attendance history"
        )