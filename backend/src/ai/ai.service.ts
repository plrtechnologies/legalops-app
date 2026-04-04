import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Opinion, OpinionStatus } from '../opinions/entities/opinion.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Document, DocumentStatus } from '../documents/entities/document.entity';
import { OpinionTemplate } from '../opinion-templates/entities/opinion-template.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuditContext } from '../audit-logs/audit-context';
import { LlmProvider } from './llm/llm-provider.interface';
import { createLlmProvider } from './llm/llm-provider.factory';
import { OPINION_SYSTEM_PROMPT, buildUserPrompt } from './prompts/opinion-generation.prompt';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly llm: LlmProvider;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Opinion) private readonly opinionRepo: Repository<Opinion>,
    @InjectRepository(OpinionRequest) private readonly requestRepo: Repository<OpinionRequest>,
    @InjectRepository(Document) private readonly documentRepo: Repository<Document>,
    @InjectRepository(OpinionTemplate) private readonly templateRepo: Repository<OpinionTemplate>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    private readonly auditLogs: AuditLogsService,
  ) {
    const llmConfig = this.config.get('llm');
    this.llm = createLlmProvider(llmConfig);
  }

  async generateDraftOpinion(
    tenantId: string,
    opinionId: string,
    audit: AuditContext,
  ): Promise<Opinion> {
    // Read tenant AI settings
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    const aiSettings = (tenant?.settings as Record<string, any>)?.ai_settings ?? {};
    const requireReview = aiSettings.require_lawyer_review ?? true;

    const opinion = await this.opinionRepo.findOne({ where: { id: opinionId, tenantId } });
    if (!opinion) throw new NotFoundException('Opinion not found');
    if (opinion.status !== OpinionStatus.DRAFT) {
      throw new BadRequestException('Can only generate draft for opinions in DRAFT status');
    }

    const request = await this.requestRepo.findOne({
      where: { id: opinion.opinionRequestId, tenantId },
      relations: ['bankClient', 'endCustomer'],
    });
    if (!request) throw new NotFoundException('Opinion request not found');

    const documents = await this.documentRepo.find({
      where: { tenantId, opinionRequestId: request.id, status: DocumentStatus.PROCESSED },
    });

    let templateContent: Record<string, unknown> | undefined;
    if (request.templateId) {
      const template = await this.templateRepo.findOne({
        where: { id: request.templateId, tenantId },
      });
      templateContent = template?.templateContent;
    }

    const userPrompt = buildUserPrompt({
      loanType: request.loanType,
      loanAmount: request.loanAmount ? Number(request.loanAmount) : undefined,
      propertyLocation: request.propertyLocation ?? undefined,
      bankClientName: request.bankClient?.name ?? 'Unknown',
      endCustomerName: request.endCustomer?.name,
      templateContent,
      documents: documents.map((d) => ({
        documentType: d.documentType,
        extractedData: d.extractedData,
        rawOcrText: d.translatedText || d.rawOcrText || undefined,
      })),
    });

    this.logger.log(`Generating draft opinion for opinion ${opinionId} via LLM...`);

    const rawResponse = await this.llm.generateCompletion(OPINION_SYSTEM_PROMPT, userPrompt);

    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      this.logger.warn('LLM response was not valid JSON, storing as raw text');
      parsed = { finalOpinion: rawResponse };
    }

    opinion.summaryFindings = parsed.summaryFindings ?? opinion.summaryFindings;
    opinion.titleChainAnalysis = parsed.titleChainAnalysis ?? opinion.titleChainAnalysis;
    opinion.encumbranceAnalysis = parsed.encumbranceAnalysis ?? opinion.encumbranceAnalysis;
    opinion.riskObservations = parsed.riskObservations ?? opinion.riskObservations;
    opinion.finalOpinion = parsed.finalOpinion ?? opinion.finalOpinion;
    opinion.recommendation = parsed.recommendation ?? null;
    opinion.conditions = parsed.conditions ?? null;
    opinion.aiGenerated = true;
    opinion.aiDraftContent = parsed;

    const saved = await this.opinionRepo.save(opinion);

    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion',
      entityId: opinionId,
      action: 'AI_DRAFT_GENERATED',
      newValues: { recommendation: saved.recommendation, aiGenerated: true },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });

    this.logger.log(`AI draft generated for opinion ${opinionId}`);
    return saved;
  }
}
