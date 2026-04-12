import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OpinionRequest,
  OpinionRequestStatus,
  OpinionRequestPriority,
} from './entities/opinion-request.entity';
import { EndCustomer } from '../end-customers/entities/end-customer.entity';
import { BankClient } from '../bank-clients/entities/bank-client.entity';
import { OpinionTemplate } from '../opinion-templates/entities/opinion-template.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { IsNotEmpty, IsOptional, IsString, IsDateString, IsEnum, IsObject } from 'class-validator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuditContext } from '../audit-logs/audit-context';

export class CreateOpinionRequestDto {
  @IsNotEmpty() @IsString() bankClientId: string;
  @IsNotEmpty() @IsString() endCustomerId: string;
  @IsNotEmpty() @IsString() referenceNumber: string;
  @IsNotEmpty() @IsString() loanType: string;
  @IsOptional() @IsString() loanAmount?: string;
  @IsOptional() @IsString() propertyLocation?: string;
  @IsOptional() @IsString() branchCode?: string;
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(OpinionRequestPriority, { message: 'Invalid priority' }) priority?: OpinionRequestPriority;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

@Injectable()
export class OpinionRequestsService {
  constructor(
    @InjectRepository(OpinionRequest) private readonly repo: Repository<OpinionRequest>,
    @InjectRepository(EndCustomer) private readonly endRepo: Repository<EndCustomer>,
    @InjectRepository(BankClient) private readonly bankRepo: Repository<BankClient>,
    @InjectRepository(OpinionTemplate) private readonly templateRepo: Repository<OpinionTemplate>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(
    tenantId: string,
    createdById: string,
    dto: CreateOpinionRequestDto,
    audit: AuditContext,
  ): Promise<OpinionRequest> {
    const bank = await this.bankRepo.findOne({ where: { id: dto.bankClientId, tenantId } });
    if (!bank) throw new BadRequestException('Bank client not found');

    const end = await this.endRepo.findOne({ where: { id: dto.endCustomerId, tenantId } });
    if (!end) throw new BadRequestException('End customer not found');
    if (end.bankClientId !== dto.bankClientId) {
      throw new BadRequestException('End customer does not belong to the selected bank client');
    }

    if (dto.templateId) {
      const tpl = await this.templateRepo.findOne({
        where: { id: dto.templateId, tenantId, bankClientId: dto.bankClientId },
      });
      if (!tpl) throw new BadRequestException('Template not found for this bank client');
    }

    const dup = await this.repo.findOne({ where: { tenantId, referenceNumber: dto.referenceNumber } });
    if (dup) throw new ConflictException('Reference number already exists for this tenant');

    const saved = await this.repo.save(
      this.repo.create({
        tenantId,
        createdById,
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: OpinionRequestStatus.DRAFT,
      }),
    );

    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion_request',
      entityId: saved.id,
      action: 'CREATED',
      newValues: {
        referenceNumber: dto.referenceNumber,
        status: saved.status,
        bankClientId: dto.bankClientId,
        endCustomerId: dto.endCustomerId,
        loanType: dto.loanType,
      },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });

    return saved;
  }

  findAll(tenantId: string): Promise<OpinionRequest[]> {
    return this.repo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      relations: ['bankClient', 'endCustomer', 'assignedLawyer', 'createdBy'],
    });
  }

  async findOne(tenantId: string, id: string): Promise<OpinionRequest> {
    const r = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['bankClient', 'endCustomer', 'template', 'documents', 'opinions', 'assignedLawyer', 'createdBy'],
    });
    if (!r) throw new NotFoundException('Opinion request not found');
    return r;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: OpinionRequestStatus,
    audit: AuditContext,
  ): Promise<OpinionRequest> {
    const r = await this.findOne(tenantId, id);
    const previous = r.status;
    r.status = status;
    const saved = await this.repo.save(r);

    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion_request',
      entityId: id,
      action: 'STATUS_CHANGED',
      oldValues: { status: previous },
      newValues: { status },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });

    return saved;
  }

  async assign(tenantId: string, id: string, lawyerId: string, audit: AuditContext): Promise<OpinionRequest> {
    const r = await this.findOne(tenantId, id);
    const assignee = await this.userRepo.findOne({ where: { id: lawyerId, tenantId, isActive: true } });
    if (!assignee) {
      throw new BadRequestException('Assigned lawyer not found for this tenant');
    }

    const allowedAssigneeRoles = [UserRole.SENIOR_ADVOCATE, UserRole.PANEL_ADVOCATE];
    if (!allowedAssigneeRoles.includes(assignee.role)) {
      throw new BadRequestException('Assigned user must be a senior advocate or panel advocate');
    }

    const previous = r.assignedLawyerId;
    r.assignedLawyerId = lawyerId;
    const saved = await this.repo.save(r);

    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion_request',
      entityId: id,
      action: 'ASSIGNED',
      oldValues: { assignedLawyerId: previous ?? null },
      newValues: { assignedLawyerId: lawyerId },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });

    return saved;
  }

  async remove(tenantId: string, id: string, audit: AuditContext): Promise<void> {
    const r = await this.findOne(tenantId, id);
    await this.auditLogs.record({
      tenantId,
      entityType: 'opinion_request',
      entityId: id,
      action: 'DELETED',
      oldValues: { referenceNumber: r.referenceNumber, status: r.status },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });
    await this.repo.remove(r);
  }
}
