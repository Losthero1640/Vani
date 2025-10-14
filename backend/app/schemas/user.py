from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class UserType(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"


class UserBase(BaseModel):
    user_type: UserType
    is_active: bool = True


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdminBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class AdminCreate(AdminBase):
    password: str = Field(..., min_length=6)


class AdminResponse(AdminBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True


class StudentBase(BaseModel):
    student_id: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    branch: str = Field(..., min_length=1, max_length=50)
    year: int = Field(..., ge=1, le=6)


class StudentCreate(StudentBase):
    pass


class StudentResponse(StudentBase):
    id: int
    user_id: int
    voice_profile_path: Optional[str] = None
    enrollment_date: datetime
    
    class Config:
        from_attributes = True


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    branch: Optional[str] = Field(None, min_length=1, max_length=50)
    year: Optional[int] = Field(None, ge=1, le=6)