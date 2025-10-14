from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.core.database import get_db
from app.services.voice_service import voice_service
from app.schemas.voice import (
    VoiceEnrollmentRequest, VoiceEnrollmentResponse,
    VoiceVerificationRequest, VoiceVerificationResponse,
    RandomWordResponse, VoiceProfileInfo
)
from app.models.user import Student
from app.models.voice import VoiceProfile, VoiceVerification
from app.models.attendance import AttendanceSession

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/enroll", response_model=VoiceEnrollmentResponse)
async def enroll_voice(
    student_id: str,
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        if audio_file.content_type not in ["audio/wav", "audio/mpeg", "audio/mp3", "audio/webm"]:
            raise HTTPException(status_code=400, detail="Invalid audio file format")
        
        success, result = voice_service.create_voice_profile_from_upload(audio_file.file, student_id)
        
        if success:
            existing_profile = db.query(VoiceProfile).filter(VoiceProfile.student_id == student.id).first()
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
            
            profile_info = voice_service.get_profile_info(student_id)
            
            return VoiceEnrollmentResponse(
                success=True,
                message="Voice profile created successfully",
                profile_path=result,
                duration=profile_info.get("duration")
            )
        else:
            raise HTTPException(status_code=400, detail=result)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice enrollment failed: {e}")
        raise HTTPException(status_code=500, detail="Voice enrollment failed")


@router.post("/verify", response_model=VoiceVerificationResponse)
async def verify_voice(
    student_id: str,
    session_id: int,
    spoken_word: str,
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if not session.is_active:
            raise HTTPException(status_code=400, detail="Session is not active")
        
        if not voice_service.profile_exists(student_id):
            raise HTTPException(status_code=400, detail="Voice profile not found. Please enroll first.")
        
        if audio_file.content_type not in ["audio/wav", "audio/mpeg", "audio/mp3", "audio/webm"]:
            raise HTTPException(status_code=400, detail="Invalid audio file format")
        
        reference_file = voice_service.get_profile_path(student_id)
        score, is_match, message = voice_service.verify_voice_from_upload(
            reference_file, audio_file.file
        )
        
        verification = VoiceVerification(
            student_id=student.id,
            session_id=session_id,
            audio_file_path="temp_verification.wav",
            similarity_score=score,
            verification_result=is_match
        )
        db.add(verification)
        db.commit()
        
        return VoiceVerificationResponse(
            success=is_match,
            message=message,
            similarity_score=score,
            verification_result=is_match,
            timestamp=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice verification failed: {e}")
        raise HTTPException(status_code=500, detail="Voice verification failed")


@router.get("/random-word", response_model=RandomWordResponse)
async def get_random_word():
    try:
        word = voice_service.get_random_word()
        return RandomWordResponse(
            word=word,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        logger.error(f"Random word generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate random word")


@router.get("/profile/{student_id}", response_model=VoiceProfileInfo)
async def get_voice_profile_info(student_id: str, db: Session = Depends(get_db)):
    try:
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        profile_info = voice_service.get_profile_info(student_id)
        return VoiceProfileInfo(**profile_info)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get profile info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get profile information")


@router.delete("/profile/{student_id}")
async def delete_voice_profile(student_id: str, db: Session = Depends(get_db)):
    try:
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        success = voice_service.delete_profile(student_id)
        if success:
            voice_profile = db.query(VoiceProfile).filter(VoiceProfile.student_id == student.id).first()
            if voice_profile:
                db.delete(voice_profile)
            
            student.voice_profile_path = None
            db.commit()
            
            return {"success": True, "message": "Voice profile deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Voice profile not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete voice profile")