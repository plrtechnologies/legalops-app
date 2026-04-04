import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpinionRequest } from './entities/opinion-request.entity';
import { EndCustomer } from '../end-customers/entities/end-customer.entity';
import { BankClient } from '../bank-clients/entities/bank-client.entity';
import { OpinionTemplate } from '../opinion-templates/entities/opinion-template.entity';
import { OpinionRequestsService } from './opinion-requests.service';
import { OpinionRequestsController } from './opinion-requests.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OpinionRequest, EndCustomer, BankClient, OpinionTemplate]),
  ],
  providers: [OpinionRequestsService],
  controllers: [OpinionRequestsController],
  exports: [OpinionRequestsService],
})
export class OpinionRequestsModule {}
