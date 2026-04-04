import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from '../llm/llm-provider.interface';
import { createLlmProvider } from '../llm/llm-provider.factory';

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  mr: 'Marathi',
  gu: 'Gujarati',
  bn: 'Bengali',
  or: 'Odia',
  pa: 'Punjabi',
  as: 'Assamese',
};

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly llm: LlmProvider;

  constructor(private readonly config: ConfigService) {
    const llmConfig = this.config.get('llm');
    this.llm = createLlmProvider(llmConfig);
  }

  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    const sample = text.slice(0, 1500);
    const prompt = `Detect the language of the following text. Respond with a JSON object: {"language": "<ISO 639-1 code>", "confidence": <0.0-1.0>}

Supported language codes: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}

Text:
${sample}`;

    const response = await this.llm.generateCompletion(
      'You are a language detection service. Respond only with JSON.',
      prompt,
    );

    try {
      const parsed = JSON.parse(response);
      return { language: parsed.language ?? 'en', confidence: parsed.confidence ?? 0.5 };
    } catch {
      this.logger.warn('Failed to parse language detection response, defaulting to English');
      return { language: 'en', confidence: 0.5 };
    }
  }

  async translateToEnglish(text: string, sourceLanguage: string): Promise<string> {
    const langName = SUPPORTED_LANGUAGES[sourceLanguage] ?? sourceLanguage;
    this.logger.log(`Translating from ${langName} to English...`);

    const prompt = `Translate the following ${langName} text to English.

IMPORTANT RULES:
- Preserve all legal terms, names, addresses, and numbers exactly as they appear
- Maintain the structure and formatting of the original text
- Keep proper nouns (person names, place names, company names) untranslated
- Preserve all dates, amounts, and reference numbers exactly
- If a word is already in English, keep it as-is

Text to translate:
${text}`;

    return this.llm.generateCompletion(
      'You are a professional legal document translator specialising in Indian languages. Translate accurately, preserving all legal terminology and proper nouns.',
      prompt,
    );
  }
}
