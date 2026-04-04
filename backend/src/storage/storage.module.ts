import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NfsStorageDriver } from './drivers/nfs.driver';
import { S3StorageDriver } from './drivers/s3.driver';

export const STORAGE_DRIVER = 'STORAGE_DRIVER';

@Module({
  imports: [ConfigModule],
  providers: [
    NfsStorageDriver,
    S3StorageDriver,
    {
      provide: STORAGE_DRIVER,
      inject: [ConfigService, NfsStorageDriver, S3StorageDriver],
      useFactory: (cfg: ConfigService, nfs: NfsStorageDriver, s3: S3StorageDriver) =>
        cfg.get<string>('storage.driver') === 's3' ? s3 : nfs,
    },
  ],
  exports: [STORAGE_DRIVER],
})
export class StorageModule {}
