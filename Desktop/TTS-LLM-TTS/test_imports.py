"""
Quick test to verify all imports work correctly
"""
print("Testing imports...")

try:
    print("1. Testing config...")
    import config
    print("   ✓ config imported successfully")

    print("2. Testing core...")
    # Don't instantiate, just import
    from core import TTSLLMTTSCore
    print("   ✓ core imported successfully")

    print("3. Testing STT...")
    from stt import WhisperSTT
    print("   ✓ STT imported successfully")

    print("4. Testing LLM...")
    from llm import LLMProvider
    print("   ✓ LLM imported successfully")

    print("5. Testing TTS...")
    from tts import TTSProvider
    print("   ✓ TTS imported successfully")

    print("6. Testing Memory...")
    from memory import MemoryManager
    print("   ✓ Memory imported successfully")

    print("7. Testing Personality...")
    from personality import ProfileManager
    print("   ✓ Personality imported successfully")

    print("\n✅ All imports successful! The system structure is correct.")
    print("\nNote: To run the full system, use:")
    print("  python main.py              # Start web interface")
    print("  python main.py --cli        # Start CLI mode")

except ImportError as e:
    print(f"\n❌ Import error: {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
