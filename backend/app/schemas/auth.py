from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class UserType(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"


class LoginRequest(BaseModel):
    user_type: UserType
    username: Optional[str] = Field(None, description="Username for admin login")
    password: Optional[str] = Field(None, description="Password for admin login")
    student_id: Optional[str] = Field(None, description="Student ID for student login")


class LoginResponse(BaseModel):
    success: bool
    message: str
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user_type: Optional[UserType] = None
    user_id: Optional[int] = None
    username: Optional[str] = None
    student_id: Optional[str] = None


class TokenData(BaseModel):
    user_id: Optional[int] = None
    user_type: Optional[str] = None
    username: Optional[str] = None
    student_id: Optional[str] = None


class CurrentUser(BaseModel):
    id: int
    user_type: UserType
    username: Optional[str] = None
    student_id: Optional[str] = None
    name: Optional[str] = None
    is_active: bool