import axios from 'axios';
import { LlmProvider } from './llm-provider.interface';

export class GoogleProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly maxTokens: number,
    private readonly temperature: number,
  ) {}

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
          responseMimeType: 'application/json',
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return response.data.candidates[0].content.parts[0].text;
  }
}
