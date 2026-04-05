import {
  Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors,
  UploadedFile, Body, Request, ParseEnumPipe, Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DocumentType } from './entities/document.entity';
import { DocumentsService } from './documents.service';
import { User } from '../users/entities/user.entity';
import { getClientIp } from '../common/client-ip.util';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('opinion-requests/:opinionRequestId/documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  private audit(req: ExpressRequest, user: User) {
    return {
      userId: user.id,
      userEmail: user.email,
      ipAddress: getClientIp(req),
    };
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.PANEL_ADVOCATE, UserRole.PARALEGAL)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  upload(
    @Req() req: ExpressRequest,
    @Param('opinionRequestId') opinionRequestId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType', new ParseEnumPipe(DocumentType)) documentType: DocumentType,
  ) {
    const user = req.user as User;
    return this.service.upload(
      user.tenantId,
      opinionRequestId,
      file,
      documentType,
      user.id,
      this.audit(req, user),
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.PANEL_ADVOCATE, UserRole.PARALEGAL)
  findAll(@Request() req: ExpressRequest, @Param('opinionRequestId') opinionRequestId: string) {
    const user = req.user as User;
    return this.service.findByOpinionRequestId(user.tenantId, opinionRequestId);
  }

  @Get(':id/signed-url')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE, UserRole.PANEL_ADVOCATE, UserRole.PARALEGAL)
  getSignedUrl(@Request() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as User;
    return this.service.getSignedUrl(user.tenantId, id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.SENIOR_ADVOCATE)
  remove(@Req() req: ExpressRequest, @Param('id') id: string) {
    const user = req.user as User;
    return this.service.remove(user.tenantId, id, this.audit(req, user));
  }
}
