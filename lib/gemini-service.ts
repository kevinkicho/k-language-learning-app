import { QuizGenerationRequest, QuizGenerationResponse } from './types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface ParsedSentence {
  english: string;
  spanish: string;
  notes?: string;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';

  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }
  }

  /**
   * Validates user input to ensure it's appropriate for language learning
   */
  private validateInput(command: string): { isValid: boolean; error?: string } {
    const lowerCommand = command.toLowerCase();
    
    // Check for inappropriate content only
    const inappropriateKeywords = [
      'profanity', 'curse', 'swear', 'inappropriate', 'offensive', 'explicit'
    ];

    const hasInappropriateContent = inappropriateKeywords.some(keyword =>
      lowerCommand.includes(keyword)
    );

    if (hasInappropriateContent) {
      return {
        isValid: false,
        error: 'Please keep your request appropriate for language learning.'
      };
    }

    // Check if the command is too short or empty
    if (command.trim().length < 2) {
      return {
        isValid: false,
        error: 'Please provide a more specific request for Spanish learning content.'
      };
    }

    return { isValid: true };
  }

  /**
   * Generates a prompt for Gemini AI based on user input
   */
  private buildGeminiPrompt(command: string, language?: string): string {
    const languageName = this.getLanguageName(language);
    const isSpanish = language === 'es' || language === 'es-ES';
    
    return `You are an expert ${languageName} language tutor helping users learn practical ${languageName} through a quiz-based learning app.

CONTEXT:
- This is for a ${languageName} learning app that generates interactive quizzes
- The app can handle both English and ${languageName} sentences
- If you provide ${languageName} sentences, the app will use them directly
- If you provide English sentences, the app will translate them to ${languageName}
- Focus on practical, everyday ${languageName} that people actually use
- Provide sentences that are appropriate for the user's request
- ${isSpanish ? 'For Spanish, prefer modern, natural expressions used in daily conversation. Use appropriate regional variations if specified (Spain vs Latin America).' : ''}

USER REQUEST: "${command}"
TARGET LANGUAGE: ${languageName} (${language || 'es-ES'})

INTERPRETATION GUIDELINES:
- Interpret the user's request broadly and contextually
- "phrases to use at dinner" → restaurant/dining ${languageName} phrases
- "travel" → airport, hotel, transportation, directions, etc.
- "business" → meetings, presentations, networking, etc.
- "daily life" → greetings, shopping, family, work, etc.
- "food" → ordering, cooking, dining, ingredients, etc.
- "shopping" → stores, bargaining, sizes, colors, etc.
- "health" → doctor visits, symptoms, pharmacy, etc.
- "emergency" → help, directions, medical, police, etc.
- If the request is vague, provide general useful ${languageName} phrases
- Always assume the user wants ${languageName} learning content

Please provide a JSON response with ${languageName} learning content in this exact format:
{
  "sentences": [
    {
      "english": "English sentence or phrase (optional - only if you want to provide English)",
      "spanish": "${languageName} sentence or phrase (required)",
      "notes": "Brief explanation or usage notes (optional)"
    }
  ],
  "title": "Brief title describing the content",
  "difficulty": "beginner|intermediate|advanced"
}

REQUIREMENTS:
- Provide 3-8 useful sentences/phrases related to the user's request
- You can provide sentences in either English OR ${languageName} (or both)
- If you provide English, the app will translate it to ${languageName}
- If you provide ${languageName} directly, the app will use it as-is
- Focus on practical, everyday ${languageName} that people actually use
- Include accurate translations and helpful notes when relevant
- Match the user's specific request context
- Make sentences natural and conversational, not textbook-like
- ${isSpanish ? 'For Spanish, use natural expressions and avoid overly formal language unless specifically requested.' : ''}

EXAMPLES:
- For "dinner" or "restaurant": ordering food, asking for the menu, paying the bill
- For "travel": airport phrases, hotel check-in, asking directions
- For "business": meetings, phone calls, presentations, networking
- For "daily life": greetings, shopping, transportation, social situations

Respond only with the JSON object, no additional text.`;
  }

  /**
   * Gets the human-readable language name
   */
  private getLanguageName(language?: string): string {
    switch (language) {
      case 'es-ES':
        return 'Spanish (Spain)';
      case 'es':
        return 'Spanish (Latin America)';
      case 'en':
        return 'English';
      case 'fr':
        return 'French';
      case 'de':
        return 'German';
      case 'it':
        return 'Italian';
      case 'pt':
        return 'Portuguese';
      default:
        return 'Spanish';
    }
  }

  /**
   * Calls the Gemini AI API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini AI');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Parses Gemini's JSON response and extracts sentences
   */
  private parseGeminiResponse(response: string): ParsedSentence[] {
    try {
      // Try to find JSON in the response
      const startIdx = response.indexOf('{');
      const endIdx = response.lastIndexOf('}') + 1;
      
      if (startIdx === -1 || endIdx === 0) {
        throw new Error('No JSON found in response');
      }

      const jsonStr = response.slice(startIdx, endIdx);
      const parsed = JSON.parse(jsonStr);

      if (!parsed.sentences || !Array.isArray(parsed.sentences)) {
        throw new Error('Invalid response format: missing sentences array');
      }

      return parsed.sentences.map((sentence: { english?: string; spanish?: string; notes?: string }) => ({
        english: sentence.english || '',
        spanish: sentence.spanish || '',
        notes: sentence.notes || ''
      })).filter((sentence: { english: string; spanish: string; notes?: string }) => sentence.spanish);

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Converts parsed sentences into quiz format
   */
  private createQuizFromSentences(sentences: ParsedSentence[], command: string, language?: string): QuizGenerationResponse {
    const timestamp = Date.now();
    const languageName = this.getLanguageName(language);
    
    const quizSentences = sentences.map((sentence, index) => ({
      id: `sentence_${timestamp}_${index + 1}`,
      spanish: sentence.spanish,
      english: sentence.english || '',
      difficulty: 'beginner' as const,
      topic: 'general'
    }));

    const questions = sentences.slice(0, 3).map((sentence, index) => {
      if (sentence.english) {
        return {
          id: `q_translation_${index + 1}`,
          question: `Translate: ${sentence.english}`,
          correctAnswer: sentence.spanish,
          options: [
            sentence.spanish,
            'Incorrecto',
            'No sé',
            'Tal vez'
          ],
          type: 'translation' as const
        };
      } else {
        return {
          id: `q_comprehension_${index + 1}`,
          question: `What does this ${languageName} phrase mean: "${sentence.spanish}"?`,
          correctAnswer: sentence.notes || 'Practice this phrase',
          options: [
            sentence.notes || 'Practice this phrase',
            'I don\'t know',
            'Maybe',
            'Incorrect'
          ],
          type: 'multiple-choice' as const
        };
      }
    });

    return {
      success: true,
      quiz: {
        id: `quiz_${timestamp}`,
        title: `${languageName} Quiz: ${command}`,
        sentences: quizSentences,
        questions: questions
      }
    };
  }

  /**
   * Main method to generate quiz from user command
   */
  async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    try {
      // Validate input
      const validation = this.validateInput(request.command);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error || 'Invalid input'
        };
      }

      // Build prompt for Gemini
      const prompt = this.buildGeminiPrompt(request.command, request.language);
      
      // Call Gemini API
      const geminiResponse = await this.callGeminiAPI(prompt);
      
      // Parse the response
      const sentences = this.parseGeminiResponse(geminiResponse);
      
      if (sentences.length === 0) {
        return {
          success: false,
          error: 'No usable sentences found in AI response'
        };
      }

      // Create quiz from sentences
      return this.createQuizFromSentences(sentences, request.command, request.language);

    } catch (error) {
      console.error('Gemini service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Singleton instance
let geminiServiceInstance: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }
  return geminiServiceInstance;
}; 