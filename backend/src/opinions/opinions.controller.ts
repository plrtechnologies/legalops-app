import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { OpinionsService, CreateOpinionDto, AddReviewCommentDto } from './opinions.service';
import { AiService } from '../ai/ai.service';
import { getClientIp } from '../common/client-ip.util';

@ApiTags('Opinions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('opinion-requests/:opinionRequestId/opinions')
export class OpinionsController {
  constructor(
    private readonly service: OpinionsService,
    private readonly aiService: AiService,
  ) {}

  private audit(req: ExpressRequest, user: User) {
    return {
      userId: user.id,
      userEmail: user.email,
      ipAddress: getClientIp(req),
    };
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PANEL_ADVOCATE, UserRole.SENIOR_ADVOCATE, UserRole.FIRM_ADMIN)
  create(
    @Req() req: ExpressRequest,
    @Param('opinionRequestId') opinionRequestId: string,
    @Body() dto: CreateOpinionDto,
  ) {
    const user = req.user as User;
    return this.service.createDraft(user.tenantId, opinionRequestId, user.id, dto, this.audit(req, user));
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.PANEL_ADVOCATE, UserRole.PARALEGAL)
  findAll(@Req() req: ExpressRequest, @Param('opinionRequestId') opinionRequestId: string) {
    const user = req.user as User;
    return this.service.findByOpinionRequestId(user.tenantId, opinionRequestId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.PANEL_ADVOCATE, UserRole.PARALEGAL)
  findOne(@Req() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as User;
    return this.service.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PANEL_ADVOCATE, UserRole.SENIOR_ADVOCATE, UserRole.FIRM_ADMIN)
  update(@Req() req: ExpressRequest, @Param('id') id: string, @Body() dto: CreateOpinionDto) {
    const user = req.user as User;
    return this.service.update(user.tenantId, id, dto, this.audit(req, user));
  }

  @Patch(':id/submit')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PANEL_ADVOCATE, UserRole.SENIOR_ADVOCATE)
  submit(@Req() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as User;
    return this.service.submitForReview(user.tenantId, id, this.audit(req, user));
  }

  @Patch(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.FIRM_ADMIN)
  approve(@Req() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as User;
    return this.service.approve(user.tenantId, id, user.id, this.audit(req, user));
  }

  @Patch(':id/issue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  issue(@Req() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as User;
    return this.service.issue(user.tenantId, id, this.audit(req, user));
  }

  @Post(':id/generate-draft')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PANEL_ADVOCATE, UserRole.SENIOR_ADVOCATE, UserRole.FIRM_ADMIN)
  generateDraft(
    @Req() req: ExpressRequest,
    @Param('id') id: string,
  ) {
    const user = req.user as User;
    return this.aiService.generateDraftOpinion(user.tenantId, id, this.audit(req, user));
  }

  @Post(':id/comments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.FIRM_ADMIN)
  addComment(@Req() req: ExpressRequest, @Param('id') id: string, @Body() dto: AddReviewCommentDto) {
    const user = req.user as User;
    return this.service.addComment(user.tenantId, id, user.id, dto, this.audit(req, user));
  }
}
