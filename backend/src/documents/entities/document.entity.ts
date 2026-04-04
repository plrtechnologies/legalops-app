import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { OpinionRequest } from '../../opinion-requests/entities/opinion-request.entity';
import { User } from '../../users/entities/user.entity';

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum DocumentType {
  SALE_DEED = 'SALE_DEED',
  MORTGAGE_DEED = 'MORTGAGE_DEED',
  TITLE_CERTIFICATE = 'TITLE_CERTIFICATE',
  EC = 'EC',
  PROPERTY_TAX = 'PROPERTY_TAX',
  WILL_DEED = 'WILL_DEED',
  GIFT_DEED = 'GIFT_DEED',
  PARTITION_DEED = 'PARTITION_DEED',
  RELINQUISHMENT_DEED = 'RELINQUISHMENT_DEED',
  OTHER = 'OTHER',
}

@Entity('documents')
@Index(['tenantId'])
@Index(['opinionRequestId'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  opinionRequestId: string;

  @ManyToOne(() => OpinionRequest, (r) => r.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opinionRequestId' })
  opinionRequest: OpinionRequest;

  @Column()
  originalFilename: string;

  @Column()
  storagePath: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  documentType: DocumentType;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  status: DocumentStatus;

  @Column({ nullable: true })
  language: string;

  @Column({ type: 'float', nullable: true })
  ocrConfidence: number;

  @Column({ type: 'text', nullable: true })
  rawOcrText: string;

  @Column({ type: 'jsonb', nullable: true })
  extractedData: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  detectedLanguage: string;

  @Column({ type: 'text', nullable: true })
  originalLanguageText: string;

  @Column({ type: 'text', nullable: true })
  translatedText: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  translationStatus: string;

  @Column({ nullable: true })
  uploadedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
