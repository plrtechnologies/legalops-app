import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OcrService } from './ocr/ocr.service';
import { SarvamService } from './sarvam/sarvam.service';
import { Document, DocumentStatus } from '../documents/entities/document.entity';
import { STORAGE_DRIVER } from '../storage/storage.module';
import { StorageDriver } from '../storage/interfaces/storage-driver.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { TranslationService } from '../ai/translation/translation.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Opinion } from '../opinions/entities/opinion.entity';
import { AiService } from '../ai/ai.service';

/** Used when `uploadedById` is missing on the document (audit `userId` is required). */
const PIPELINE_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class DocumentPipelineService {
  private readonly logger = new Logger(DocumentPipelineService.name);
  private readonly ocrThreshold: number;

  constructor(
    private readonly ocr: OcrService,
    private readonly sarvam: SarvamService,
    private readonly config: ConfigService,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
    @InjectRepository(Document) private readonly docRepo: Repository<Document>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(OpinionRequest) private readonly requestRepo: Repository<OpinionRequest>,
    @InjectRepository(Opinion) private readonly opinionRepo: Repository<Opinion>,
    private readonly auditLogs: AuditLogsService,
    private readonly translation: TranslationService,
    private readonly aiService: AiService,
  ) {
    this.ocrThreshold = config.get<number>('sarvam.ocrConfidenceThreshold') ?? 0.7;
  }

  /**
   * Hybrid document processing pipeline:
   * 1. Upload raw file to storage
   * 2. Run multilingual OCR
   * 3a. If OCR confidence >= threshold → Sarvam normalize + extract
   * 3b. If OCR confidence < threshold → Sarvam direct document parse (fallback)
   * 4. Persist extracted data back to document record
   */
  async process(
    doc: Document,
    buffer: Buffer,
    mimeType: string,
  ): Promise<Document> {
    await this.docRepo.update(doc.id, { status: DocumentStatus.PROCESSING });

    try {
      // Step 1: OCR
      const ocrResult = await this.ocr.extract(buffer, mimeType);
      this.logger.log(`OCR confidence: ${ocrResult.confidence} (threshold: ${this.ocrThreshold})`);

      // Step 2: Language detection + translation
      let detectedLanguage = ocrResult.language ?? 'en';
      let originalLanguageText: string | undefined;
      let translatedText: string | undefined;
      let translationStatus = 'NOT_NEEDED';
      let textForExtraction = ocrResult.text;

      if (ocrResult.text.trim().length > 0) {
        try {
          const langResult = await this.translation.detectLanguage(ocrResult.text);
          detectedLanguage = langResult.language;
          this.logger.log(`Detected language: ${detectedLanguage} (confidence: ${langResult.confidence})`);

          if (detectedLanguage !== 'en') {
            translationStatus = 'IN_PROGRESS';
            originalLanguageText = ocrResult.text;
            translatedText = await this.translation.translateToEnglish(ocrResult.text, detectedLanguage);
            translationStatus = 'COMPLETED';
            textForExtraction = translatedText;
            this.logger.log('Translation to English completed');
          }
        } catch (err) {
          this.logger.warn(`Translation failed: ${(err as Error).message}, proceeding with original text`);
          translationStatus = detectedLanguage !== 'en' ? 'FAILED' : 'NOT_NEEDED';
        }
      }

      // Step 3: Sarvam extraction
      let extractedData: Record<string, any>;
      let normalizedText: string | undefined;

      if (ocrResult.confidence >= this.ocrThreshold && textForExtraction.trim().length > 0) {
        this.logger.log('OCR confidence OK – using Sarvam normalization pipeline');
        const sarvamResult = await this.sarvam.normalizeAndExtract(
          textForExtraction,
          detectedLanguage === 'en' ? 'en' : detectedLanguage,
        );
        extractedData = sarvamResult.extractedData;
        normalizedText = sarvamResult.normalizedText;
      } else {
        this.logger.log('OCR confidence low – using Sarvam direct document parse');
        const sarvamResult = await this.sarvam.directDocumentParse(buffer, mimeType);
        extractedData = sarvamResult.extractedData;
        normalizedText = sarvamResult.normalizedText;
      }

      const updated = await this.docRepo.save({
        ...doc,
        status: DocumentStatus.PROCESSED,
        ocrConfidence: ocrResult.confidence,
        rawOcrText: normalizedText ?? textForExtraction,
        language: ocrResult.language,
        detectedLanguage,
        originalLanguageText,
        translatedText,
        translationStatus,
        extractedData,
      });

      this.logger.log(`Document ${doc.id} processed successfully`);
      await this.auditLogs.record({
        tenantId: updated.tenantId,
        entityType: 'document',
        entityId: doc.id,
        action: 'PROCESSED',
        newValues: {
          status: updated.status,
          ocrConfidence: updated.ocrConfidence,
          language: updated.language,
        },
        userId: doc.uploadedById ?? PIPELINE_ACTOR_ID,
      });

      // Check if auto-generate opinion draft is enabled
      await this.tryAutoGenerateOpinion(updated);

      return updated;
    } catch (err) {
      this.logger.error(`Document ${doc.id} processing failed: ${(err as Error).message}`);
      await this.docRepo.update(doc.id, { status: DocumentStatus.FAILED });
      await this.auditLogs.record({
        tenantId: doc.tenantId,
        entityType: 'document',
        entityId: doc.id,
        action: 'PROCESSING_FAILED',
        newValues: { error: (err as Error).message?.slice(0, 500) },
        userId: doc.uploadedById ?? PIPELINE_ACTOR_ID,
      });
      throw err;
    }
  }

  /**
   * If tenant has `auto_generate_opinion_draft` enabled and all documents for the
   * opinion request are PROCESSED, auto-generate a draft on existing DRAFT opinions.
   */
  private async tryAutoGenerateOpinion(doc: Document): Promise<void> {
    try {
      const tenant = await this.tenantRepo.findOne({ where: { id: doc.tenantId } });
      const aiSettings = (tenant?.settings as Record<string, any>)?.ai_settings;
      if (!aiSettings?.auto_generate_opinion_draft) return;

      // Check if all documents for this request are processed
      const allDocs = await this.docRepo.find({
        where: { tenantId: doc.tenantId, opinionRequestId: doc.opinionRequestId },
      });
      const allProcessed = allDocs.every((d) => d.status === DocumentStatus.PROCESSED);
      if (!allProcessed) return;

      // Find DRAFT opinions that haven't been AI-generated yet
      const draftOpinions = await this.opinionRepo.find({
        where: {
          tenantId: doc.tenantId,
          opinionRequestId: doc.opinionRequestId,
          status: 'DRAFT' as any,
          aiGenerated: false,
        },
      });

      for (const opinion of draftOpinions) {
        this.logger.log(`Auto-generating draft for opinion ${opinion.id}`);
        await this.aiService.generateDraftOpinion(doc.tenantId, opinion.id, {
          userId: doc.uploadedById ?? PIPELINE_ACTOR_ID,
        });
      }
    } catch (err) {
      this.logger.warn(`Auto-generation check failed: ${(err as Error).message}`);
    }
  }
}
