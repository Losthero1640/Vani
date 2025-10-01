from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import csv
import io
import logging

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.services.user_service import user_service
from app.services.attendance_service import attendance_service
from app.services.qr_service import qr_service
from app.schemas.user import StudentResponse
from app.schemas.attendance import (
    AttendanceSessionCreate, AttendanceSessionResponse,
    QRGenerateRequest, QRGenerateResponse, AttendanceStatsResponse
)
from app.schemas.auth import CurrentUser

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/dashboard", response_model=AttendanceStatsResponse)
async def get_dashboard(
    current_user: CurrentUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        stats = attendance_service.get_attendance_stats(db, current_user.id)
        
        return AttendanceStatsResponse(
            total_sessions=stats["total_sessions"],
            active_sessions=stats["active_sessions"],
            total_students=stats["total_students"],
            present_today=stats["present_today"],
            absent_today=stats["absent_today"],
            attendance_rate=stats["attendance_rate"]
        )
        
    except Exception as e:
        logger.error(f"Failed to get dashboard stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get dashboard statistics"
        )


@router.get("/students", response_model=List[StudentResponse])
async def get_students(
    current_user: CurrentUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    try:
        students = user_service.get_all_students(db, skip, limit)
        
        return [
            StudentResponse(
                id=student.id,
                user_id=student.user_id,
                student_id=student.student_id,
                name=student.name,
                branch=student.branch,
                year=student.year,
                voice_profile_path=student.voice_profile_path,
                enrollment_date=student.enrollment_date
            )
            for student in students
        ]
        
    except Exception as e:
        logger.error(f"Failed to get students: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get students"
        )


@router.post("/classes", response_model=AttendanceSessionResponse)
async def create_class(
    session_data: AttendanceSessionCreate,
    current_user: CurrentUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        success, message, session = attendance_service.create_session(
            db, session_data, current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        return AttendanceSessionResponse(
            id=session.id,
            class_name=session.class_name,
            room_number=session.room_number,
            admin_id=session.admin_id,
            qr_code=session.qr_code,
            session_date=session.session_date,
            is_active=session.is_active,
            random_words=session.random_words
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create class session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create class session"
        )


@router.get("/classes", response_model=List[AttendanceSessionResponse])
async def get_classes(
    current_user: CurrentUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    try:
        sessions = attendance_service.get_admin_sessions(db, current_user.id, skip, limit)
        
        return [
            AttendanceSessionResponse(
                id=session.id,
                class_name=session.class_name,
                room_number=session.room_number,
                admin_id=session.admin_id,
                qr_code=session.qr_code,
                session_date=session.session_date,
                is_active=session.is_active,
                random_words=session.random_words
            )
            for session in sessions
        ]
        
    except Exception as e:
        logger.error(f"Failed to get classes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get classes"
        )


@router.get("/classes/{class_id}/attendance")
async def get_class_attendance(
    class_id: int,
    current_user: CurrentUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        success, message, attendance_data = attendance_service.get_session_attendance(
            db, class_id, current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message
            )
        
        return {
            "success": True,
            "session_id": class_id,
            "attendance_records": attendance_data,
            "total_records": len(attendance_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get class attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get class attendance"
        )


@router.post("/qr-generate", response_model=QRGenerateResponse)
async def generate_qr(
    qr_request: QRGenerateRequest,
    current_user: CurrentUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        session_data = AttendanceSessionCreate(
            class_name=qr_request.class_name,
            room_number=qr_request.room_number
        )
        
        success, message, session = attendance_service.create_session(
            db, session_data, current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        qr_success, qr_image_base64, qr_message = qr_service.generate_session_qr(
            session.id, session.qr_code
        )
        
        if not qr_success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=qr_message
            )
        
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        return QRGenerateResponse(
            success=True,
            qr_code=session.qr_code,
            session_id=session.id,
            qr_image_base64=qr_image_base64,
            expires_at=expires_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate QR code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate QR code"
        )


@router.post("/classes/{class_id}/deactivate")
async def deactivate_class(
    class_id: int,
    current_user: CurrentUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    try:
        success = attendance_service.deactivate_session(db, class_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found or access denied"
            )
        
        return {
            "success": True,
            "message": "Session deactivated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to deactivate session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate session"
        )


@router.get("/attendance/export")
async def export_attendance(
    current_user: CurrentUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
    session_id: int = None
):
    try:
        if session_id:
            success, message, attendance_data = attendance_service.get_session_attendance(
                db, session_id, current_user.id
            )
            
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=message
                )
        else:
            sessions = attendance_service.get_admin_sessions(db, current_user.id)
            attendance_data = []
            
            for session in sessions:
                _, _, session_data = attendance_service.get_session_attendance(
                    db, session.id, current_user.id
                )
                
                for record in session_data:
                    record["class_name"] = session.class_name
                    record["room_number"] = session.room_number
                    record["session_date"] = session.session_date
                    attendance_data.append(record)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        if attendance_data:
            headers = list(attendance_data[0].keys())
            writer.writerow(headers)
            
            for record in attendance_data:
                writer.writerow(list(record.values()))
        
        output.seek(0)
        csv_content = output.getvalue()
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=attendance_export.csv"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export attendance"
        )