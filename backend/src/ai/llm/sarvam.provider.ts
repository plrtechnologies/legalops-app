import axios from 'axios';
import { LlmProvider } from './llm-provider.interface';

export class SarvamProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly maxTokens: number,
    private readonly temperature: number,
  ) {}

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.sarvam.ai/v1/chat/completions',
      {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data.choices[0].message.content;
  }
}
