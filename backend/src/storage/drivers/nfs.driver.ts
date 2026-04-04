import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageDriver, UploadResult } from '../interfaces/storage-driver.interface';

@Injectable()
export class NfsStorageDriver implements StorageDriver {
  private readonly logger = new Logger(NfsStorageDriver.name);
  private readonly basePath: string;

  constructor(private readonly config: ConfigService) {
    this.basePath = config.get<string>('storage.nfsPath') ?? '/mnt/nfs/legalops-documents';
  }

  async upload(
    tenantId: string,
    caseId: string,
    filename: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<UploadResult> {
    const dir = path.join(this.basePath, tenantId, caseId);
    await fs.mkdir(dir, { recursive: true });
    const storagePath = path.join(dir, filename);
    await fs.writeFile(storagePath, buffer);
    this.logger.log(`Uploaded to NFS: ${storagePath}`);
    return { storagePath };
  }

  async getSignedUrl(storagePath: string, _expiresInSeconds = 3600): Promise<string> {
    // For local/NFS, return a relative path; reverse proxy exposes /files/* via the K8s NFS PVC
    return `/files/${storagePath.replace(this.basePath + '/', '')}`;
  }

  async delete(storagePath: string): Promise<void> {
    await fs.unlink(storagePath);
  }

  async exists(storagePath: string): Promise<boolean> {
    return fs.access(storagePath).then(() => true).catch(() => false);
  }
}
