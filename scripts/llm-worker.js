const { spawn } = require('child_process');
const path = require('path');

// This script runs the LLM in a separate process
// It will be called from the API route via child_process.spawn

function sanitizeLLMOutput(output, prompt) {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(output);
    if (parsed.quiz) return JSON.stringify(parsed);
  } catch (e) {
    // Not valid JSON, continue
  }

  // Try to extract JSON substring
  const startIdx = output.indexOf('{');
  const endIdx = output.lastIndexOf('}') + 1;
  if (startIdx !== -1 && endIdx !== 0) {
    const jsonStr = output.slice(startIdx, endIdx);
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.quiz) return JSON.stringify(parsed);
    } catch (e) {}
  }

  // Fallback: extract English/Spanish pairs from lines
  // Look for lines like: Spanish: ... English: ...
  const lines = output.split('\n');
  const pairs = [];
  for (const line of lines) {
    const match = line.match(/([A-Za-zÁÉÍÓÚáéíóúñÑ¿¡,.'\s]+): ([A-Za-zÁÉÍÓÚáéíóúñÑ¿¡,.'\s]+)/g);
    if (match && match.length >= 2) {
      // Try to split into Spanish/English
      const [spanish, english] = match.map(s => s.split(':')[1].trim());
      if (spanish && english) {
        pairs.push({ spanish, english });
      }
    }
  }
  // If not found, try to find lines with both Spanish and English
  if (pairs.length === 0) {
    for (const line of lines) {
      // e.g. "Hola, ¿cómo estás? - Hello, how are you?"
      const dashMatch = line.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ¿¡,.'\s]+)\s*-\s*([A-Za-zÁÉÍÓÚáéíóúñÑ¿¡,.'\s]+)$/);
      if (dashMatch) {
        pairs.push({ spanish: dashMatch[1].trim(), english: dashMatch[2].trim() });
      }
    }
  }
  // If still not found, just grab the first two lines as Spanish/English
  if (pairs.length === 0 && lines.length >= 2) {
    pairs.push({ spanish: lines[0].trim(), english: lines[1].trim() });
  }
  // Build a minimal quiz object
  if (pairs.length > 0) {
    const timestamp = Date.now();
    const quiz = {
      quiz: {
        id: `quiz_${timestamp}`,
        title: `Quiz: (sanitized)`,
        sentences: pairs.map((p, i) => ({
          id: `sentence_${timestamp}_${i+1}`,
          spanish: p.spanish,
          english: p.english,
          difficulty: 'beginner',
          topic: 'general'
        })),
        questions: [
          {
            id: `q_translation_1`,
            question: `Translate: ${pairs[0].english}`,
            correctAnswer: pairs[0].spanish,
            options: [pairs[0].spanish],
            type: 'translation'
          }
        ]
      }
    };
    return JSON.stringify(quiz);
  }
  
  // If all else fails, return error with AI response information
  return JSON.stringify({
    error: 'Failed to extract usable content from AI response',
    aiResponse: output,
    prompt: prompt,
    details: 'The AI response could not be parsed as JSON or converted to sentence pairs. Please try a different prompt or check the AI response format.'
  });
}

async function runLLM(prompt, modelPath) {
  return new Promise((resolve, reject) => {
    // Call the Python script with the real LLM
    const pythonScriptPath = path.join(process.cwd(), 'scripts', 'llm_python.py');
    const child = spawn('python', [pythonScriptPath]);
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        // Sanitize here
        resolve(sanitizeLLMOutput(output.trim(), prompt));
      } else {
        console.error('Python LLM script failed:', errorOutput);
        // Return error instead of mock response
        resolve(JSON.stringify({
          error: 'Python LLM script failed',
          details: errorOutput,
          prompt: prompt
        }));
      }
    });
    
    child.on('error', (error) => {
      console.error('Failed to start Python LLM script:', error.message);
      // Return error instead of mock response
      resolve(JSON.stringify({
        error: 'Failed to start Python LLM script',
        details: error.message,
        prompt: prompt
      }));
    });
    
    // Send input to the Python script
    const input = JSON.stringify({ prompt, modelPath });
    child.stdin.write(input);
    child.stdin.end();
  });
}

// If this script is run directly, it expects input from stdin
if (require.main === module) {
  let input = '';
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  
  process.stdin.on('end', async () => {
    try {
      const { prompt, modelPath } = JSON.parse(input);
      const result = await runLLM(prompt, modelPath);
      // Only output the JSON result, nothing else
      process.stdout.write(result);
    } catch (error) {
      console.error('LLM Worker Error:', error);
      process.exit(1);
    }
  });
}

module.exports = { runLLM }; 