import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpinionTemplate } from './entities/opinion-template.entity';
import { BankClient } from '../bank-clients/entities/bank-client.entity';
import { OpinionTemplatesService } from './opinion-templates.service';
import { OpinionTemplatesController } from './opinion-templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OpinionTemplate, BankClient])],
  providers: [OpinionTemplatesService],
  controllers: [OpinionTemplatesController],
  exports: [OpinionTemplatesService],
})
export class OpinionTemplatesModule {}
