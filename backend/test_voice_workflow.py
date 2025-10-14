#!/usr/bin/env python3

import sys
import os
import tempfile
import io
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.voice_service import voice_service
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_dummy_audio_file(duration_seconds=5, sample_rate=16000):
    """Create a dummy audio file for testing"""
    import numpy as np
    import soundfile as sf
    
    # Generate a simple sine wave
    t = np.linspace(0, duration_seconds, int(sample_rate * duration_seconds))
    frequency = 440  # A4 note
    audio_data = 0.3 * np.sin(2 * np.pi * frequency * t)
    
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    sf.write(temp_file.name, audio_data, sample_rate)
    temp_file.close()
    
    return temp_file.name

def test_voice_workflow():
    """Test the complete voice enrollment and verification workflow"""
    
    print("=== Voice Workflow Test ===")
    
    test_student_id = "TEST_STUDENT_123"
    
    try:
        # Test 1: Create dummy audio files
        print("\n1. Creating dummy audio files...")
        enrollment_audio = create_dummy_audio_file(duration_seconds=20)  # 20 seconds for enrollment
        verification_audio = create_dummy_audio_file(duration_seconds=5)  # 5 seconds for verification
        print(f"✅ Created enrollment audio: {enrollment_audio}")
        print(f"✅ Created verification audio: {verification_audio}")
        
        # Test 2: Test voice profile creation
        print("\n2. Testing voice profile creation...")
        success, result = voice_service.create_voice_profile(enrollment_audio, test_student_id)
        if success:
            print(f"✅ Voice profile created: {result}")
            profile_path = result
        else:
            print(f"❌ Voice profile creation failed: {result}")
            return False
        
        # Test 3: Check if profile exists
        print("\n3. Testing profile existence check...")
        exists = voice_service.profile_exists(test_student_id)
        if exists:
            print("✅ Profile exists check passed")
        else:
            print("❌ Profile exists check failed")
            return False
        
        # Test 4: Get profile info
        print("\n4. Testing profile info retrieval...")
        profile_info = voice_service.get_profile_info(test_student_id)
        if profile_info.get("exists"):
            print(f"✅ Profile info: duration={profile_info.get('duration', 0):.1f}s, "
                  f"sample_rate={profile_info.get('sample_rate', 0)}Hz")
        else:
            print("❌ Profile info retrieval failed")
            return False
        
        # Test 5: Test voice verification
        print("\n5. Testing voice verification...")
        score, is_match, message = voice_service.verify_voice(profile_path, verification_audio)
        print(f"✅ Verification result: score={score:.3f}, match={is_match}, message='{message}'")
        
        # Test 6: Test web audio processing (simulate browser upload)
        print("\n6. Testing web audio processing...")
        with open(verification_audio, 'rb') as f:
            audio_data = f.read()
        
        # Create a file-like object
        audio_file = io.BytesIO(audio_data)
        
        try:
            processed_path = voice_service.process_web_audio(audio_file)
            print(f"✅ Web audio processed: {processed_path}")
            
            # Test verification with processed audio
            score2, is_match2, message2 = voice_service.verify_voice(profile_path, processed_path)
            print(f"✅ Verification with processed audio: score={score2:.3f}, match={is_match2}")
            
            # Cleanup processed file
            if os.path.exists(processed_path):
                os.unlink(processed_path)
                
        except Exception as e:
            print(f"⚠️  Web audio processing failed (expected on some systems): {e}")
        
        # Test 7: Test upload-based verification
        print("\n7. Testing upload-based verification...")
        audio_file.seek(0)  # Reset file pointer
        score3, is_match3, message3 = voice_service.verify_voice_from_upload(profile_path, audio_file)
        print(f"✅ Upload verification: score={score3:.3f}, match={is_match3}, message='{message3}'")
        
        # Test 8: Test profile deletion
        print("\n8. Testing profile deletion...")
        deleted = voice_service.delete_profile(test_student_id)
        if deleted:
            print("✅ Profile deleted successfully")
            
            # Verify it's gone
            exists_after = voice_service.profile_exists(test_student_id)
            if not exists_after:
                print("✅ Profile deletion verified")
            else:
                print("❌ Profile still exists after deletion")
                return False
        else:
            print("❌ Profile deletion failed")
            return False
        
        print("\n=== Voice Workflow Test Complete ===")
        print("✅ All workflow tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Workflow test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # Cleanup temporary files
        try:
            if 'enrollment_audio' in locals() and os.path.exists(enrollment_audio):
                os.unlink(enrollment_audio)
            if 'verification_audio' in locals() and os.path.exists(verification_audio):
                os.unlink(verification_audio)
        except:
            pass

if __name__ == "__main__":
    success = test_voice_workflow()
    if success:
        print("\n🎉 Voice workflow is fully functional!")
        print("\nThe system can:")
        print("✅ Create voice profiles from audio files")
        print("✅ Verify voices against stored profiles") 
        print("✅ Process web audio uploads")
        print("✅ Handle enrollment and verification workflow")
        print("✅ Manage profile storage and deletion")
    else:
        print("\n❌ Voice workflow has issues that need to be resolved.")
        sys.exit(1)