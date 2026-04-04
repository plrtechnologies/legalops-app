import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SarvamExtractionResult {
  extractedData: Record<string, any>;
  normalizedText?: string;
  language?: string;
  confidence?: number;
}

@Injectable()
export class SarvamService {
  private readonly logger = new Logger(SarvamService.name);
  private readonly http: AxiosInstance;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('sarvam.apiKey') ?? '';
    this.http = axios.create({
      baseURL: config.get<string>('sarvam.baseUrl'),
      headers: {
        'api-subscription-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 60_000,
    });
  }

  /**
   * Normalize OCR text using Sarvam AI (post-OCR pipeline).
   * Corrects regional language OCR errors and extracts structured fields.
   */
  async normalizeAndExtract(rawOcrText: string, language?: string): Promise<SarvamExtractionResult> {
    this.logger.log(`Sarvam normalizeAndExtract – language: ${language ?? 'auto'}`);
    const response = await this.http.post('/v1/text-analytics/extract', {
      text: rawOcrText,
      language: language ?? 'auto',
      document_type: 'legal',
    });
    return response.data as SarvamExtractionResult;
  }

  /**
   * Direct document parse via Sarvam (no prior OCR – fallback for low-confidence scans).
   * Uses Sarvam's native document understanding for regional languages.
   */
  async directDocumentParse(
    buffer: Buffer,
    mimeType: string,
  ): Promise<SarvamExtractionResult> {
    this.logger.log(`Sarvam directDocumentParse – mimeType: ${mimeType}`);
    const base64 = buffer.toString('base64');
    const response = await this.http.post('/v1/document-intelligence/parse', {
      document: base64,
      mime_type: mimeType,
      domain: 'legal',
    });
    return response.data as SarvamExtractionResult;
  }
}
