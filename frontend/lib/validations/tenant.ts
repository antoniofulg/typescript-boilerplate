import { z } from 'zod';

const slugRegex = /^[a-z0-9-]+$/;

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(
      slugRegex,
      'Slug deve conter apenas letras minúsculas, números e hífens',
    )
    .refine(
      (val) => !val.startsWith('-') && !val.endsWith('-'),
      'Slug não pode começar ou terminar com hífen',
    )
    .refine(
      (val) => !val.includes('--'),
      'Slug não pode conter hífens consecutivos',
    ),
});

export const updateTenantSchema = createTenantSchema
  .extend({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  })
  .partial();

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;
export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;
