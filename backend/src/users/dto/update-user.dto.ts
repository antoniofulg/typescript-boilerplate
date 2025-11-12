import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Email deve ser um endereço de email válido' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @IsOptional()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password?: string;

  @IsEnum(UserRole, { message: 'Role deve ser ADMIN, OPERATOR ou USER' })
  @IsOptional()
  role?: UserRole;

  @IsString({ message: 'Tenant ID deve ser uma string' })
  @IsOptional()
  @ValidateIf((o: UpdateUserDto) => o.role !== UserRole.SUPER_USER)
  tenantId?: string;

  @IsString({ message: 'Confirmação de senha deve ser uma string' })
  @IsOptional()
  passwordConfirmation?: string;
}
