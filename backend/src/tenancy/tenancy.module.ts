import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantMiddleware } from './tenant.middleware';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [TenantMiddleware],
  exports: [TenantMiddleware, TypeOrmModule],
})
export class TenancyModule {}
