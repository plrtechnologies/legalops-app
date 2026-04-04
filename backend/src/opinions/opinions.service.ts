import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opinion, OpinionStatus } from './entities/opinion.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { IsOptional, IsString } from 'class-validator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuditContext } from '../audit-logs/audit-context';

export class CreateOpinionDto {
  @IsOptional() @IsString() summaryFindings?: string;
  @IsOptional() @IsString() titleChainAnalysis?: string;
  @IsOptional() @IsString() encumbranceAnalysis?: string;
  @IsOptional() @IsString() riskObservations?: string;
  @IsOptional() @IsString() finalOpinion?: string;
}

export class AddReviewCommentDto {
  @IsString() comment: string;
}

@Injectable()
export class OpinionsService {
  constructor(
    @InjectRepository(Opinion) private readonly repo: Repository<Opinion>,
    @InjectRepository(OpinionRequest) private readonly opinionRequestRepo: Repository<OpinionRequest>,
    private readonly auditLogs: AuditLogsService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async createDraft(
    tenantId: string,
    opinionRequestId: string,
    draftedById: string,
    dto: CreateOpinionDto,
    audit: AuditContext,
  ): Promise<Opinion> {
    const req = await this.opinionRequestRepo.findOne({ where: { id: opinionRequestId, tenantId } });
    if (!req) throw new NotFoundException('Opinion request not found');
    const saved = await this.repo.save(
      this.repo.create({ tenantId, opinionRequestId, draftedById, ...dto }),
    );
    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion',
      entityId: saved.id,
      action: 'CREATED',
      newValues: { opinionRequestId, version: saved.version, status: saved.status },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });
    return saved;
  }

  async findByOpinionRequestId(tenantId: string, opinionRequestId: string): Promise<Opinion[]> {
    const req = await this.opinionRequestRepo.findOne({ where: { id: opinionRequestId, tenantId } });
    if (!req) throw new NotFoundException('Opinion request not found');
    return this.repo.find({
      where: { tenantId, opinionRequestId },
      order: { version: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Opinion> {
    const o = await this.repo.findOne({ where: { id, tenantId } });
    if (!o) throw new NotFoundException('Opinion not found');
    return o;
  }

  async update(tenantId: string, id: string, dto: CreateOpinionDto, audit: AuditContext): Promise<Opinion> {
    const o = await this.findOne(tenantId, id);
    if (o.status === OpinionStatus.ISSUED) throw new BadRequestException('Cannot edit issued opinion');
    const fields = (Object.keys(dto) as (keyof CreateOpinionDto)[]).filter((k) => dto[k] !== undefined);
    Object.assign(o, dto);
    const saved = await this.repo.save(o);
    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion',
      entityId: id,
      action: 'UPDATED',
      newValues: { fields },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });
    return saved;
  }

  async submitForReview(tenantId: string, id: string, audit: AuditContext): Promise<Opinion> {
    const o = await this.findOne(tenantId, id);
    const previous = o.status;
    o.status = OpinionStatus.SUBMITTED_FOR_REVIEW;
    const saved = await this.repo.save(o);
    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion',
      entityId: id,
      action: 'SUBMITTED_FOR_REVIEW',
      oldValues: { status: previous },
      newValues: { status: saved.status },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });
    return saved;
  }

  async approve(tenantId: string, id: string, reviewerId: string, audit: AuditContext): Promise<Opinion> {
    const o = await this.findOne(tenantId, id);
    const previousStatus = o.status;
    const previousReviewerId = o.reviewedById;
    o.status = OpinionStatus.APPROVED;
    o.reviewedById = reviewerId;
    const saved = await this.repo.save(o);
    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion',
      entityId: id,
      action: 'APPROVED',
      oldValues: { status: previousStatus, reviewedById: previousReviewerId ?? null },
      newValues: { status: saved.status, reviewedById: reviewerId },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });
    return saved;
  }

  async issue(tenantId: string, id: string, audit: AuditContext): Promise<Opinion> {
    const o = await this.findOne(tenantId, id);
    if (o.status !== OpinionStatus.APPROVED) throw new BadRequestException('Opinion must be approved before issuing');
    const previousStatus = o.status;
    o.status = OpinionStatus.ISSUED;
    o.issuedAt = new Date();
    const saved = await this.repo.save(o);
    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion',
      entityId: id,
      action: 'ISSUED',
      oldValues: { status: previousStatus },
      newValues: { status: saved.status, issuedAt: saved.issuedAt?.toISOString() },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });

    // Trigger notifications (fire-and-forget)
    this.notifications?.onOpinionIssued(saved).catch(() => {});

    return saved;
  }

  async addComment(
    tenantId: string,
    id: string,
    userId: string,
    dto: AddReviewCommentDto,
    audit: AuditContext,
  ): Promise<Opinion> {
    const o = await this.findOne(tenantId, id);
    const previousStatus = o.status;
    const comments = o.reviewComments ?? [];
    comments.push({ userId, comment: dto.comment, createdAt: new Date().toISOString() });
    o.reviewComments = comments;
    o.status = OpinionStatus.CHANGES_REQUESTED;
    const saved = await this.repo.save(o);
    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion',
      entityId: id,
      action: 'REVIEW_COMMENT_ADDED',
      oldValues: { status: previousStatus },
      newValues: { status: saved.status, commentPreview: dto.comment.slice(0, 200) },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });
    return saved;
  }
}
