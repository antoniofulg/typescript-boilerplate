import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSuperAdminDto {
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
}
