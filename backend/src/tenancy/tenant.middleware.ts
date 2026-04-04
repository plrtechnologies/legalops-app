import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async use(req: Request & { tenant?: Tenant }, _res: Response, next: NextFunction) {
    const slug =
      req.headers['x-tenant-slug'] as string ??
      (req.hostname?.split('.')[0]);

    if (slug) {
      const tenant = await this.tenantRepo.findOne({ where: { slug, isActive: true } });
      if (tenant) req.tenant = tenant;
    }
    next();
  }
}
