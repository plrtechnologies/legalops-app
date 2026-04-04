import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Opinion } from '../opinions/entities/opinion.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([OpinionRequest, Opinion])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
