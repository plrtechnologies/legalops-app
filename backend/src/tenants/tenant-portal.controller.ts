import {
  Body,
  Controller,
  Get,
  Inject,
  Put,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { TenantsService, TenantBrandingResponse, UpdateTenantSettingsDto } from './tenants.service';
import { STORAGE_DRIVER } from '../storage/storage.module';
import { StorageDriver } from '../storage/interfaces/storage-driver.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { getClientIp } from '../common/client-ip.util';

@ApiTags('Tenant (current firm)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenant')
export class TenantPortalController {
  constructor(
    private readonly service: TenantsService,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
    private readonly auditLogs: AuditLogsService,
  ) {}

  @Get('branding')
  async getBranding(@CurrentUser() user: User): Promise<TenantBrandingResponse> {
    return this.service.getBrandingForUser(user.tenantId, this.storage);
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: User): Promise<TenantBrandingResponse> {
    return this.service.getSettingsForUser(user.tenantId, this.storage);
  }

  @Put('settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.TENANT_BRANDING_MANAGER)
  async putSettings(@CurrentUser() user: User, @Req() req: ExpressRequest, @Body() dto: UpdateTenantSettingsDto) {
    await this.service.updateSettings(user.tenantId, dto);
    const keys = (Object.keys(dto) as (keyof UpdateTenantSettingsDto)[]).filter((k) => dto[k] !== undefined);
    await this.auditLogs.record({
      tenantId: user.tenantId,
      entityType: 'tenant',
      entityId: user.tenantId,
      action: 'SETTINGS_UPDATED',
      newValues: { fields: keys },
      userId: user.id,
      userEmail: user.email,
      ipAddress: getClientIp(req),
    });
    return this.service.getSettingsForUser(user.tenantId, this.storage);
  }

  @Put('branding')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FIRM_ADMIN, UserRole.TENANT_BRANDING_MANAGER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: { type: 'string', format: 'binary' },
        favicon: { type: 'string', format: 'binary' },
        primaryColor: { type: 'string' },
        secondaryColor: { type: 'string' },
        logoUrl: { type: 'string', description: 'External logo URL (optional)' },
        faviconUrl: { type: 'string', description: 'External favicon URL (optional)' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'favicon', maxCount: 1 },
    ]),
  )
  async putBranding(
    @CurrentUser() user: User,
    @Req() req: ExpressRequest,
    @UploadedFiles() files: { logo?: Express.Multer.File[]; favicon?: Express.Multer.File[] },
    @Body() body: Record<string, string>,
  ) {
    await this.service.updateBranding(
      user.tenantId,
      {
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        logoUrl: body.logoUrl,
        faviconUrl: body.faviconUrl,
      },
      files?.logo?.[0],
      files?.favicon?.[0],
      this.storage,
    );
    await this.auditLogs.record({
      tenantId: user.tenantId,
      entityType: 'tenant',
      entityId: user.tenantId,
      action: 'BRANDING_UPDATED',
      newValues: {
        primaryColor: body.primaryColor !== undefined,
        secondaryColor: body.secondaryColor !== undefined,
        logoUrl: body.logoUrl !== undefined,
        faviconUrl: body.faviconUrl !== undefined,
        logoUploaded: Boolean(files?.logo?.[0]),
        faviconUploaded: Boolean(files?.favicon?.[0]),
      },
      userId: user.id,
      userEmail: user.email,
      ipAddress: getClientIp(req),
    });
    return this.service.getBrandingForUser(user.tenantId, this.storage);
  }
}
