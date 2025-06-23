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

console.log('DEBUG: GOOGLE_GEMINI_API_KEY at server start:', process.env.GOOGLE_GEMINI_API_KEY);

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';

  constructor() {
    console.log('🔍 GeminiService Constructor - process.env.GOOGLE_GEMINI_API_KEY:', process.env.GOOGLE_GEMINI_API_KEY);
    console.log('🔍 GeminiService Constructor - typeof process.env.GOOGLE_GEMINI_API_KEY:', typeof process.env.GOOGLE_GEMINI_API_KEY);
    console.log('🔍 GeminiService Constructor - process.env keys containing GOOGLE:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
    
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.error('❌ GeminiService Constructor - Environment variable is missing or empty');
      console.error('❌ Available environment variables:', Object.keys(process.env));
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }
    console.log('✅ GeminiService Constructor - API key loaded successfully');
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
    const isJapanese = language === 'ja-jp';
    const isChinese = language === 'zh-cn';
    
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
- ${isJapanese ? 'For Japanese, use natural expressions with appropriate politeness levels (casual, polite, formal). Include romaji pronunciation in notes for difficult words.' : ''}
- ${isChinese ? 'For Chinese, use natural expressions with appropriate formality levels. Include pinyin pronunciation in notes for difficult words.' : ''}

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
      "english": "English sentence or phrase (REQUIRED - always provide English)",
      "targetLanguage": "${languageName} sentence or phrase (required)",
      "notes": "Brief explanation or usage notes (optional)"
    }
  ],
  "title": "Brief title describing the content",
  "difficulty": "beginner|intermediate|advanced"
}

REQUIREMENTS:
- Provide 3-8 useful sentences/phrases related to the user's request
- ALWAYS provide BOTH English AND ${languageName} sentences for each entry
- The English sentence is REQUIRED for each ${languageName} sentence
- Focus on practical, everyday ${languageName} that people actually use
- Include accurate translations and helpful notes when relevant
- Match the user's specific request context
- Make sentences natural and conversational, not textbook-like
- ${isSpanish ? 'For Spanish, use natural expressions and avoid overly formal language unless specifically requested. Provide notes in Spanish when possible for better learning experience.' : ''}
- ${isFrench ? 'For French, use natural expressions and avoid overly formal language unless specifically requested.' : ''}
- ${isGerman ? 'For German, use natural expressions and avoid overly formal language unless specifically requested.' : ''}
- ${isItalian ? 'For Italian, use natural expressions and avoid overly formal language unless specifically requested.' : ''}
- ${isPortuguese ? 'For Portuguese, use natural expressions and avoid overly formal language unless specifically requested.' : ''}
- ${isJapanese ? 'For Japanese, use natural expressions with appropriate politeness levels (casual, polite, formal). Include romaji pronunciation in notes for difficult words.' : ''}
- ${isChinese ? 'For Chinese, use natural expressions with appropriate formality levels. Include pinyin pronunciation in notes for difficult words.' : ''}

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
      case 'ja-jp':
        return 'Japanese';
      case 'zh-cn':
        return 'Chinese';
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
        .map((s: any) => {
          const targetLanguage = s.targetLanguage?.trim() || s.spanish?.trim() || '';
          const english = s.english?.trim() || '';
          
          // If English is missing, create a placeholder
          let finalEnglish = english;
          if (!finalEnglish && targetLanguage) {
            // Create a simple English placeholder based on the target language
            finalEnglish = `Practice this ${targetLanguage} phrase`;
          }
          
          return {
            english: finalEnglish,
            targetLanguage: targetLanguage,
            notes: s.notes?.trim() || '',
          };
        })
        .filter((s: ParsedSentence) => 
          s.targetLanguage && 
          s.targetLanguage.length > 0 &&
          s.english && 
          s.english.length > 0
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
    // Use Japanese-specific quiz generation for Japanese
    if (language === 'ja-jp') {
      return this.createJapaneseQuizFromSentences(sentences, command);
    }
    
    // Use Chinese-specific quiz generation for Chinese
    if (language === 'zh-cn') {
      return this.createChineseQuizFromSentences(sentences, command);
    }
    
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
    const isJapanese = language === 'ja-jp';
    const isChinese = language === 'zh-cn';
    
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
    } else if (isJapanese) {
      options = [
        correctAnswer || (type === 'translation' ? 'このフレーズを練習する' : 'Practice this phrase'),
        type === 'translation' ? '間違い' : 'Wrong',
        type === 'translation' ? '分からない' : 'I do not know',
        type === 'translation' ? 'たぶん' : 'Maybe'
      ];
    } else if (isChinese) {
      options = [
        correctAnswer || (type === 'translation' ? '练习这个短语' : 'Practice this phrase'),
        type === 'translation' ? '错误' : 'Wrong',
        type === 'translation' ? '我不知道' : 'I do not know',
        type === 'translation' ? '也许' : 'Maybe'
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

  /**
   * Japanese-specific quiz generation with proper word chunking and writing system options
   */
  private createJapaneseQuizFromSentences(sentences: ParsedSentence[], command: string): QuizGenerationResponse {
    const timestamp = Date.now();
    
    // Randomly choose between native script mode and romaji mode
    const useRomajiMode = Math.random() > 0.5;
    
    const quizSentences = sentences.map((sentence, index) => ({
      id: `sentence_${timestamp}_${index + 1}`,
      spanish: sentence.targetLanguage, // Keep field name for compatibility
      english: sentence.english,
      difficulty: 'beginner' as const,
      topic: command || 'general'
    }));

    const questions = quizSentences.slice(0, 5).map((sentence, index) => {
      const questionType = Math.random() > 0.5 ? 'translation' : 'comprehension';
      
      // Process the Japanese text based on quiz mode
      const processedJapaneseText = useRomajiMode 
        ? this.extractRomajiFromJapanese(sentence.spanish)
        : this.extractNativeScriptFromJapanese(sentence.spanish);
      
      if (questionType === 'translation') {
        return {
          id: `q_translation_${index + 1}`,
          question: `How do you say this in Japanese?${useRomajiMode ? ' (Romaji)' : ' (Native Script)'}\n"${sentence.english}"`,
          correctAnswer: processedJapaneseText,
          options: this.getJapaneseSpecificOptions(processedJapaneseText, 'translation', useRomajiMode),
          type: 'translation' as const,
        };
      } else { // Comprehension
        return {
          id: `q_comprehension_${index + 1}`,
          question: `What does this Japanese phrase mean?${useRomajiMode ? ' (Romaji)' : ' (Native Script)'}\n"${processedJapaneseText}"`,
          correctAnswer: sentence.english,
          options: this.getJapaneseSpecificOptions(sentence.english, 'comprehension', useRomajiMode),
          type: 'multiple-choice' as const,
        };
      }
    });

    return {
      success: true,
      quiz: {
        id: `quiz_${timestamp}`,
        title: `Japanese Quiz: ${command}${useRomajiMode ? ' (Romaji Mode)' : ' (Native Script Mode)'}`,
        sentences: quizSentences,
        questions: questions.sort(() => Math.random() - 0.5) // Shuffle questions
      }
    };
  }

  /**
   * Extracts romaji from Japanese text (removes native script)
   */
  private extractRomajiFromJapanese(text: string): string {
    // Extract romaji from parentheses
    const romajiMatches = text.match(/\(([^)]+)\)/g);
    if (romajiMatches && romajiMatches.length > 0) {
      // Join all romaji parts and clean up
      return romajiMatches
        .map(match => match.replace(/[()]/g, ''))
        .join(' ')
        .trim();
    }
    
    // If no romaji in parentheses, try to extract any romaji-like text
    const romajiPattern = /[a-zA-Z\s]+/g;
    const romajiParts = text.match(romajiPattern);
    if (romajiParts) {
      return romajiParts.join(' ').trim();
    }
    
    // Fallback: return original text if no romaji found
    return text;
  }

  /**
   * Extracts native script from Japanese text (removes romaji)
   */
  private extractNativeScriptFromJapanese(text: string): string {
    // Remove romaji in parentheses and any standalone romaji
    return text
      .replace(/\([^)]*\)/g, '') // Remove parentheses and content
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Japanese-specific answer options with proper writing system handling
   */
  private getJapaneseSpecificOptions(correctAnswer?: string, type: 'translation' | 'comprehension' = 'translation', useRomajiMode: boolean = false): string[] {
    const options: string[] = [];
    
    // Add the correct answer
    options.push(correctAnswer || (useRomajiMode ? 'kono furēzu o renshū suru' : 'このフレーズを練習する'));
    
    // Add Japanese-specific distractors based on mode
    if (type === 'translation') {
      if (useRomajiMode) {
        // Romaji mode distractors
        options.push(
          'machigai',
          'wakaranai', 
          'tabun'
        );
      } else {
        // Native script mode distractors
        options.push(
          '間違い',
          '分からない', 
          'たぶん'
        );
      }
    } else {
      // Comprehension mode - always use English
      options.push(
        'Wrong',
        'I do not know',
        'Maybe'
      );
    }
    
    return options.sort(() => Math.random() - 0.5); // Shuffle options
  }

  /**
   * Japanese word chunking - splits Japanese text into meaningful chunks
   * Handles mixed hiragana/katakana/kanji text
   */
  private chunkJapaneseText(text: string, useRomajiMode: boolean = false): string[] {
    if (useRomajiMode) {
      // For romaji mode, extract and chunk romaji
      const romajiText = this.extractRomajiFromJapanese(text);
      return romajiText.split(/\s+/).filter(word => word.length > 0);
    }
    
    // Remove romaji in parentheses and clean the text
    const cleanText = text.replace(/\([^)]*\)/g, '').trim();
    
    // Split by common Japanese particles and conjunctions
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      currentChunk += char;
      
      // Split after particles, conjunctions, or punctuation
      const shouldSplit = 
        // Common particles
        ['は', 'が', 'を', 'に', 'で', 'から', 'まで', 'の', 'と', 'や', 'も', 'か', 'ね', 'よ', 'な'].includes(char) ||
        // Punctuation
        ['。', '、', '！', '？', '：', '；'].includes(char) ||
        // Conjunctions
        ['そして', 'しかし', 'でも', 'でも', 'また', 'または'].some(conj => 
          cleanText.substring(i - conj.length + 1, i + 1) === conj
        );
      
      if (shouldSplit && currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
    }
    
    // Add remaining chunk if any
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    // Filter out empty chunks and very short ones (less than 2 characters)
    return chunks.filter(chunk => chunk.length >= 2);
  }

  /**
   * Creates Japanese word audio chunks for quiz interface
   */
  private createJapaneseWordChunks(japaneseText: string, useRomajiMode: boolean = false): string[] {
    const chunks = this.chunkJapaneseText(japaneseText, useRomajiMode);
    
    // If we have too few chunks, try splitting by character type boundaries
    if (chunks.length < 2 && !useRomajiMode) {
      return this.splitByCharacterType(japaneseText);
    }
    
    return chunks;
  }

  /**
   * Splits Japanese text by character type boundaries (hiragana/katakana/kanji)
   */
  private splitByCharacterType(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    let currentType = this.getCharacterType(text[0] || '');
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charType = this.getCharacterType(char);
      
      // If character type changes and we have a chunk, split
      if (charType !== currentType && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
        currentType = charType;
      }
      
      currentChunk += char;
    }
    
    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Determines the type of Japanese character
   */
  private getCharacterType(char: string): 'hiragana' | 'katakana' | 'kanji' | 'romaji' | 'other' {
    const hiraganaRange = /[\u3040-\u309F]/;
    const katakanaRange = /[\u30A0-\u30FF]/;
    const kanjiRange = /[\u4E00-\u9FAF]/;
    const romajiRange = /[a-zA-Z]/;
    
    if (hiraganaRange.test(char)) return 'hiragana';
    if (katakanaRange.test(char)) return 'katakana';
    if (kanjiRange.test(char)) return 'kanji';
    if (romajiRange.test(char)) return 'romaji';
    return 'other';
  }

  /**
   * Chinese-specific quiz generation with proper character handling and pinyin options
   */
  private createChineseQuizFromSentences(sentences: ParsedSentence[], command: string): QuizGenerationResponse {
    const timestamp = Date.now();
    
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
          question: `How do you say this in Chinese?\n"${sentence.english}"`,
          correctAnswer: sentence.spanish,
          options: this.getChineseSpecificOptions(sentence.spanish),
          type: 'translation' as const,
        };
      } else { // Comprehension
        return {
          id: `q_comprehension_${index + 1}`,
          question: `What does this Chinese phrase mean?\n"${sentence.spanish}"`,
          correctAnswer: sentence.english,
          options: this.getChineseSpecificOptions(sentence.english),
          type: 'multiple-choice' as const,
        };
      }
    });

    return {
      success: true,
      quiz: {
        id: `quiz_${timestamp}`,
        title: `Chinese Quiz: ${command}`,
        sentences: quizSentences,
        questions: questions.sort(() => Math.random() - 0.5) // Shuffle questions
      }
    };
  }

  /**
   * Gets Chinese-specific answer options
   */
  private getChineseSpecificOptions(correctAnswer?: string): string[] {
    const options: string[] = [];
    
    // Add the correct answer
    options.push(correctAnswer || 'Practice this phrase');
    
    // Add Chinese-specific distractors
    options.push(
      'Wrong',
      'I do not know',
      'Maybe'
    );
    
    return options.sort(() => Math.random() - 0.5); // Shuffle options
  }
}

let geminiServiceInstance: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }
  return geminiServiceInstance;
};