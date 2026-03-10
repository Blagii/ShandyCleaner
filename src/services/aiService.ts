import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

export type AIProvider = 'gemini' | 'anthropic';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export class AIService {
  private provider: AIProvider;
  private apiKey: string;
  private model: string;

  constructor(config: AIConfig) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
    if (this.provider === 'gemini') {
      return this.generateGemini(prompt, systemInstruction);
    } else if (this.provider === 'anthropic') {
      return this.generateAnthropic(prompt, systemInstruction);
    }
    throw new Error('Unsupported provider');
  }

  private async generateGemini(prompt: string, systemInstruction?: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemInstruction
    });

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  private async generateAnthropic(prompt: string, systemInstruction?: string): Promise<string> {
    const client = new Anthropic({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });

    try {
      const response = await client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemInstruction,
        messages: [{ role: 'user', content: prompt }]
      });

      if (response.content[0].type === 'text') {
        return response.content[0].text;
      }
      return '';
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw error;
    }
  }
}
