from sqlalchemy.orm import Session
from typing import Optional, Tuple
import logging

from app.models.user import User, Admin, Student, UserType
from app.schemas.user import AdminCreate, StudentCreate
from app.core.security import get_password_hash, verify_password

logger = logging.getLogger(__name__)


class UserService:
    
    def create_admin(self, db: Session, admin_data: AdminCreate) -> Tuple[bool, str, Optional[Admin]]:
        try:
            existing_admin = db.query(Admin).filter(
                (Admin.username == admin_data.username) | 
                (Admin.email == admin_data.email)
            ).first()
            
            if existing_admin:
                return False, "Username or email already exists", None
            
            user = User(user_type=UserType.ADMIN)
            db.add(user)
            db.flush()
            
            hashed_password = get_password_hash(admin_data.password)
            admin = Admin(
                user_id=user.id,
                username=admin_data.username,
                email=admin_data.email,
                password_hash=hashed_password
            )
            db.add(admin)
            db.commit()
            
            logger.info(f"Admin created: {admin_data.username}")
            return True, "Admin created successfully", admin
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create admin: {e}")
            return False, f"Failed to create admin: {str(e)}", None
    
    def create_student(self, db: Session, student_data: StudentCreate) -> Tuple[bool, str, Optional[Student]]:
        try:
            existing_student = db.query(Student).filter(
                Student.student_id == student_data.student_id
            ).first()
            
            if existing_student:
                return False, "Student ID already exists", None
            
            user = User(user_type=UserType.STUDENT)
            db.add(user)
            db.flush()
            
            student = Student(
                user_id=user.id,
                student_id=student_data.student_id,
                name=student_data.name,
                branch=student_data.branch,
                year=student_data.year
            )
            db.add(student)
            db.commit()
            
            logger.info(f"Student created: {student_data.student_id}")
            return True, "Student created successfully", student
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create student: {e}")
            return False, f"Failed to create student: {str(e)}", None
    
    def authenticate_admin(self, db: Session, username: str, password: str) -> Optional[Admin]:
        try:
            admin = db.query(Admin).filter(Admin.username == username).first()
            if admin and verify_password(password, admin.password_hash):
                user = db.query(User).filter(User.id == admin.user_id).first()
                if user and user.is_active:
                    return admin
            return None
        except Exception as e:
            logger.error(f"Admin authentication failed: {e}")
            return None
    
    def authenticate_student(self, db: Session, student_id: str) -> Optional[Student]:
        try:
            student = db.query(Student).filter(Student.student_id == student_id).first()
            if student:
                user = db.query(User).filter(User.id == student.user_id).first()
                if user and user.is_active:
                    return student
            return None
        except Exception as e:
            logger.error(f"Student authentication failed: {e}")
            return None
    
    def get_admin_by_id(self, db: Session, admin_id: int) -> Optional[Admin]:
        return db.query(Admin).filter(Admin.id == admin_id).first()
    
    def get_student_by_id(self, db: Session, student_id: int) -> Optional[Student]:
        return db.query(Student).filter(Student.id == student_id).first()
    
    def get_student_by_student_id(self, db: Session, student_id: str) -> Optional[Student]:
        return db.query(Student).filter(Student.student_id == student_id).first()
    
    def get_all_students(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Student).offset(skip).limit(limit).all()
    
    def update_student(self, db: Session, student_id: str, update_data: dict) -> Tuple[bool, str]:
        try:
            student = self.get_student_by_student_id(db, student_id)
            if not student:
                return False, "Student not found"
            
            for field, value in update_data.items():
                if hasattr(student, field) and value is not None:
                    setattr(student, field, value)
            
            db.commit()
            return True, "Student updated successfully"
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update student: {e}")
            return False, f"Failed to update student: {str(e)}"
    
    def deactivate_user(self, db: Session, user_id: int) -> bool:
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_active = False
                db.commit()
                return True
            return False
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to deactivate user: {e}")
            return False


user_service = UserService()