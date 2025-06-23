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
  targetLanguage: string;
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
    const isSpanish = language === 'es' || language === 'es-es';
    const isFrench = language === 'fr' || language === 'fr-fr';
    const isGerman = language === 'de' || language === 'de-de';
    const isItalian = language === 'it' || language === 'it-it';
    const isPortuguese = language === 'pt' || language === 'pt-pt';
    
    return `You are an expert ${languageName} language tutor helping users learn practical ${languageName} through a quiz-based learning app.

CONTEXT:
- This is for a ${languageName} learning app that generates interactive quizzes
- The app can handle both English and ${languageName} sentences
- If you provide ${languageName} sentences, the app will use them directly
- If you provide English sentences, the app will translate them to ${languageName}
- Focus on practical, everyday ${languageName} that people actually use
- Provide sentences that are appropriate for the user's request
- ${isSpanish ? 'For Spanish, prefer modern, natural expressions used in daily conversation. Use appropriate regional variations if specified (Spain vs Latin America).' : ''}
- ${isFrench ? 'For French, use natural expressions and appropriate regional variations if specified (France vs Canada).' : ''}
- ${isGerman ? 'For German, use natural expressions and appropriate regional variations if specified (Germany vs Austria).' : ''}
- ${isItalian ? 'For Italian, use natural expressions and modern conversational language.' : ''}
- ${isPortuguese ? 'For Portuguese, use natural expressions and appropriate regional variations if specified (Portugal vs Brazil).' : ''}

USER REQUEST: "${command}"
TARGET LANGUAGE: ${languageName} (${language || 'es-es'})

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
- "love" → romantic expressions, relationships, emotions, etc.
- If the request is vague, provide general useful ${languageName} phrases
- Always assume the user wants ${languageName} learning content

Please provide a JSON response with ${languageName} learning content in this exact format:
{
  "sentences": [
    {
      "english": "English sentence or phrase (optional - only if you want to provide English)",
      "targetLanguage": "${languageName} sentence or phrase (required)",
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
- ${isSpanish ? 'For Spanish, use natural expressions and avoid overly formal language unless specifically requested. Provide notes in Spanish when possible for better learning experience.' : ''}
- ${isFrench ? 'For French, use natural expressions and avoid overly formal language unless specifically requested.' : ''}
- ${isGerman ? 'For German, use natural expressions and avoid overly formal language unless specifically requested.' : ''}
- ${isItalian ? 'For Italian, use natural expressions and avoid overly formal language unless specifically requested.' : ''}
- ${isPortuguese ? 'For Portuguese, use natural expressions and avoid overly formal language unless specifically requested.' : ''}

EXAMPLES:
- For "dinner" or "restaurant": ordering food, asking for the menu, paying the bill
- For "travel": airport phrases, hotel check-in, asking directions
- For "business": meetings, phone calls, presentations, networking
- For "daily life": greetings, shopping, transportation, social situations
- For "love": romantic expressions, dating phrases, relationship vocabulary

${isSpanish ? 'IMPORTANT: When providing notes, try to use Spanish explanations when possible. For example: "Frases útiles para viajar" instead of "Useful travel phrases".' : ''}

Respond only with the JSON object, no additional text.`;
  }

  /**
   * Gets the human-readable language name
   */
  private getLanguageName(language?: string): string {
    switch (language) {
      case 'es-es':
        return 'Spanish (Spain)';
      case 'es':
        return 'Spanish (Latin America)';
      case 'en':
        return 'English';
      case 'fr-fr':
        return 'French (France)';
      case 'fr':
        return 'French (Canada)';
      case 'de-de':
        return 'German (Germany)';
      case 'de':
        return 'German (Austria)';
      case 'it-it':
        return 'Italian (Italy)';
      case 'pt-pt':
        return 'Portuguese (Portugal)';
      case 'pt':
        return 'Portuguese (Brazil)';
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
      const startIdx = response.indexOf('{');
      const endIdx = response.lastIndexOf('}') + 1;
      
      if (startIdx === -1 || endIdx === 0) {
        throw new Error('No JSON object found in the AI response.');
      }

      const jsonStr = response.slice(startIdx, endIdx);
      const parsed = JSON.parse(jsonStr);

      if (!parsed.sentences || !Array.isArray(parsed.sentences)) {
        throw new Error('Invalid response format: "sentences" array is missing.');
      }

      return parsed.sentences
        .map((s: any) => ({
          english: s.english?.trim() || '',
          targetLanguage: s.targetLanguage?.trim() || s.spanish?.trim() || '', // Support both new and old format
          notes: s.notes?.trim() || '',
        }))
        .filter((s: ParsedSentence) => 
          s.targetLanguage && 
          s.targetLanguage.length > 0 &&
          // Only require English if targetLanguage is provided
          (!s.english || s.english.length > 0)
        );

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse AI response: ${message}`);
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
      spanish: sentence.targetLanguage, // Keep field name for compatibility
      english: sentence.english,
      difficulty: 'beginner' as const,
      topic: command || 'general'
    }));

    const questions = quizSentences.slice(0, 5).map((sentence, index) => {
      const questionType = Math.random() > 0.5 ? 'translation' : 'comprehension';
      
      if (questionType === 'translation') {
        return {
          id: `q_translation_${index + 1}`,
          question: `How do you say this in ${languageName}?\n"${sentence.english}"`,
          correctAnswer: sentence.spanish,
          options: this.getLanguageSpecificOptions(language, sentence.spanish),
          type: 'translation' as const,
        };
      } else { // Comprehension
        return {
          id: `q_comprehension_${index + 1}`,
          question: `What does this ${languageName} phrase mean?\n"${sentence.spanish}"`,
          correctAnswer: sentence.english,
          options: this.getLanguageSpecificOptions(language, sentence.english, 'comprehension'),
          type: 'multiple-choice' as const,
        };
      }
    });

    return {
      success: true,
      quiz: {
        id: `quiz_${timestamp}`,
        title: `${languageName} Quiz: ${command}`,
        sentences: quizSentences,
        questions: questions.sort(() => Math.random() - 0.5) // Shuffle questions
      }
    };
  }

  /**
   * Gets language-specific answer options
   */
  private getLanguageSpecificOptions(language?: string, correctAnswer?: string, type: 'translation' | 'comprehension' = 'translation'): string[] {
    const isSpanish = language === 'es' || language === 'es-es';
    const isFrench = language === 'fr' || language === 'fr-fr';
    const isGerman = language === 'de' || language === 'de-de';
    const isItalian = language === 'it' || language === 'it-it';
    const isPortuguese = language === 'pt' || language === 'pt-pt';
    
    let options: string[] = [];

    if (isSpanish) {
      options = [
        correctAnswer || (type === 'translation' ? 'Práctica esta frase' : 'Practice this phrase'),
        type === 'translation' ? 'Incorrecto' : 'Wrong',
        type === 'translation' ? 'No sé' : 'I do not know',
        type === 'translation' ? 'Tal vez' : 'Maybe'
      ];
    } else if (isFrench) {
      options = [
        correctAnswer || (type === 'translation' ? 'Pratiquez cette phrase' : 'Practice this phrase'),
        type === 'translation' ? 'Incorrect' : 'Wrong',
        type === 'translation' ? 'Je ne sais pas' : 'I do not know',
        type === 'translation' ? 'Peut-être' : 'Maybe'
      ];
    } else if (isGerman) {
      options = [
        correctAnswer || (type === 'translation' ? 'Üben Sie diesen Satz' : 'Practice this phrase'),
        type === 'translation' ? 'Falsch' : 'Wrong',
        type === 'translation' ? 'Ich weiß nicht' : 'I do not know',
        type === 'translation' ? 'Vielleicht' : 'Maybe'
      ];
    } else if (isItalian) {
      options = [
        correctAnswer || (type === 'translation' ? 'Pratica questa frase' : 'Practice this phrase'),
        type === 'translation' ? 'Sbagliato' : 'Wrong',
        type === 'translation' ? 'Non lo so' : 'I do not know',
        type === 'translation' ? 'Forse' : 'Maybe'
      ];
    } else if (isPortuguese) {
      options = [
        correctAnswer || (type === 'translation' ? 'Pratique esta frase' : 'Practice this phrase'),
        type === 'translation' ? 'Incorreto' : 'Wrong',
        type === 'translation' ? 'Não sei' : 'I do not know',
        type === 'translation' ? 'Talvez' : 'Maybe'
      ];
    } else { // Default to English
      options = [
        correctAnswer || 'Practice this phrase',
        'Incorrect',
        'I don\'t know',
        'Maybe'
      ];
    }
    return options.sort(() => Math.random() - 0.5); // Shuffle options
  }

  /**
   * Gets default correct answer based on language
   */
  private getDefaultCorrectAnswer(language?: string): string {
    return this.getLanguageName(language).includes('Spanish') 
      ? 'Práctica esta frase' 
      : 'Practice this phrase';
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