import { z } from 'zod';

const userRoleEnum = z.enum(['SUPER_USER', 'ADMIN', 'OPERATOR', 'USER']);

export const createUserSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Nome é obrigatório')
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres'),
    email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
    password: z
      .string()
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .min(1, 'Senha é obrigatória'),
    role: userRoleEnum,
    tenantId: z.string().uuid('Tenant ID inválido').optional().nullable(),
    passwordConfirmation: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'SUPER_USER') {
        return !!data.passwordConfirmation;
      }
      return true;
    },
    {
      message: 'Confirmação de senha é obrigatória para criar SUPER_USER',
      path: ['passwordConfirmation'],
    },
  )
  .refine(
    (data) => {
      if (data.role === 'SUPER_USER') {
        return data.tenantId === null || data.tenantId === undefined;
      }
      return true;
    },
    {
      message: 'SUPER_USER não pode ter tenant',
      path: ['tenantId'],
    },
  );

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .optional(),
    email: z.string().email('Email inválido').optional(),
    password: z
      .string()
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .optional(),
    role: userRoleEnum.optional(),
    tenantId: z.string().uuid('Tenant ID inválido').optional().nullable(),
    passwordConfirmation: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'SUPER_USER') {
        return data.tenantId === null || data.tenantId === undefined;
      }
      return true;
    },
    {
      message: 'SUPER_USER não pode ter tenant',
      path: ['tenantId'],
    },
  );

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
