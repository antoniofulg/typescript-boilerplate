export class RoleResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tenantId: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: Date;
}
