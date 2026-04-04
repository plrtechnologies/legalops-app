import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Opinion, OpinionStatus } from '../opinions/entities/opinion.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(OpinionRequest) private readonly requestRepo: Repository<OpinionRequest>,
    @InjectRepository(Opinion) private readonly opinionRepo: Repository<Opinion>,
  ) {}

  async getTatReport(tenantId: string, from?: Date, to?: Date, bankClientId?: string) {
    const qb = this.opinionRepo
      .createQueryBuilder('o')
      .innerJoin('o.opinionRequest', 'r')
      .select('r."bankClientId"', 'bankClientId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(EXTRACT(EPOCH FROM (o."issuedAt" - r."createdAt")) / 86400)', 'avgDays')
      .addSelect('MIN(EXTRACT(EPOCH FROM (o."issuedAt" - r."createdAt")) / 86400)', 'minDays')
      .addSelect('MAX(EXTRACT(EPOCH FROM (o."issuedAt" - r."createdAt")) / 86400)', 'maxDays')
      .where('o.tenantId = :tenantId', { tenantId })
      .andWhere('o.status = :status', { status: OpinionStatus.ISSUED })
      .andWhere('o."issuedAt" IS NOT NULL');

    if (from) qb.andWhere('o."issuedAt" >= :from', { from });
    if (to) qb.andWhere('o."issuedAt" <= :to', { to });
    if (bankClientId) qb.andWhere('r."bankClientId" = :bankClientId', { bankClientId });

    const rows = await qb.groupBy('r."bankClientId"').getRawMany();
    return rows.map((r) => ({
      bankClientId: r.bankClientId,
      count: parseInt(r.count, 10),
      avgDays: r.avgDays ? parseFloat(Number(r.avgDays).toFixed(1)) : null,
      minDays: r.minDays ? parseFloat(Number(r.minDays).toFixed(1)) : null,
      maxDays: r.maxDays ? parseFloat(Number(r.maxDays).toFixed(1)) : null,
    }));
  }

  async getWorkloadReport(tenantId: string) {
    const rows = await this.requestRepo
      .createQueryBuilder('r')
      .leftJoin('r.assignedLawyer', 'u')
      .select('r."assignedLawyerId"', 'lawyerId')
      .addSelect("COALESCE(u.\"firstName\" || ' ' || u.\"lastName\", 'Unassigned')", 'lawyerName')
      .addSelect('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r.tenantId = :tenantId', { tenantId })
      .groupBy('r."assignedLawyerId"')
      .addGroupBy("u.\"firstName\"")
      .addGroupBy("u.\"lastName\"")
      .addGroupBy('r.status')
      .getRawMany();

    const byLawyer: Record<string, { lawyerName: string; statuses: Record<string, number>; total: number }> = {};
    for (const row of rows) {
      const key = row.lawyerId ?? 'unassigned';
      if (!byLawyer[key]) byLawyer[key] = { lawyerName: row.lawyerName, statuses: {}, total: 0 };
      byLawyer[key].statuses[row.status] = parseInt(row.count, 10);
      byLawyer[key].total += parseInt(row.count, 10);
    }
    return Object.entries(byLawyer).map(([id, data]) => ({ lawyerId: id, ...data }));
  }

  async getComplianceReport(tenantId: string, from?: Date, to?: Date) {
    const qb = this.requestRepo
      .createQueryBuilder('r')
      .innerJoin(Opinion, 'o', 'o."opinionRequestId" = r.id AND o.status = :issued', { issued: OpinionStatus.ISSUED })
      .select('COUNT(*)', 'totalIssued')
      .addSelect('SUM(CASE WHEN r."dueDate" IS NOT NULL AND o."issuedAt" <= r."dueDate" THEN 1 ELSE 0 END)', 'onTime')
      .addSelect('SUM(CASE WHEN r."dueDate" IS NOT NULL AND o."issuedAt" > r."dueDate" THEN 1 ELSE 0 END)', 'breached')
      .addSelect('SUM(CASE WHEN r."dueDate" IS NULL THEN 1 ELSE 0 END)', 'noDueDate')
      .where('r.tenantId = :tenantId', { tenantId });

    if (from) qb.andWhere('o."issuedAt" >= :from', { from });
    if (to) qb.andWhere('o."issuedAt" <= :to', { to });

    const raw = await qb.getRawOne();
    const totalIssued = parseInt(raw.totalIssued ?? '0', 10);
    const onTime = parseInt(raw.onTime ?? '0', 10);
    const breached = parseInt(raw.breached ?? '0', 10);

    return {
      totalIssued,
      onTime,
      breached,
      noDueDate: parseInt(raw.noDueDate ?? '0', 10),
      onTimePercentage: totalIssued > 0 ? parseFloat(((onTime / totalIssued) * 100).toFixed(1)) : null,
    };
  }
}
