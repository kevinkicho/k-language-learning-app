#!/usr/bin/env python3
"""
Simple test script to check if the LLM can generate text
"""

import sys
from pathlib import Path

try:
    from llama_cpp import Llama
except ImportError:
    print("Error: llama-cpp-python not installed")
    sys.exit(1)

def test_llm():
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
            verbose=True
        )
        
        print("Model loaded successfully!")
        
        # Test with a very simple prompt
        print("\nTesting with simple prompt...")
        response = llm(
            "Say hello in Spanish.",
            max_tokens=50,
            temperature=0.7,
            stop=["\n", "Human:", "Assistant:"]
        )
        
        print(f"Response: {response}")
        print(f"Generated text: '{response['choices'][0]['text'].strip()}'")
        
        # Test with a slightly more complex prompt
        print("\nTesting with JSON prompt...")
        response2 = llm(
            'Respond with a JSON object: {"greeting": "hello in Spanish"}',
            max_tokens=100,
            temperature=0.7,
            stop=["\n", "Human:", "Assistant:"]
        )
        
        print(f"Response2: {response2}")
        print(f"Generated text2: '{response2['choices'][0]['text'].strip()}'")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_llm() 