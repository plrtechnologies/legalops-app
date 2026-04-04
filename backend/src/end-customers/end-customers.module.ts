import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EndCustomer } from './entities/end-customer.entity';
import { BankClient } from '../bank-clients/entities/bank-client.entity';
import { EndCustomersService } from './end-customers.service';
import { EndCustomersController } from './end-customers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EndCustomer, BankClient])],
  providers: [EndCustomersService],
  controllers: [EndCustomersController],
  exports: [EndCustomersService],
})
export class EndCustomersModule {}
