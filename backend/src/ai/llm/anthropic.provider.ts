import axios from 'axios';
import { LlmProvider } from './llm-provider.interface';

export class AnthropicProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly maxTokens: number,
    private readonly temperature: number,
  ) {}

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data.content[0].text;
  }
}
