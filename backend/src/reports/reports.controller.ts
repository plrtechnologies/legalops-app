import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ReportsService } from './reports.service';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

class AuditLogQueryDto {
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
}

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly auditLogs: AuditLogsService,
    private readonly reportsService: ReportsService,
  ) {}

  @Get('audit-logs')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FIRM_ADMIN,
    UserRole.SENIOR_ADVOCATE,
    UserRole.PANEL_ADVOCATE,
    UserRole.PARALEGAL,
  )
  async listAuditLogs(@CurrentUser() user: User, @Query() q: AuditLogQueryDto) {
    const limit = q.limit ?? 50;
    const offset = q.offset ?? 0;
    const from = q.from ? new Date(q.from) : undefined;
    const to = q.to ? new Date(q.to) : undefined;
    return this.auditLogs.listForTenant(user.tenantId, {
      from: from && !Number.isNaN(from.getTime()) ? from : undefined,
      to: to && !Number.isNaN(to.getTime()) ? to : undefined,
      entityType: q.entityType,
      userId: q.userId,
      limit,
      offset,
    });
  }

  @Get('tat')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  async getTat(
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('bankClientId') bankClientId?: string,
  ) {
    return this.reportsService.getTatReport(
      user.tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      bankClientId,
    );
  }

  @Get('workload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  async getWorkload(@CurrentUser() user: User) {
    return this.reportsService.getWorkloadReport(user.tenantId);
  }

  @Get('compliance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  async getCompliance(
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getComplianceReport(
      user.tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
