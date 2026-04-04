import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Opinion } from '../opinions/entities/opinion.entity';
import { Document } from '../documents/entities/document.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OpinionRequest, Opinion, Document])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
