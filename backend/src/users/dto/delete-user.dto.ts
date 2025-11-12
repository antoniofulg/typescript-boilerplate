import { IsOptional, IsString } from 'class-validator';

export class DeleteUserDto {
  @IsString({ message: 'Confirmação de senha deve ser uma string' })
  @IsOptional()
  passwordConfirmation?: string;
}
