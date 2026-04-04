import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditRecordParams {
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  userId: string;
  userEmail?: string;
  ipAddress?: string;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  async record(p: AuditRecordParams): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          tenantId: p.tenantId,
          entityType: p.entityType,
          entityId: p.entityId,
          action: p.action,
          oldValues: p.oldValues,
          newValues: p.newValues,
          userId: p.userId,
          userEmail: p.userEmail,
          ipAddress: p.ipAddress,
        }),
      );
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  async listForTenant(
    tenantId: string,
    filters: {
      from?: Date;
      to?: Date;
      entityType?: string;
      userId?: string;
      limit: number;
      offset: number;
    },
  ): Promise<{ items: AuditLog[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .orderBy('a.createdAt', 'DESC')
      .take(filters.limit)
      .skip(filters.offset);

    if (filters.from) {
      qb.andWhere('a.createdAt >= :from', { from: filters.from });
    }
    if (filters.to) {
      qb.andWhere('a.createdAt <= :to', { to: filters.to });
    }
    if (filters.entityType) {
      qb.andWhere('a.entityType = :entityType', { entityType: filters.entityType });
    }
    if (filters.userId) {
      qb.andWhere('a.userId = :userId', { userId: filters.userId });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
