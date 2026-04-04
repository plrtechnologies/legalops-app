import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Opinion } from '../opinions/entities/opinion.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Document } from '../documents/entities/document.entity';
import { OpinionTemplate } from '../opinion-templates/entities/opinion-template.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { AiService } from './ai.service';
import { TranslationService } from './translation/translation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Opinion, OpinionRequest, Document, OpinionTemplate, Tenant])],
  providers: [AiService, TranslationService],
  exports: [AiService, TranslationService],
})
export class AiModule {}
