#!/usr/bin/env python3
"""
Simple test for quiz generation
"""

import json
import sys
from pathlib import Path

try:
    from llama_cpp import Llama
except ImportError:
    print("Error: llama-cpp-python not installed")
    sys.exit(1)

def test_quiz_generation():
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
        
        # Test with a simple quiz prompt
        print("\nTesting quiz generation...")
        messages = [
            {
                "role": "system", 
                "content": "You are a Spanish language tutor. Generate simple Spanish sentences."
            },
            {
                "role": "user",
                "content": "Create 2 simple Spanish sentences about greetings. Respond with JSON format: {\"sentences\": [{\"spanish\": \"...\", \"english\": \"...\"}]}"
            }
        ]
        
        response = llm.create_chat_completion(
            messages=messages,
            max_tokens=200,
            temperature=0.7,
            stop=["<end_of_turn>"]
        )
        
        print(f"Response: {response}")
        if response['choices'] and response['choices'][0]['message']:
            content = response['choices'][0]['message']['content'].strip()
            print(f"Generated content: '{content}'")
            
            # Try to parse as JSON
            try:
                start_idx = content.find('{')
                end_idx = content.rfind('}') + 1
                if start_idx != -1 and end_idx != 0:
                    json_str = content[start_idx:end_idx]
                    data = json.loads(json_str)
                    print(f"Parsed JSON: {json.dumps(data, indent=2)}")
                else:
                    print("No JSON found in response")
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
        else:
            print("No content generated")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_quiz_generation() 