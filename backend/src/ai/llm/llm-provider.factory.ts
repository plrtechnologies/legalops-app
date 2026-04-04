import { LlmProvider } from './llm-provider.interface';
import { OpenAiProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GoogleProvider } from './google.provider';

export function createLlmProvider(config: {
  provider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}): LlmProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAiProvider(config.apiKey, config.model, config.maxTokens, config.temperature);
    case 'anthropic':
      return new AnthropicProvider(config.apiKey, config.model, config.maxTokens, config.temperature);
    case 'google':
      return new GoogleProvider(config.apiKey, config.model, config.maxTokens, config.temperature);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}
