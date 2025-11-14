import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreatePermissionDto {
  @IsString({ message: 'Key must be a string' })
  @IsNotEmpty({ message: 'Key is required' })
  @Matches(/^[a-z0-9:_-]+$/, {
    message:
      'Key must contain only lowercase letters, numbers, colons, underscores, and hyphens',
  })
  key: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;
}
