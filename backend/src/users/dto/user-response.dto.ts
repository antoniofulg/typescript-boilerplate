import { UserRole } from '@prisma/client';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null;
  createdAt: Date;
}
