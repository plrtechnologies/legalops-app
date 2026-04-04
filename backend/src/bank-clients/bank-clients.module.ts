import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankClient } from './entities/bank-client.entity';
import { BankClientsService } from './bank-clients.service';
import { BankClientsController } from './bank-clients.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BankClient])],
  providers: [BankClientsService],
  controllers: [BankClientsController],
  exports: [BankClientsService],
})
export class BankClientsModule {}
