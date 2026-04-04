import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseEnumPipe,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { OpinionRequestsService, CreateOpinionRequestDto } from './opinion-requests.service';
import { OpinionRequestStatus } from './entities/opinion-request.entity';
import { getClientIp } from '../common/client-ip.util';

@ApiTags('Opinion requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('opinion-requests')
export class OpinionRequestsController {
  constructor(private readonly service: OpinionRequestsService) {}

  private audit(req: Request, user: User) {
    return {
      userId: user.id,
      userEmail: user.email,
      ipAddress: getClientIp(req),
    };
  }

  @Post()
  @Roles(UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.PARALEGAL)
  create(@Req() req: Request, @CurrentUser() user: User, @Body() dto: CreateOpinionRequestDto) {
    return this.service.create(user.tenantId, user.id, dto, this.audit(req, user));
  }

  @Get()
  @Roles(
    UserRole.FIRM_ADMIN,
    UserRole.SENIOR_ADVOCATE,
    UserRole.PANEL_ADVOCATE,
    UserRole.PARALEGAL,
  )
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles(
    UserRole.FIRM_ADMIN,
    UserRole.SENIOR_ADVOCATE,
    UserRole.PANEL_ADVOCATE,
    UserRole.PARALEGAL,
  )
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  updateStatus(
    @Req() req: Request,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(OpinionRequestStatus)) status: OpinionRequestStatus,
  ) {
    return this.service.updateStatus(user.tenantId, id, status, this.audit(req, user));
  }

  @Patch(':id/assign')
  @Roles(UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  assign(
    @Req() req: Request,
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('lawyerId') lawyerId: string,
  ) {
    return this.service.assign(user.tenantId, id, lawyerId, this.audit(req, user));
  }

  @Delete(':id')
  @Roles(UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  remove(@Req() req: Request, @CurrentUser() user: User, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id, this.audit(req, user));
  }
}
