export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  users?: number;
};

export type CreateTenantDto = {
  name: string;
  slug: string;
};

export type UpdateTenantDto = {
  name?: string;
  slug?: string;
  status?: TenantStatus;
};
