from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import verify_token
from app.services.user_service import user_service
from app.schemas.auth import CurrentUser, UserType

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> CurrentUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(credentials.credentials)
        if payload is None:
            raise credentials_exception
        
        user_id: int = payload.get("user_id")
        user_type: str = payload.get("user_type")
        
        if user_id is None or user_type is None:
            raise credentials_exception
            
    except Exception:
        raise credentials_exception
    
    if user_type == UserType.ADMIN:
        admin = user_service.get_admin_by_id(db, payload.get("admin_id"))
        if admin is None:
            raise credentials_exception
        
        return CurrentUser(
            id=admin.id,
            user_type=UserType.ADMIN,
            username=admin.username,
            is_active=admin.user.is_active
        )
    
    elif user_type == UserType.STUDENT:
        student = user_service.get_student_by_id(db, payload.get("student_id"))
        if student is None:
            raise credentials_exception
        
        return CurrentUser(
            id=student.id,
            user_type=UserType.STUDENT,
            student_id=student.student_id,
            name=student.name,
            is_active=student.user.is_active
        )
    
    else:
        raise credentials_exception


def get_current_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.user_type != UserType.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_current_student(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.user_type != UserType.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user