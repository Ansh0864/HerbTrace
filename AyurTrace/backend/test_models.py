# backend/test_models.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load your GEMINI_API_KEY from the .env file in the same folder
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env file.")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    print("Checking for available Gemini models...")
    try:
        # This lists all models available to your specific API key
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        if available_models:
            print("\n✅ Success! Use one of these model strings in main.py:")
            for name in available_models:
                # Strips the 'models/' prefix for easier copying
                print(f" - {name.replace('models/', '')}")
        else:
            print("❌ No models found supporting generateContent.")
    except Exception as e:
        print(f"❌ Connection Error: {e}")