import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { STORAGE_DRIVER } from '../storage/storage.module';
import { StorageDriver } from '../storage/interfaces/storage-driver.interface';

@ApiTags('Public')
@Controller('public/tenants')
export class PublicTenantsController {
  constructor(
    private readonly service: TenantsService,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Public firm branding by tenant code or slug (no auth)' })
  @ApiQuery({ name: 'code', required: false, description: 'Tenant code (preferred if both set)' })
  @ApiQuery({ name: 'slug', required: false })
  getConfig(@Query('code') code?: string, @Query('slug') slug?: string) {
    return this.service.getPublicConfig(code, slug, this.storage);
  }
}
