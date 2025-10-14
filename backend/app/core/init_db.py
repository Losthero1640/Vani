from sqlalchemy.orm import Session
import logging

from app.core.database import SessionLocal
from app.services.user_service import user_service
from app.schemas.user import AdminCreate, StudentCreate

logger = logging.getLogger(__name__)


def create_default_admin(db: Session):
    try:
        existing_admin = user_service.get_admin_by_id(db, 1)
        if existing_admin:
            logger.info("Default admin already exists")
            return
        
        admin_data = AdminCreate(
            username="admin",
            email="admin@voiceattendance.com",
            password="admin123"
        )
        
        success, message, admin = user_service.create_admin(db, admin_data)
        if success:
            logger.info("Default admin created successfully")
        else:
            logger.error(f"Failed to create default admin: {message}")
            
    except Exception as e:
        logger.error(f"Error creating default admin: {e}")


def create_sample_students(db: Session):
    try:
        sample_students = [
            StudentCreate(
                student_id="CS001",
                name="John Doe",
                branch="Computer Science",
                year=3
            ),
            StudentCreate(
                student_id="CS002", 
                name="Jane Smith",
                branch="Computer Science",
                year=2
            ),
            StudentCreate(
                student_id="EE001",
                name="Mike Johnson",
                branch="Electrical Engineering", 
                year=4
            )
        ]
        
        for student_data in sample_students:
            existing = user_service.get_student_by_student_id(db, student_data.student_id)
            if not existing:
                success, message, student = user_service.create_student(db, student_data)
                if success:
                    logger.info(f"Sample student created: {student_data.student_id}")
                else:
                    logger.error(f"Failed to create sample student {student_data.student_id}: {message}")
            else:
                logger.info(f"Sample student {student_data.student_id} already exists")
                
    except Exception as e:
        logger.error(f"Error creating sample students: {e}")


def init_database():
    try:
        db = SessionLocal()
        
        logger.info("Initializing database with default data...")
        
        create_default_admin(db)
        create_sample_students(db)
        
        logger.info("Database initialization completed")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_database()