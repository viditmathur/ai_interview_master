import sys
import pyttsx3

if len(sys.argv) < 3:
    print("Usage: python tts.py 'text to speak' output.wav")
    sys.exit(1)

text = sys.argv[1]
output = sys.argv[2]

engine = pyttsx3.init()
engine.save_to_file(text, output)
engine.runAndWait() 