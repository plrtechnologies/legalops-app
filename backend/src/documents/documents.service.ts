import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType } from './entities/document.entity';
import { OpinionRequest } from '../opinion-requests/entities/opinion-request.entity';
import { STORAGE_DRIVER } from '../storage/storage.module';
import { StorageDriver } from '../storage/interfaces/storage-driver.interface';
import { DocumentPipelineService } from '../document-pipeline/document-pipeline.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuditContext } from '../audit-logs/audit-context';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly repo: Repository<Document>,
    @InjectRepository(OpinionRequest) private readonly opinionRequestRepo: Repository<OpinionRequest>,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
    private readonly pipeline: DocumentPipelineService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async upload(
    tenantId: string,
    opinionRequestId: string,
    file: Express.Multer.File,
    documentType: DocumentType,
    uploadedById: string,
    audit: AuditContext,
  ): Promise<Document> {
    const req = await this.opinionRequestRepo.findOne({ where: { id: opinionRequestId, tenantId } });
    if (!req) throw new NotFoundException('Opinion request not found');

    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;

    const { storagePath } = await this.storage.upload(
      tenantId,
      opinionRequestId,
      filename,
      file.buffer,
      file.mimetype,
    );

    const doc = await this.repo.save(
      this.repo.create({
        tenantId,
        opinionRequestId,
        originalFilename: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        fileSize: file.size,
        documentType,
        uploadedById,
      }),
    );

    await this.auditLogs.record({
      tenantId,
      entityType: 'document',
      entityId: doc.id,
      action: 'UPLOADED',
      newValues: {
        opinionRequestId,
        originalFilename: file.originalname,
        documentType,
      },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });

    this.pipeline.process(doc, file.buffer, file.mimetype).catch(() => {});

    return doc;
  }

  async findByOpinionRequestId(tenantId: string, opinionRequestId: string): Promise<Document[]> {
    const req = await this.opinionRequestRepo.findOne({ where: { id: opinionRequestId, tenantId } });
    if (!req) throw new NotFoundException('Opinion request not found');
    return this.repo.find({
      where: { tenantId, opinionRequestId },
      order: { createdAt: 'ASC' },
    });
  }

  async getSignedUrl(tenantId: string, documentId: string): Promise<string> {
    const doc = await this.repo.findOne({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    return this.storage.getSignedUrl(doc.storagePath, 3600);
  }

  async remove(tenantId: string, documentId: string, audit: AuditContext): Promise<void> {
    const doc = await this.repo.findOne({ where: { id: documentId, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.auditLogs.record({
      tenantId,
      entityType: 'document',
      entityId: documentId,
      action: 'DELETED',
      oldValues: {
        opinionRequestId: doc.opinionRequestId,
        originalFilename: doc.originalFilename,
      },
      userId: audit.userId,
      userEmail: audit.userEmail,
      ipAddress: audit.ipAddress,
    });
    await this.storage.delete(doc.storagePath);
    await this.repo.remove(doc);
  }
}
