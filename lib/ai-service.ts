import { LLMConfig, QuizGenerationRequest, QuizGenerationResponse } from './types';

export class AIService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<QuizGenerationResponse> {
    // This method is now handled directly in the API route
    throw new Error('This method should not be called directly. Use the API route instead.');
  }

  async processNaturalLanguageCommand(command: string): Promise<string> {
    // This method is now handled directly in the API route
    throw new Error('This method should not be called directly. Use the API route instead.');
  }
}

// Default configuration
export const defaultLLMConfig: LLMConfig = {
  modelPath: './models/gemma-3-1b-it-q4_0.gguf',
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