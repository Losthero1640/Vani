import os
import sounddevice as sd
import soundfile as sf  
from speechbrain.pretrained import SpeakerRecognition


os.environ["SPEECHBRAIN_NO_SYMLINKS"] = "true"


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MY_VOICE = os.path.join(BASE_DIR, "my_voice.wav")
TEST_VOICE = os.path.join(BASE_DIR, "test.wav")


def record_audio(filename, duration=15, samplerate=16000):
    print(f"Recording for {duration} seconds...")
    audio = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype="float32")
    sd.wait()
    sf.write(filename, audio, samplerate)  
    print(f" Saved: {filename}")


MODEL_DIR = os.path.join(BASE_DIR, "pretrained_models", "speaker_recognition")
verifier = SpeakerRecognition.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    savedir=MODEL_DIR
)


if not os.path.exists(MY_VOICE):
    record_audio(MY_VOICE, duration=20)


record_audio(TEST_VOICE, duration=5)


import torchaudio
try:
    waveform, sr = torchaudio.load(MY_VOICE)
    print(f"{MY_VOICE} loaded successfully: shape={waveform.shape}, sr={sr}")
except Exception as e:
    print(f" Error loading {MY_VOICE}:", e)

try:
    waveform, sr = torchaudio.load(TEST_VOICE)
    print(f"{TEST_VOICE} loaded successfully: shape={waveform.shape}, sr={sr}")
except Exception as e:
    print(f" Error loading {TEST_VOICE}:", e)

score, prediction = verifier.verify_files(MY_VOICE, TEST_VOICE)

print(f" Score: {score.item():.2f}")
if prediction:
    print(" Same Speaker (This is your voice!)")
else:
    print(" Different Speaker")
