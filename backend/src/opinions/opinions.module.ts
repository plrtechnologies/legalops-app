import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Opinion } from './entities/opinion.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { OpinionsService } from './opinions.service';
import { OpinionsController } from './opinions.controller';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Opinion, OpinionRequest]), AiModule, NotificationsModule],
  providers: [OpinionsService],
  controllers: [OpinionsController],
  exports: [OpinionsService],
})
export class OpinionsModule {}
