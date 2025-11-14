import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdateRoleDto {
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'Tenant ID must be a string' })
  @IsOptional()
  tenantId?: string | null;
}
