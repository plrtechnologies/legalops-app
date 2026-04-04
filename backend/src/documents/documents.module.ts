import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { StorageModule } from '../storage/storage.module';
import { DocumentPipelineModule } from '../document-pipeline/document-pipeline.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, OpinionRequest]),
    StorageModule,
    DocumentPipelineModule,
  ],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
