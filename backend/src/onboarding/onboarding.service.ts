import { Injectable, Logger, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { EmailService } from '../notifications/email/email.service';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterTenantDto {
  @IsNotEmpty() @IsString() firmName: string;
  @IsNotEmpty() @IsString() firmCode: string;
  @IsNotEmpty() @IsString() adminFirstName: string;
  @IsNotEmpty() @IsString() adminLastName: string;
  @IsNotEmpty() @IsEmail() adminEmail: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() address?: string;
}

export interface RegistrationResult {
  tenantId: string;
  firmCode: string;
  firmName: string;
  adminEmail: string;
  loginUrl: string;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async registerTenant(dto: RegisterTenantDto): Promise<RegistrationResult> {
    // Validate uniqueness
    const existingCode = await this.tenantRepo.findOne({ where: { code: dto.firmCode } });
    if (existingCode) throw new ConflictException('Firm code already registered');

    const existingEmail = await this.userRepo.findOne({ where: { email: dto.adminEmail } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const slug = dto.firmCode.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // 1. Create tenant
    const tenant = await this.tenantRepo.save(
      this.tenantRepo.create({
        code: dto.firmCode,
        slug,
        name: dto.firmName,
        contactEmail: dto.adminEmail,
        contactPhone: dto.contactPhone,
        address: dto.address,
        isActive: true,
        subscriptionTier: 'standard',
      }),
    );

    // 2. Create Keycloak user
    const tempPassword = this.generateTempPassword();
    let keycloakId: string;
    try {
      keycloakId = await this.createKeycloakUser(
        dto.adminEmail,
        dto.adminFirstName,
        dto.adminLastName,
        tempPassword,
        tenant.id,
      );
    } catch (err) {
      // Rollback tenant creation
      await this.tenantRepo.remove(tenant);
      this.logger.error(`Keycloak user creation failed: ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to create user account. Please try again.');
    }

    // 3. Create local user record
    await this.userRepo.save(
      this.userRepo.create({
        tenantId: tenant.id,
        keycloakId,
        email: dto.adminEmail,
        firstName: dto.adminFirstName,
        lastName: dto.adminLastName,
        role: UserRole.FIRM_ADMIN,
        isActive: true,
      }),
    );

    // 4. Send welcome email with credentials
    const loginUrl = `${this.config.get('cors')?.split(',')[0] ?? 'http://localhost'}/welcome?code=${dto.firmCode}`;
    await this.sendWelcomeEmail(dto, tempPassword, loginUrl);

    this.logger.log(`Tenant registered: ${dto.firmName} (${dto.firmCode}), admin: ${dto.adminEmail}`);

    return {
      tenantId: tenant.id,
      firmCode: dto.firmCode,
      firmName: dto.firmName,
      adminEmail: dto.adminEmail,
      loginUrl,
    };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const special = '@#$!';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    pw += special[Math.floor(Math.random() * special.length)];
    return pw;
  }

  private async createKeycloakUser(
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    tenantId: string,
  ): Promise<string> {
    const keycloakUrl = this.config.get<string>('keycloak.url');
    const realm = this.config.get<string>('keycloak.realm');

    // Get admin token
    const tokenRes = await axios.post(
      `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'admin-cli',
        client_secret: this.config.get('keycloak.adminSecret') ?? '',
        // Fallback to password grant if no client secret
        ...(!this.config.get('keycloak.adminSecret') ? {
          grant_type: 'password',
          username: this.config.get('keycloak.adminUser') ?? 'admin',
          password: this.config.get('keycloak.adminPassword') ?? '',
        } : {}),
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const adminToken = tokenRes.data.access_token;

    // Create user in Keycloak
    const createRes = await axios.post(
      `${keycloakUrl}/admin/realms/${realm}/users`,
      {
        username: email,
        email,
        firstName,
        lastName,
        enabled: true,
        emailVerified: true,
        attributes: { tenant_id: [tenantId] },
        credentials: [{ type: 'password', value: password, temporary: true }],
      },
      { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
    );

    // Extract user ID from Location header
    const locationHeader = createRes.headers['location'] as string;
    const keycloakUserId = locationHeader.split('/').pop()!;

    // Assign firm_admin role
    const rolesRes = await axios.get(
      `${keycloakUrl}/admin/realms/${realm}/roles`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const firmAdminRole = rolesRes.data.find((r: { name: string }) => r.name === 'firm_admin');
    if (firmAdminRole) {
      await axios.post(
        `${keycloakUrl}/admin/realms/${realm}/users/${keycloakUserId}/role-mappings/realm`,
        [firmAdminRole],
        { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } },
      );
    }

    return keycloakUserId;
  }

  private async sendWelcomeEmail(dto: RegisterTenantDto, password: string, loginUrl: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to LegalOps!</h2>
        <p>Dear ${dto.adminFirstName} ${dto.adminLastName},</p>
        <p>Your law firm <strong>${dto.firmName}</strong> has been successfully registered on the LegalOps platform.</p>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Login Credentials</h3>
          <table style="border-collapse: collapse;">
            <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Login URL:</td><td style="padding: 4px 0;"><a href="${loginUrl}">${loginUrl}</a></td></tr>
            <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Email:</td><td style="padding: 4px 0;">${dto.adminEmail}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Temporary Password:</td><td style="padding: 4px 0;"><code style="background: #e8e8e8; padding: 2px 6px; border-radius: 3px;">${password}</code></td></tr>
            <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Firm Code:</td><td style="padding: 4px 0;">${dto.firmCode}</td></tr>
          </table>
        </div>

        <p><strong>Important:</strong> You will be asked to change your password on first login.</p>

        <h3>Getting Started</h3>
        <ol>
          <li>Click the login URL above and sign in with your credentials</li>
          <li>Change your temporary password when prompted</li>
          <li>Go to <strong>Tenant Settings</strong> to upload your firm's logo and configure branding</li>
          <li>Add your <strong>Bank Clients</strong> and configure opinion templates</li>
          <li>Invite your team members via <strong>User Management</strong></li>
        </ol>

        <p>If you have any questions, please contact our support team.</p>
        <p>Regards,<br/>The LegalOps Team</p>
      </div>
    `;

    await this.emailService.sendEmail(
      dto.adminEmail,
      `Welcome to LegalOps - ${dto.firmName} Account Created`,
      html,
    );
  }
}
