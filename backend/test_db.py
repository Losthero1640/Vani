#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import init_db, SessionLocal
from app.services.user_service import user_service
from app.schemas.user import AdminCreate

def test_database():
    print("Testing database connection...")
    
    try:
        init_db()
        print("✓ Database initialized")
        
        db = SessionLocal()
        
        admin_data = AdminCreate(
            username="admin",
            email="admin@test.com", 
            password="admin123"
        )
        
        existing_admin = user_service.authenticate_admin(db, "admin", "admin123")
        if existing_admin:
            print("✓ Default admin exists and can authenticate")
        else:
            print("⚠ Default admin not found, creating...")
            success, message, admin = user_service.create_admin(db, admin_data)
            if success:
                print("✓ Default admin created")
            else:
                print(f"✗ Failed to create admin: {message}")
        
        db.close()
        print("✓ Database test completed successfully")
        
    except Exception as e:
        print(f"✗ Database test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database()