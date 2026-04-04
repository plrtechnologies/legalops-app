import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Opinion, OpinionStatus } from '../opinions/entities/opinion.entity';
import { Document, DocumentStatus } from '../documents/entities/document.entity';

export interface DashboardStats {
  totalRequests: number;
  pendingAssignments: number;
  opinionsThisMonth: number;
  issuedThisMonth: number;
  documentsProcessed: number;
  averageTatDays: number | null;
  myPendingWork: number;
  statusBreakdown: Record<string, number>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(OpinionRequest) private readonly requestRepo: Repository<OpinionRequest>,
    @InjectRepository(Opinion) private readonly opinionRepo: Repository<Opinion>,
    @InjectRepository(Document) private readonly documentRepo: Repository<Document>,
  ) {}

  async getStats(tenantId: string, userId: string, role: string): Promise<DashboardStats> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalRequests = await this.requestRepo.count({ where: { tenantId } });

    const pendingAssignments = await this.requestRepo
      .createQueryBuilder('r')
      .where('r.tenantId = :tenantId', { tenantId })
      .andWhere('r.assignedLawyerId IS NULL')
      .andWhere('r.status NOT IN (:...final)', { final: ['FINAL', 'REJECTED'] })
      .getCount();

    const opinionsThisMonth = await this.opinionRepo
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.createdAt >= :monthStart', { monthStart })
      .getCount();

    const issuedThisMonth = await this.opinionRepo
      .createQueryBuilder('o')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status = :status', { status: OpinionStatus.ISSUED })
      .andWhere('o.issuedAt >= :monthStart', { monthStart })
      .getCount();

    const documentsProcessed = await this.documentRepo.count({
      where: { tenantId, status: DocumentStatus.PROCESSED },
    });

    // Average TAT (days between request creation and opinion issuance)
    const tatResult = await this.opinionRepo
      .createQueryBuilder('o')
      .innerJoin('o.opinionRequest', 'r')
      .select('AVG(EXTRACT(EPOCH FROM (o."issuedAt" - r."createdAt")) / 86400)', 'avgDays')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status = :status', { status: OpinionStatus.ISSUED })
      .andWhere('o."issuedAt" IS NOT NULL')
      .getRawOne();
    const averageTatDays = tatResult?.avgDays ? parseFloat(Number(tatResult.avgDays).toFixed(1)) : null;

    // My pending work (for advocates)
    let myPendingWork = 0;
    if (['panel_advocate', 'senior_advocate'].includes(role)) {
      myPendingWork = await this.requestRepo.count({
        where: { tenantId, assignedLawyerId: userId, status: undefined as any },
      });
      myPendingWork = await this.requestRepo
        .createQueryBuilder('r')
        .where('r.tenantId = :tenantId', { tenantId })
        .andWhere('r.assignedLawyerId = :userId', { userId })
        .andWhere('r.status NOT IN (:...final)', { final: ['FINAL', 'REJECTED'] })
        .getCount();
    }

    // Status breakdown
    const statusRows = await this.requestRepo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r.tenantId = :tenantId', { tenantId })
      .groupBy('r.status')
      .getRawMany();
    const statusBreakdown: Record<string, number> = {};
    for (const row of statusRows) {
      statusBreakdown[row.status] = parseInt(row.count, 10);
    }

    return {
      totalRequests,
      pendingAssignments,
      opinionsThisMonth,
      issuedThisMonth,
      documentsProcessed,
      averageTatDays,
      myPendingWork,
      statusBreakdown,
    };
  }
}
