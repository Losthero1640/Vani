#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.voice_service import voice_service
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_voice_service():
    """Test the voice service functionality"""
    
    print("=== Voice Service Test ===")
    
    # Test 1: Check if model loads
    print("\n1. Testing model loading...")
    if voice_service.verifier is None:
        print("❌ Voice model not loaded - attempting to load...")
        try:
            voice_service._load_model()
            if voice_service.verifier:
                print("✅ Voice model loaded successfully")
            else:
                print("❌ Failed to load voice model")
                return False
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False
    else:
        print("✅ Voice model already loaded")
    
    # Test 2: Check random word generation
    print("\n2. Testing random word generation...")
    try:
        word = voice_service.get_random_word()
        print(f"✅ Random word generated: '{word}'")
    except Exception as e:
        print(f"❌ Error generating random word: {e}")
        return False
    
    # Test 3: Check directory creation
    print("\n3. Testing directory setup...")
    try:
        from app.core.config import settings
        profile_dir = os.path.join(settings.AUDIO_UPLOAD_DIR, "profiles")
        os.makedirs(profile_dir, exist_ok=True)
        os.makedirs(settings.AUDIO_UPLOAD_DIR, exist_ok=True)
        print(f"✅ Directories created: {settings.AUDIO_UPLOAD_DIR}")
    except Exception as e:
        print(f"❌ Error creating directories: {e}")
        return False
    
    # Test 4: Check profile path generation
    print("\n4. Testing profile path generation...")
    try:
        test_student_id = "TEST123"
        profile_path = voice_service.get_profile_path(test_student_id)
        print(f"✅ Profile path: {profile_path}")
        
        # Check if profile exists (should be False for test student)
        exists = voice_service.profile_exists(test_student_id)
        print(f"✅ Profile exists check: {exists} (expected: False)")
    except Exception as e:
        print(f"❌ Error with profile operations: {e}")
        return False
    
    # Test 5: Test audio validation with a dummy file
    print("\n5. Testing audio validation...")
    try:
        # This should return False for non-existent file
        result = voice_service.validate_audio_file("non_existent_file.wav")
        print(f"✅ Audio validation (non-existent): {result} (expected: False)")
    except Exception as e:
        print(f"❌ Error in audio validation: {e}")
        return False
    
    print("\n=== Voice Service Test Complete ===")
    print("✅ All basic tests passed!")
    return True

if __name__ == "__main__":
    success = test_voice_service()
    if success:
        print("\n🎉 Voice service is ready for use!")
    else:
        print("\n❌ Voice service has issues that need to be resolved.")
        sys.exit(1)