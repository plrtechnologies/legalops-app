import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { StorageDriver, UploadResult } from '../interfaces/storage-driver.interface';

@Injectable()
export class S3StorageDriver implements StorageDriver {
  private readonly logger = new Logger(S3StorageDriver.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const s3Cfg = config.get('storage.s3');
    this.bucket = s3Cfg.bucket;
    this.client = new S3Client({
      region: s3Cfg.region,
      endpoint: s3Cfg.endpoint,
      forcePathStyle: s3Cfg.forcePathStyle,
      credentials: {
        accessKeyId: s3Cfg.accessKey,
        secretAccessKey: s3Cfg.secretKey,
      },
    });
  }

  async upload(
    tenantId: string,
    caseId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult> {
    const key = `${tenantId}/${caseId}/${filename}`;
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: mimeType }),
    );
    this.logger.log(`Uploaded to S3: ${key}`);
    return { storagePath: key };
  }

  async getSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: storagePath }),
      { expiresIn: expiresInSeconds },
    );
  }

  async delete(storagePath: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storagePath }));
  }

  async exists(storagePath: string): Promise<boolean> {
    return this.client
      .send(new HeadObjectCommand({ Bucket: this.bucket, Key: storagePath }))
      .then(() => true)
      .catch(() => false);
  }
}
