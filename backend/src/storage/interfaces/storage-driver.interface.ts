export interface UploadResult {
  storagePath: string;
  publicUrl?: string;
}

export interface StorageDriver {
  upload(
    tenantId: string,
    caseId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<UploadResult>;
  getSignedUrl(storagePath: string, expiresInSeconds?: number): Promise<string>;
  delete(storagePath: string): Promise<void>;
  exists(storagePath: string): Promise<boolean>;
}
