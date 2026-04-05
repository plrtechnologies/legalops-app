import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OnboardingService, RegisterTenantDto } from './onboarding.service';

@ApiTags('Onboarding')
@Controller('public/register')
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new law firm tenant (public, no auth required)' })
  register(@Body() dto: RegisterTenantDto) {
    return this.service.registerTenant(dto);
  }
}
