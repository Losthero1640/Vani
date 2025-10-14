from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

from app.core.database import get_db
from app.core.security import create_access_token
from app.core.deps import get_current_user
from app.services.user_service import user_service
from app.schemas.auth import LoginRequest, LoginResponse, CurrentUser, UserType
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    try:
        if login_data.user_type == UserType.ADMIN:
            if not login_data.username or not login_data.password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username and password required for admin login"
                )
            
            admin = user_service.authenticate_admin(db, login_data.username, login_data.password)
            if not admin:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid admin credentials"
                )
            
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={
                    "user_id": admin.user_id,
                    "user_type": UserType.ADMIN,
                    "admin_id": admin.id,
                    "username": admin.username
                },
                expires_delta=access_token_expires
            )
            
            return LoginResponse(
                success=True,
                message="Admin login successful",
                access_token=access_token,
                user_type=UserType.ADMIN,
                user_id=admin.user_id,
                username=admin.username
            )
        
        elif login_data.user_type == UserType.STUDENT:
            if not login_data.student_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Student ID required for student login"
                )
            
            student = user_service.authenticate_student(db, login_data.student_id)
            if not student:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid student ID or student not found"
                )
            
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={
                    "user_id": student.user_id,
                    "user_type": UserType.STUDENT,
                    "student_id": student.id,
                    "student_identifier": student.student_id
                },
                expires_delta=access_token_expires
            )
            
            return LoginResponse(
                success=True,
                message="Student login successful",
                access_token=access_token,
                user_type=UserType.STUDENT,
                user_id=student.user_id,
                student_id=student.student_id
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user type"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/logout")
async def logout():
    return {
        "success": True,
        "message": "Logout successful. Please remove the token from client storage."
    }


@router.get("/me", response_model=CurrentUser)
async def get_current_user_info(current_user: CurrentUser = Depends(get_current_user)):
    return current_user


@router.post("/refresh")
async def refresh_token(current_user: CurrentUser = Depends(get_current_user)):
    try:
        if current_user.user_type == UserType.ADMIN:
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={
                    "user_id": current_user.id,
                    "user_type": UserType.ADMIN,
                    "admin_id": current_user.id,
                    "username": current_user.username
                },
                expires_delta=access_token_expires
            )
        else:
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={
                    "user_id": current_user.id,
                    "user_type": UserType.STUDENT,
                    "student_id": current_user.id,
                    "student_identifier": current_user.student_id
                },
                expires_delta=access_token_expires
            )
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "message": "Token refreshed successfully"
        }
        
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )