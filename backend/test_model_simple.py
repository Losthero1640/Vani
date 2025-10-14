#!/usr/bin/env python3

import os
import tempfile
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")
os.environ["SPEECHBRAIN_NO_SYMLINKS"] = "true"

def test_speechbrain_model():
    """Simple test to load SpeechBrain model"""
    
    print("Testing SpeechBrain model loading...")
    
    try:
        from speechbrain.pretrained import SpeakerRecognition
        
        # Try loading with minimal configuration
        print("Attempting to load SpeechBrain ECAPA model...")
        
        # Create a temporary directory for the model
        temp_dir = tempfile.mkdtemp(prefix="speechbrain_test_")
        print(f"Using temp directory: {temp_dir}")
        
        verifier = SpeakerRecognition.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir=temp_dir,
            run_opts={"device": "cpu"}
        )
        
        print("✅ Model loaded successfully!")
        
        # Test basic functionality
        print("Testing model functionality...")
        
        # This should work without actual audio files
        print("Model type:", type(verifier))
        print("Model device:", verifier.device)
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        
        # Try alternative approach
        try:
            print("Trying alternative loading method...")
            verifier = SpeakerRecognition.from_hparams(
                source="speechbrain/spkrec-ecapa-voxceleb"
            )
            print("✅ Alternative method worked!")
            return True
        except Exception as e2:
            print(f"❌ Alternative method also failed: {e2}")
            return False

if __name__ == "__main__":
    success = test_speechbrain_model()
    if success:
        print("\n🎉 SpeechBrain model is working!")
    else:
        print("\n❌ SpeechBrain model has issues.")
        print("\nTroubleshooting tips:")
        print("1. Try running as administrator")
        print("2. Check if antivirus is blocking file operations")
        print("3. Ensure sufficient disk space in temp directory")
        print("4. Try clearing Python cache: python -m pip cache purge")