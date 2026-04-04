import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { BankClient } from '../bank-clients/entities/bank-client.entity';
import { EndCustomer } from '../end-customers/entities/end-customer.entity';
import { OpinionTemplate } from '../opinion-templates/entities/opinion-template.entity';
import { DevSeedService } from './dev-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, BankClient, EndCustomer, OpinionTemplate])],
  providers: [DevSeedService],
})
export class SeedModule {}
