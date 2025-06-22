import { LLMConfig, QuizGenerationRequest, QuizGenerationResponse } from './types';

// Note: We'll use a mock implementation for now since node-llama-cpp requires the model file
// In production, you'd download the Gemma-3-1b model and use the actual LLM

export class AIService {
  private config: LLMConfig;
  private isInitialized = false;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      // In a real implementation, you would initialize the LLM here
      // const { LlamaModel, LlamaContext, LlamaChatSession } = await import('node-llama-cpp');
      // const model = new LlamaModel({ modelPath: this.config.modelPath });
      // const context = new LlamaContext({ model });
      // this.session = new LlamaChatSession({ context });
      
      console.log('AI Service initialized (mock mode)');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw error;
    }
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Parse the command to extract parameters
      const params = this.parseCommand(request.command);
      
      // Generate quiz based on the command
      const quiz = await this.createQuizFromCommand(params);
      
      return {
        success: true,
        quiz
      };
    } catch (error) {
      console.error('Error generating quiz:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private parseCommand(command: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract difficulty
    if (command.includes('beginner')) params.difficulty = 'beginner';
    else if (command.includes('intermediate')) params.difficulty = 'intermediate';
    else if (command.includes('advanced')) params.difficulty = 'advanced';
    else params.difficulty = 'beginner';

    // Extract topics/keywords
    const topicMatches = command.match(/[""]([^""]+)[""]/g);
    if (topicMatches) {
      params.topics = topicMatches.map(t => t.replace(/[""]/g, ''));
    }

    // Extract sentence count
    const countMatch = command.match(/(\d+)\s*(sentences?|questions?)/i);
    if (countMatch) {
      params.sentenceCount = parseInt(countMatch[1]);
    } else {
      params.sentenceCount = 5;
    }

    return params;
  }

  private async createQuizFromCommand(params: Record<string, any>): Promise<any> {
    // Mock implementation - in production, this would use the actual LLM
    const topics = params.topics || ['general'];
    const difficulty = params.difficulty || 'beginner';
    const sentenceCount = params.sentenceCount || 5;

    // Generate mock sentences based on parameters
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
    const mockSentences = [
      { spanish: "Me gusta la música", english: "I like music", difficulty: "beginner", topic: "hobbies" },
      { spanish: "¿Cómo estás hoy?", english: "How are you today?", difficulty: "beginner", topic: "greetings" },
      { spanish: "Vivo en una casa grande", english: "I live in a big house", difficulty: "beginner", topic: "home" },
      { spanish: "Estudio español todos los días", english: "I study Spanish every day", difficulty: "intermediate", topic: "education" },
      { spanish: "Me encanta viajar por el mundo", english: "I love traveling around the world", difficulty: "intermediate", topic: "travel" },
      { spanish: "La comida mexicana es deliciosa", english: "Mexican food is delicious", difficulty: "intermediate", topic: "food" },
      { spanish: "Espero que tengas un buen día", english: "I hope you have a good day", difficulty: "advanced", topic: "wishes" },
      { spanish: "Si pudiera, visitaría España", english: "If I could, I would visit Spain", difficulty: "advanced", topic: "conditional" },
      { spanish: "Te amo con todo mi corazón", english: "I love you with all my heart", difficulty: "beginner", topic: "love" },
      { spanish: "¿Puedes ayudarme con esto?", english: "Can you help me with this?", difficulty: "beginner", topic: "requests" }
    ];

    // Filter by topics if specified
    let filtered = mockSentences;
    if (topics.length > 0 && !topics.includes('general')) {
      filtered = mockSentences.filter(s => topics.some(topic => s.topic?.includes(topic)));
    }

    // Filter by difficulty
    filtered = filtered.filter(s => s.difficulty === difficulty);

    // Return requested number of sentences
    return filtered.slice(0, count).map((s, i) => ({
      ...s,
      id: `sentence_${Date.now()}_${i}`
    }));
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

    // In production, this would use the LLM to understand and process the command
    const response = `I understand you want to: ${command}. This feature is coming soon with the full LLM integration!`;
    return response;
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