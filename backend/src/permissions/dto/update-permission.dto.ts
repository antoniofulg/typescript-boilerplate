import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdatePermissionDto {
  @IsString({ message: 'Key must be a string' })
  @IsOptional()
  @Matches(/^[a-z0-9:_-]+$/, {
    message:
      'Key must contain only lowercase letters, numbers, colons, underscores, and hyphens',
  })
  key?: string;

  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;
}
