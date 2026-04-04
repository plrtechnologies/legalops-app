import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  @Roles(
    UserRole.FIRM_ADMIN,
    UserRole.SENIOR_ADVOCATE,
    UserRole.PANEL_ADVOCATE,
    UserRole.PARALEGAL,
  )
  getStats(@Req() req: ExpressRequest) {
    const user = req.user as User;
    return this.service.getStats(user.tenantId, user.id, user.role);
  }
}
