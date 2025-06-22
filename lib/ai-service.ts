import { LLMConfig, QuizGenerationRequest, QuizGenerationResponse } from './types';

// Note: We'll use a mock implementation for now since node-llama-cpp requires the model file
// In production, you'd download the Gemma-3-1b model and use the actual LLM

export class AIService {
  private config: LLMConfig;
  private isInitialized = false;
  private session: any = null;
  private model: any = null;
  private context: any = null;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      // For now, we'll use the mock implementation while we resolve the LLM API
      // The LLM integration can be enabled later when we have the correct API
      console.log('AI Service initialized (enhanced mock mode)');
      this.isInitialized = true;
      
      // TODO: Enable full LLM when node-llama-cpp API is confirmed
      // const { LlamaModel, LlamaContext, LlamaChatSession } = await import('node-llama-cpp');
      // Initialize LLM components here
      
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      console.log('Falling back to mock mode...');
      this.isInitialized = true; // Still mark as initialized for mock mode
    }
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // For now, use the enhanced mock implementation
      // TODO: Enable LLM when API is confirmed
      return await this.generateQuizWithMock(request);
    } catch (error) {
      console.error('Error generating quiz:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async generateQuizWithLLM(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    const prompt = this.buildQuizPrompt(request.command);
    
    try {
      const response = await this.session.prompt(prompt, {
        temperature: this.config.temperature,
        topP: this.config.topP,
        topK: this.config.topK,
        maxTokens: 2048
      });

      console.log('LLM Response:', response);

      // Try to parse the response as JSON
      try {
        const parsedResponse = JSON.parse(response);
        if (parsedResponse.quiz) {
          return {
            success: true,
            quiz: parsedResponse.quiz
          };
        }
      } catch (parseError) {
        console.log('Failed to parse LLM response as JSON, using fallback');
      }

      // If parsing fails, use the command parsing approach
      const params = this.parseCommand(request.command);
      const quiz = await this.createQuizFromCommand(params);
      
      return {
        success: true,
        quiz
      };
    } catch (error) {
      console.error('LLM generation failed:', error);
      throw error;
    }
  }

  private async generateQuizWithMock(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    // Parse the command to extract parameters
    const params = this.parseCommand(request.command);
    
    // Generate quiz based on the command
    const quiz = await this.createQuizFromCommand(params);
    
    return {
      success: true,
      quiz
    };
  }

  private buildQuizPrompt(command: string): string {
    return `Generate a Spanish language learning quiz based on this command: "${command}"

Please respond with a JSON object in this exact format:
{
  "quiz": {
    "id": "quiz_[timestamp]",
    "title": "Quiz: [topic] ([difficulty])",
    "sentences": [
      {
        "id": "sentence_[timestamp]_[index]",
        "spanish": "[Spanish sentence]",
        "english": "[English translation]",
        "difficulty": "[beginner/intermediate/advanced]",
        "topic": "[topic]"
      }
    ],
    "questions": [
      {
        "id": "q_[type]_[index]",
        "question": "[Question text]",
        "correctAnswer": "[Correct answer]",
        "options": ["[Option 1]", "[Option 2]", "[Option 3]", "[Option 4]"],
        "type": "[translation/fill-blank/multiple-choice]"
      }
    ]
  }
}

Requirements:
- Create 3-8 sentences based on the command
- Include both translation and fill-in-the-blank questions
- Make sure Spanish sentences are grammatically correct
- Provide accurate English translations
- Match the difficulty level mentioned in the command
- Focus on the topics/keywords mentioned in the command

Respond only with the JSON object, no additional text.`;
  }

  private parseCommand(command: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract difficulty
    if (command.includes('beginner')) params.difficulty = 'beginner';
    else if (command.includes('intermediate')) params.difficulty = 'intermediate';
    else if (command.includes('advanced')) params.difficulty = 'advanced';
    else params.difficulty = 'beginner';

    // Extract topics/keywords - improved pattern matching
    const topicMatches = command.match(/[""]([^""]+)[""]/g);
    if (topicMatches) {
      params.topics = topicMatches.map(t => t.replace(/[""]/g, ''));
    } else {
      // Fallback: look for common topics in the command
      const commonTopics = ['love', 'food', 'travel', 'family', 'work', 'home', 'music', 'school', 'friends', 'animals', 'sports', 'weather', 'time', 'numbers', 'colors', 'clothes', 'body', 'house', 'car', 'book', 'movie', 'restaurant', 'hospital', 'store', 'park', 'beach', 'mountain', 'city', 'country'];
      const foundTopics = commonTopics.filter(topic => command.toLowerCase().includes(topic));
      if (foundTopics.length > 0) {
        params.topics = foundTopics;
      } else {
        params.topics = ['general'];
      }
    }

    // Extract sentence count
    const countMatch = command.match(/(\d+)\s*(sentences?|questions?)/i);
    if (countMatch) {
      params.sentenceCount = parseInt(countMatch[1]);
    } else {
      params.sentenceCount = 5;
    }

    console.log('Parsed command params:', params); // Debug log
    return params;
  }

  private async createQuizFromCommand(params: Record<string, any>): Promise<any> {
    // Enhanced mock implementation with more variety
    const topics = params.topics || ['general'];
    const difficulty = params.difficulty || 'beginner';
    const sentenceCount = params.sentenceCount || 5;

    // Generate sentences based on parameters
    const sentences = this.generateMockSentences(topics, difficulty, sentenceCount);
    const questions = this.generateMockQuestions(sentences, difficulty);

    return {
      id: `quiz_${Date.now()}`,
      title: `Quiz: ${topics.join(', ')} (${difficulty})`,
      sentences,
      questions
    };
  }

  private generateMockSentences(topics: string[], difficulty: string, count: number): any[] {
    console.log('Generating sentences with:', { topics, difficulty, count }); // Debug log
    
    const mockSentences = [
      // Beginner sentences
      { spanish: "Me gusta la música", english: "I like music", difficulty: "beginner", topic: "hobbies" },
      { spanish: "¿Cómo estás hoy?", english: "How are you today?", difficulty: "beginner", topic: "greetings" },
      { spanish: "Vivo en una casa grande", english: "I live in a big house", difficulty: "beginner", topic: "home" },
      { spanish: "Te amo con todo mi corazón", english: "I love you with all my heart", difficulty: "beginner", topic: "love" },
      { spanish: "¿Puedes ayudarme con esto?", english: "Can you help me with this?", difficulty: "beginner", topic: "requests" },
      { spanish: "La comida está deliciosa", english: "The food is delicious", difficulty: "beginner", topic: "food" },
      { spanish: "Me gusta viajar", english: "I like to travel", difficulty: "beginner", topic: "travel" },
      { spanish: "Mi familia es muy grande", english: "My family is very big", difficulty: "beginner", topic: "family" },
      
      // Intermediate sentences
      { spanish: "Estudio español todos los días", english: "I study Spanish every day", difficulty: "intermediate", topic: "education" },
      { spanish: "Me encanta viajar por el mundo", english: "I love traveling around the world", difficulty: "intermediate", topic: "travel" },
      { spanish: "La comida mexicana es deliciosa", english: "Mexican food is delicious", difficulty: "intermediate", topic: "food" },
      { spanish: "Trabajo en una oficina moderna", english: "I work in a modern office", difficulty: "intermediate", topic: "work" },
      { spanish: "Mi hermana vive en Madrid", english: "My sister lives in Madrid", difficulty: "intermediate", topic: "family" },
      { spanish: "Necesito aprender más vocabulario", english: "I need to learn more vocabulary", difficulty: "intermediate", topic: "education" },
      
      // Advanced sentences
      { spanish: "Espero que tengas un buen día", english: "I hope you have a good day", difficulty: "advanced", topic: "wishes" },
      { spanish: "Si pudiera, visitaría España", english: "If I could, I would visit Spain", difficulty: "advanced", topic: "conditional" },
      { spanish: "La tecnología ha cambiado nuestras vidas", english: "Technology has changed our lives", difficulty: "advanced", topic: "technology" },
      { spanish: "Me gustaría que pudieras venir a mi fiesta", english: "I would like you to be able to come to my party", difficulty: "advanced", topic: "social" }
    ];

    console.log('Total mock sentences available:', mockSentences.length); // Debug log

    // Filter by topics if specified
    let filtered = mockSentences;
    if (topics.length > 0 && !topics.includes('general')) {
      filtered = mockSentences.filter(s =>
        topics.some(topic =>
          s.topic && (
            topic.toLowerCase().includes(s.topic.toLowerCase()) ||
            s.topic.toLowerCase().includes(topic.toLowerCase())
          )
        )
      );
      console.log('After topic filtering:', filtered.length, 'sentences'); // Debug log
    }

    // Filter by difficulty
    filtered = filtered.filter(s => s.difficulty === difficulty);
    console.log('After difficulty filtering:', filtered.length, 'sentences'); // Debug log

    // Return requested number of sentences
    const result = filtered.slice(0, count).map((s, i) => ({
      ...s,
      id: `sentence_${Date.now()}_${i}`
    }));
    
    console.log('Final result:', result.length, 'sentences'); // Debug log
    return result;
  }

  private generateMockQuestions(sentences: any[], difficulty: string): any[] {
    const questions: any[] = [];
    
    sentences.forEach((sentence, index) => {
      // Translation question
      questions.push({
        id: `q_trans_${index}`,
        question: `Translate to English: "${sentence.spanish}"`,
        correctAnswer: sentence.english,
        options: [
          sentence.english,
          `Wrong answer ${index + 1}`,
          `Wrong answer ${index + 2}`,
          `Wrong answer ${index + 3}`
        ],
        type: 'translation'
      });

      // Fill in the blank question
      const words: string[] = sentence.spanish.split(' ');
      const blankIndex = Math.floor(Math.random() * words.length);
      const blankWord = words[blankIndex];
      const blankSentence = words.map((word: string, i: number) => i === blankIndex ? '_____' : word).join(' ');
      
      questions.push({
        id: `q_fill_${index}`,
        question: `Fill in the blank: "${blankSentence}"`,
        correctAnswer: blankWord,
        options: [
          blankWord,
          `option_${index}_1`,
          `option_${index}_2`,
          `option_${index}_3`
        ],
        type: 'fill-blank'
      });
    });

    return questions;
  }

  async processNaturalLanguageCommand(command: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // For now, use enhanced mock responses
    // TODO: Enable LLM when API is confirmed
    const responses = [
      `I understand you want to: ${command}. I can help you create Spanish learning content!`,
      `Great! I'll help you with: ${command}. Let me generate some Spanish learning materials.`,
      `Perfect! I understand: ${command}. I'm ready to create engaging Spanish content for you.`,
      `Excellent request: ${command}. I'll generate personalized Spanish learning materials.`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return randomResponse;
  }
}

// Default configuration
export const defaultLLMConfig: LLMConfig = {
  modelPath: './models/gemma-3-1b-it-qat-q4_0.gguf',
  contextSize: 4096,
  threads: 4,
  temperature: 0.7,
  topP: 0.9,
  topK: 40
};

// Singleton instance
let aiServiceInstance: AIService | null = null;

export const getAIService = (): AIService => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService(defaultLLMConfig);
  }
  return aiServiceInstance;
}; 