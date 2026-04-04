import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TenantPortalController } from './tenant-portal.controller';
import { PublicTenantsController } from './public-tenants.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), StorageModule],
  providers: [TenantsService],
  controllers: [TenantsController, TenantPortalController, PublicTenantsController],
  exports: [TenantsService],
})
export class TenantsModule {}
