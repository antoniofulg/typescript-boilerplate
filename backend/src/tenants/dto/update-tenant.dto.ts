import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { TenantStatus } from '@prisma/client';

export class UpdateTenantDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Slug deve ser uma string' })
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug?: string;

  @IsEnum(TenantStatus, {
    message: 'Status deve ser ACTIVE, INACTIVE ou SUSPENDED',
  })
  @IsOptional()
  status?: TenantStatus;
}
