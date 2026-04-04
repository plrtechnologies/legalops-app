import axios from 'axios';
import { LlmProvider } from './llm-provider.interface';

export class OpenAiProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly maxTokens: number,
    private readonly temperature: number,
  ) {}

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' },
      },
      { headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' } },
    );
    return response.data.choices[0].message.content;
  }
}
