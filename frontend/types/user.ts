export type UserRole = 'SUPER_USER' | 'ADMIN' | 'OPERATOR' | 'USER';

export type User = {
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
  createdAt: string;
};

export type CreateUserDto = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  tenantId?: string;
  passwordConfirmation?: string;
};

export type UpdateUserDto = {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  tenantId?: string;
  passwordConfirmation?: string;
};
