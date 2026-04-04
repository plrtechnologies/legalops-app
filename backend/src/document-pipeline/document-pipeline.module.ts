import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OcrService } from './ocr/ocr.service';
import { SarvamService } from './sarvam/sarvam.service';
import { DocumentPipelineService } from './document-pipeline.service';
import { Document } from '../documents/entities/document.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { Opinion } from '../opinions/entities/opinion.entity';
import { StorageModule } from '../storage/storage.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Tenant, OpinionRequest, Opinion]), StorageModule, ConfigModule, AiModule],
  providers: [OcrService, SarvamService, DocumentPipelineService],
  exports: [DocumentPipelineService],
})
export class DocumentPipelineModule {}
