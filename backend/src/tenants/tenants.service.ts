import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min, IsObject } from 'class-validator';
import { StorageDriver } from '../storage/interfaces/storage-driver.interface';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class CreateTenantDto {
  @IsNotEmpty() @IsString() code: string;
  @IsOptional() @IsString() slug?: string;
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() primaryColor?: string;
}

export class UpdateTenantSettingsDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() subscriptionTier?: string;
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) maxUsers?: number;
  @IsOptional() @IsObject() settings?: Record<string, unknown>;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() secondaryColor?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() faviconUrl?: string;
}

export interface TenantBrandingResponse {
  tenantId: string;
  name: string;
  code: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  subscriptionTier: string;
  maxUsers: number;
  settings: Record<string, unknown> | null;
}

/** Unauthenticated branding payload (HLD: public tenant config). */
export interface PublicTenantConfigResponse {
  code: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private readonly repo: Repository<Tenant>) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const slug = dto.slug ?? dto.code;
    const existingCode = await this.repo.findOne({ where: { code: dto.code } });
    if (existingCode) throw new ConflictException('Tenant code already exists');
    const existingSlug = await this.repo.findOne({ where: { slug } });
    if (existingSlug) throw new ConflictException('Tenant slug already exists');
    return this.repo.save(
      this.repo.create({
        code: dto.code,
        slug,
        name: dto.name,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
      }),
    );
  }

  findAll(): Promise<Tenant[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Tenant not found');
    return t;
  }

  /**
   * Resolve firm branding by tenant `code` or `slug` for unauthenticated clients (login screen, embeds).
   */
  async getPublicConfig(
    code: string | undefined,
    slug: string | undefined,
    storage: StorageDriver,
  ): Promise<PublicTenantConfigResponse> {
    const c = code?.trim();
    const s = slug?.trim();
    if (!c && !s) throw new BadRequestException('Provide query parameter code or slug');
    const t = c
      ? await this.repo.findOne({ where: { code: c, isActive: true } })
      : await this.repo.findOne({ where: { slug: s!, isActive: true } });
    if (!t) throw new NotFoundException('Tenant not found');
    const logoUrl = await this.resolveAssetUrl(storage, t.logoStorageKey, t.logoUrl);
    const faviconUrl = await this.resolveAssetUrl(storage, t.faviconStorageKey, t.faviconUrl);
    return {
      code: t.code,
      slug: t.slug,
      name: t.name,
      logoUrl,
      faviconUrl,
      primaryColor: t.primaryColor ?? null,
      secondaryColor: t.secondaryColor ?? null,
    };
  }

  async deactivate(id: string): Promise<Tenant> {
    const t = await this.findOne(id);
    t.isActive = false;
    return this.repo.save(t);
  }

  private async resolveAssetUrl(
    storage: StorageDriver,
    storageKey: string | null | undefined,
    externalUrl: string | null | undefined,
  ): Promise<string | null> {
    if (storageKey) {
      return storage.getSignedUrl(storageKey, 3600);
    }
    if (externalUrl && /^https?:\/\//i.test(externalUrl)) {
      return externalUrl;
    }
    if (externalUrl) {
      return storage.getSignedUrl(externalUrl, 3600);
    }
    return null;
  }

  private toBrandingResponse(t: Tenant, storage: StorageDriver): Promise<TenantBrandingResponse> {
    return (async () => ({
      tenantId: t.id,
      name: t.name,
      code: t.code,
      slug: t.slug,
      logoUrl: await this.resolveAssetUrl(storage, t.logoStorageKey, t.logoUrl),
      faviconUrl: await this.resolveAssetUrl(storage, t.faviconStorageKey, t.faviconUrl),
      primaryColor: t.primaryColor ?? null,
      secondaryColor: t.secondaryColor ?? null,
      contactEmail: t.contactEmail ?? null,
      contactPhone: t.contactPhone ?? null,
      address: t.address ?? null,
      subscriptionTier: t.subscriptionTier,
      maxUsers: t.maxUsers,
      settings: t.settings ?? null,
    }))();
  }

  async getBrandingForUser(tenantId: string, storage: StorageDriver): Promise<TenantBrandingResponse> {
    const t = await this.findOne(tenantId);
    const logoUrl = await this.resolveAssetUrl(storage, t.logoStorageKey, t.logoUrl);
    const faviconUrl = await this.resolveAssetUrl(storage, t.faviconStorageKey, t.faviconUrl);
    return {
      tenantId: t.id,
      name: t.name,
      code: t.code,
      slug: t.slug,
      logoUrl,
      faviconUrl,
      primaryColor: t.primaryColor ?? null,
      secondaryColor: t.secondaryColor ?? null,
      contactEmail: t.contactEmail ?? null,
      contactPhone: t.contactPhone ?? null,
      address: t.address ?? null,
      subscriptionTier: t.subscriptionTier,
      maxUsers: t.maxUsers,
      settings: null,
    };
  }

  async getSettingsForUser(tenantId: string, storage: StorageDriver): Promise<TenantBrandingResponse> {
    const t = await this.findOne(tenantId);
    return this.toBrandingResponse(t, storage);
  }

  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto): Promise<Tenant> {
    const t = await this.findOne(tenantId);
    if (dto.name !== undefined) t.name = dto.name;
    if (dto.code !== undefined) {
      const taken = await this.repo.findOne({ where: { code: dto.code } });
      if (taken && taken.id !== t.id) throw new ConflictException('Tenant code already exists');
      t.code = dto.code;
    }
    if (dto.slug !== undefined) {
      const taken = await this.repo.findOne({ where: { slug: dto.slug } });
      if (taken && taken.id !== t.id) throw new ConflictException('Tenant slug already exists');
      t.slug = dto.slug;
    }
    if (dto.contactEmail !== undefined) t.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) t.contactPhone = dto.contactPhone;
    if (dto.address !== undefined) t.address = dto.address;
    if (dto.subscriptionTier !== undefined) t.subscriptionTier = dto.subscriptionTier;
    if (dto.maxUsers !== undefined) t.maxUsers = dto.maxUsers;
    if (dto.settings !== undefined) t.settings = dto.settings;
    if (dto.primaryColor !== undefined) t.primaryColor = dto.primaryColor;
    if (dto.secondaryColor !== undefined) t.secondaryColor = dto.secondaryColor;
    if (dto.logoUrl !== undefined) t.logoUrl = dto.logoUrl;
    if (dto.faviconUrl !== undefined) t.faviconUrl = dto.faviconUrl;
    return this.repo.save(t);
  }

  async updateBranding(
    tenantId: string,
    fields: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      faviconUrl?: string;
    },
    logoFile: Express.Multer.File | undefined,
    faviconFile: Express.Multer.File | undefined,
    storage: StorageDriver,
  ): Promise<Tenant> {
    const t = await this.findOne(tenantId);
    const brandingFolder = 'branding';

    if (logoFile) {
      const ext = path.extname(logoFile.originalname) || '.png';
      const filename = `logo-${uuidv4()}${ext}`;
      const { storagePath } = await storage.upload(tenantId, brandingFolder, filename, logoFile.buffer, logoFile.mimetype);
      t.logoStorageKey = storagePath;
    }
    if (faviconFile) {
      const ext = path.extname(faviconFile.originalname) || '.ico';
      const filename = `favicon-${uuidv4()}${ext}`;
      const { storagePath } = await storage.upload(
        tenantId,
        brandingFolder,
        filename,
        faviconFile.buffer,
        faviconFile.mimetype,
      );
      t.faviconStorageKey = storagePath;
    }
    if (fields.primaryColor !== undefined) t.primaryColor = fields.primaryColor;
    if (fields.secondaryColor !== undefined) t.secondaryColor = fields.secondaryColor;
    if (fields.logoUrl !== undefined) t.logoUrl = fields.logoUrl;
    if (fields.faviconUrl !== undefined) t.faviconUrl = fields.faviconUrl;

    return this.repo.save(t);
  }
}
