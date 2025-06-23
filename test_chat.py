#!/usr/bin/env python3
"""
Test script using chat format for the Gemma model
"""

import sys
from pathlib import Path

try:
    from llama_cpp import Llama
except ImportError:
    print("Error: llama-cpp-python not installed")
    sys.exit(1)

def test_chat():
    model_path = "models/gemma-3-1b-it-q4_0.gguf"
    
    if not Path(model_path).exists():
        print(f"Model file not found: {model_path}")
        return
    
    try:
        print("Loading model...")
        llm = Llama(
            model_path=model_path,
            n_ctx=2048,
            n_threads=4,
            n_gpu_layers=0,
            verbose=False
        )
        
        print("Model loaded successfully!")
        
        # Test with chat format
        print("\nTesting with chat format...")
        messages = [
            {"role": "user", "content": "Say hello in Spanish."}
        ]
        
        response = llm.create_chat_completion(
            messages=messages,
            max_tokens=50,
            temperature=0.7,
            stop=["<end_of_turn>", "\n\n"]
        )
        
        print(f"Chat Response: {response}")
        if response['choices'] and response['choices'][0]['message']:
            print(f"Generated text: '{response['choices'][0]['message']['content'].strip()}'")
        else:
            print("No content generated")
        
        # Test with a more specific prompt
        print("\nTesting with specific Spanish prompt...")
        messages2 = [
            {"role": "user", "content": "Translate 'Hello, how are you?' to Spanish."}
        ]
        
        response2 = llm.create_chat_completion(
            messages=messages2,
            max_tokens=100,
            temperature=0.7,
            stop=["<end_of_turn>", "\n\n"]
        )
        
        print(f"Chat Response2: {response2}")
        if response2['choices'] and response2['choices'][0]['message']:
            print(f"Generated text2: '{response2['choices'][0]['message']['content'].strip()}'")
        else:
            print("No content generated")
        
        # Test with system prompt
        print("\nTesting with system prompt...")
        messages3 = [
            {"role": "system", "content": "You are a helpful Spanish language tutor."},
            {"role": "user", "content": "Say hello in Spanish."}
        ]
        
        response3 = llm.create_chat_completion(
            messages=messages3,
            max_tokens=50,
            temperature=0.7,
            stop=["<end_of_turn>", "\n\n"]
        )
        
        print(f"Chat Response3: {response3}")
        if response3['choices'] and response3['choices'][0]['message']:
            print(f"Generated text3: '{response3['choices'][0]['message']['content'].strip()}'")
        else:
            print("No content generated")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_chat() 