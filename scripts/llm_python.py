#!/usr/bin/env python3
"""
LLM Python Script for Spanish Language Learning
Uses the downloaded Gemma model to generate Spanish sentences
"""

import json
import sys
import os
from pathlib import Path

try:
    from llama_cpp import Llama
except ImportError:
    print("Error: llama-cpp-python not installed. Run: pip install llama-cpp-python")
    sys.exit(1)

def load_model(model_path):
    """Load the Gemma model"""
    try:
        # Initialize the model
        llm = Llama(
            model_path=model_path,
            n_ctx=4096,  # Context window
            n_threads=4,  # Number of CPU threads
            n_gpu_layers=0,  # No GPU layers for now
            verbose=False
        )
        return llm
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

def generate_quiz(llm, command):
    """Generate a Spanish quiz based on the command"""
    
    # Create a much simpler prompt for the LLM using chat format
    messages = [
        {
            "role": "system", 
            "content": "You are a helpful Spanish language tutor. Create simple Spanish sentences and respond in JSON format."
        },
        {
            "role": "user",
            "content": f"""Create 3 Spanish sentences that contain the word "because" (porque). 

Respond with this exact JSON format:
{{
  "quiz": {{
    "id": "quiz_1",
    "title": "Quiz: Because Sentences",
    "sentences": [
      {{
        "id": "sentence_1",
        "spanish": "Spanish sentence with porque",
        "english": "English translation",
        "difficulty": "beginner",
        "topic": "because"
      }}
    ],
    "questions": [
      {{
        "id": "q_1",
        "question": "Translate: [English sentence]",
        "correctAnswer": "Spanish sentence",
        "options": ["Spanish sentence", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
        "type": "translation"
      }}
    ]
  }}
}}

Make sure each Spanish sentence uses "porque" naturally."""
        }
    ]

    try:
        # Generate response from the model using chat completion
        response = llm.create_chat_completion(
            messages=messages,
            max_tokens=500,  # Reduced from 2048
            temperature=0.7,
            top_p=0.9,
            top_k=40,
            stop=["<end_of_turn>", "```", "Human:", "Assistant:"]
        )
        
        # Extract the generated text
        generated_text = response['choices'][0]['message']['content'].strip()
        print("\n--- RAW LLM OUTPUT START ---\n" + generated_text + "\n--- RAW LLM OUTPUT END ---\n", file=sys.stderr)
        
        # Try to parse as JSON
        try:
            # Find JSON in the response (in case there's extra text)
            start_idx = generated_text.find('{')
            end_idx = generated_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != 0:
                json_str = generated_text[start_idx:end_idx]
                quiz_data = json.loads(json_str)
                return json.dumps(quiz_data)
            else:
                raise ValueError("No JSON found in response")
                
        except json.JSONDecodeError:
            # If JSON parsing fails, return error with AI response information
            return json.dumps({
                "error": "Failed to parse AI response as JSON",
                "aiResponse": generated_text,
                "command": command,
                "details": "The AI response could not be parsed as valid JSON. Please try a different prompt or check the AI response format."
            })
            
    except Exception as e:
        print(f"Error generating response: {e}")
        return json.dumps({
            "error": "Failed to generate AI response",
            "exception": str(e),
            "command": command,
            "details": "An error occurred while generating the AI response. Please try again."
        })

def main():
    """Main function to handle input and output"""
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        prompt = data.get('prompt', '')
        model_path = data.get('modelPath', '')
        
        # Load the model
        llm = load_model(model_path)
        
        if llm is None:
            # If model loading fails, return error
            result = json.dumps({
                "error": "Failed to load LLM model",
                "modelPath": model_path,
                "details": "The LLM model could not be loaded. Please check the model file path and ensure the model is properly installed."
            })
        else:
            # Extract command from prompt - handle different formats
            command = ''
            if 'command: "' in prompt:
                command_match = prompt.split('command: "')[1].split('"')[0] if 'command: "' in prompt else ''
                command = command_match
            else:
                # If no command format found, use the entire prompt
                command = prompt.strip()
            
            result = generate_quiz(llm, command)
        
        # Output the result
        print(result)
        
    except Exception as e:
        print(json.dumps({
            "error": "Script execution failed",
            "exception": str(e),
            "details": "An unexpected error occurred while processing the request."
        }))
        sys.exit(1)

if __name__ == "__main__":
    main() 