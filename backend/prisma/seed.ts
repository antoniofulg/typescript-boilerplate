import { PrismaClient } from '@prisma/client';
import * as rolesPermissions from './rolesPermissions.json';

const prisma = new PrismaClient();

/**
 * Seed script determinístico para popular o banco com:
 * - Permissions canônicas (RBAC)
 * - Roles globais
 * - Mapeamentos role_permissions
 * - Tenant, users, political positions e council members de exemplo
 *
 * IMPORTANTE: Este script usa UUIDs explícitos para garantir determinismo.
 * IMPORTANTE: Os password hashes são placeholders - devem ser trocados antes de produção!
 *
 * Execute com: npx prisma db seed ou npm run prisma:seed
 */

// UUIDs determinísticos para todas as entidades
const UUIDs = {
  // Permissions
  PERM_TENANT_CREATE: '00000000-0000-0001-0000-000000000001',
  PERM_TENANT_READ: '00000000-0000-0001-0000-000000000002',
  PERM_TENANT_DELETE: '00000000-0000-0001-0000-000000000003',
  PERM_USER_CREATE: '00000000-0000-0001-0000-000000000004',
  PERM_USER_MANAGE: '00000000-0000-0001-0000-000000000005',
  PERM_USER_READ: '00000000-0000-0001-0000-000000000006',
  PERM_AGENDA_CREATE: '00000000-0000-0001-0000-000000000007',
  PERM_AGENDA_EDIT_ANY: '00000000-0000-0001-0000-000000000008',
  PERM_AGENDA_EDIT_OWN: '00000000-0000-0001-0000-000000000009',
  PERM_AGENDA_APPROVE: '00000000-0000-0001-0000-000000000010',
  PERM_SESSION_OPEN: '00000000-0000-0001-0000-000000000011',
  PERM_SESSION_PRESIDE: '00000000-0000-0001-0000-000000000012',
  PERM_VOTE_RECORD: '00000000-0000-0001-0000-000000000013',
  PERM_VOTE_VIEW: '00000000-0000-0001-0000-000000000014',
  PERM_ATTENDANCE_RECORD: '00000000-0000-0001-0000-000000000015',
  PERM_ATTENDANCE_VIEW_OWN: '00000000-0000-0001-0000-000000000016',
  PERM_DOCUMENT_UPLOAD: '00000000-0000-0001-0000-000000000017',
  PERM_DOCUMENT_READ: '00000000-0000-0001-0000-000000000018',
  PERM_REPORT_EXPORT: '00000000-0000-0001-0000-000000000019',
  PERM_REPORT_VIEW: '00000000-0000-0001-0000-000000000020',
  PERM_PUBLIC_READ: '00000000-0000-0001-0000-000000000021',
  PERM_AUDIT_VIEW: '00000000-0000-0001-0000-000000000022',
  PERM_PROFILE_EDIT_OWN: '00000000-0000-0001-0000-000000000023',

  // Roles
  ROLE_SUPER_USER: '00000000-0000-0002-0000-000000000001',
  ROLE_ADMIN_CHAMBER: '00000000-0000-0002-0000-000000000002',
  ROLE_EDITOR: '00000000-0000-0002-0000-000000000003',
  ROLE_VIEWER: '00000000-0000-0002-0000-000000000004',
  ROLE_COUNCIL_MEMBER: '00000000-0000-0002-0000-000000000005',
  ROLE_CHAMBER_PRESIDENT: '00000000-0000-0002-0000-000000000006',
  ROLE_PUBLIC: '00000000-0000-0002-0000-000000000007',

  // Tenant
  TENANT_SAMPLE_CITY: '00000000-0000-0003-0000-000000000001',

  // Users
  USER_SUPER_USER: '00000000-0000-0004-0000-000000000001',
  USER_ADMIN_CHAMBER: '00000000-0000-0004-0000-000000000002',

  // Political Position
  POSITION_CHAMBER_PRESIDENT: '00000000-0000-0005-0000-000000000001',

  // Council Member
  COUNCIL_MEMBER_1: '00000000-0000-0006-0000-000000000001',
} as const;

// Placeholder password hash - DEVE SER TROCADO ANTES DE PRODUÇÃO!
// Este hash corresponde a "placeholder" - use um hash real em produção
const PLACEHOLDER_PASSWORD_HASH =
  '$2b$10$placeholder.hash.should.be.replaced.before.production.01234567890123456789012';

// Definir todas as permissions com seus metadados
const PERMISSIONS = [
  {
    id: UUIDs.PERM_TENANT_CREATE,
    key: 'tenant:create',
    name: 'Create Tenant',
    description: 'Create new tenants',
  },
  {
    id: UUIDs.PERM_TENANT_READ,
    key: 'tenant:read',
    name: 'Read Tenant',
    description: 'View tenant information',
  },
  {
    id: UUIDs.PERM_TENANT_DELETE,
    key: 'tenant:delete',
    name: 'Delete Tenant',
    description: 'Delete tenants',
  },
  {
    id: UUIDs.PERM_USER_CREATE,
    key: 'user:create',
    name: 'Create User',
    description: 'Create new users',
  },
  {
    id: UUIDs.PERM_USER_MANAGE,
    key: 'user:manage',
    name: 'Manage User',
    description: 'Manage user accounts',
  },
  {
    id: UUIDs.PERM_USER_READ,
    key: 'user:read',
    name: 'Read User',
    description: 'View user information',
  },
  {
    id: UUIDs.PERM_AGENDA_CREATE,
    key: 'agenda:create',
    name: 'Create Agenda',
    description: 'Create agenda items',
  },
  {
    id: UUIDs.PERM_AGENDA_EDIT_ANY,
    key: 'agenda:edit:any',
    name: 'Edit Any Agenda',
    description: 'Edit any agenda item',
  },
  {
    id: UUIDs.PERM_AGENDA_EDIT_OWN,
    key: 'agenda:edit:own',
    name: 'Edit Own Agenda',
    description: 'Edit own agenda items',
  },
  {
    id: UUIDs.PERM_AGENDA_APPROVE,
    key: 'agenda:approve',
    name: 'Approve Agenda',
    description: 'Approve agenda items',
  },
  {
    id: UUIDs.PERM_SESSION_OPEN,
    key: 'session:open',
    name: 'Open Session',
    description: 'Open voting sessions',
  },
  {
    id: UUIDs.PERM_SESSION_PRESIDE,
    key: 'session:preside',
    name: 'Preside Session',
    description: 'Preside over sessions',
  },
  {
    id: UUIDs.PERM_VOTE_RECORD,
    key: 'vote:record',
    name: 'Record Vote',
    description: 'Record votes',
  },
  {
    id: UUIDs.PERM_VOTE_VIEW,
    key: 'vote:view',
    name: 'View Vote',
    description: 'View voting results',
  },
  {
    id: UUIDs.PERM_ATTENDANCE_RECORD,
    key: 'attendance:record',
    name: 'Record Attendance',
    description: 'Record attendance',
  },
  {
    id: UUIDs.PERM_ATTENDANCE_VIEW_OWN,
    key: 'attendance:view:own',
    name: 'View Own Attendance',
    description: 'View own attendance records',
  },
  {
    id: UUIDs.PERM_DOCUMENT_UPLOAD,
    key: 'document:upload',
    name: 'Upload Document',
    description: 'Upload documents',
  },
  {
    id: UUIDs.PERM_DOCUMENT_READ,
    key: 'document:read',
    name: 'Read Document',
    description: 'Read documents',
  },
  {
    id: UUIDs.PERM_REPORT_EXPORT,
    key: 'report:export',
    name: 'Export Report',
    description: 'Export reports',
  },
  {
    id: UUIDs.PERM_REPORT_VIEW,
    key: 'report:view',
    name: 'View Report',
    description: 'View reports',
  },
  {
    id: UUIDs.PERM_PUBLIC_READ,
    key: 'public:read',
    name: 'Public Read',
    description: 'Read public information',
  },
  {
    id: UUIDs.PERM_AUDIT_VIEW,
    key: 'audit:view',
    name: 'View Audit',
    description: 'View audit logs',
  },
  {
    id: UUIDs.PERM_PROFILE_EDIT_OWN,
    key: 'profile:edit_own',
    name: 'Edit Own Profile',
    description: 'Edit own user profile',
  },
] as const;

// Definir todas as roles globais (tenant_id = null)
// Slugs convertidos de snake_case para kebab-case conforme validação do schema
const ROLES = [
  {
    id: UUIDs.ROLE_SUPER_USER,
    name: 'Super User',
    slug: 'super-user',
    description: 'Super user role with full system access',
    tenantId: null,
  },
  {
    id: UUIDs.ROLE_ADMIN_CHAMBER,
    name: 'Admin Chamber',
    slug: 'admin-chamber',
    description: 'Administrator for chamber operations',
    tenantId: null,
  },
  {
    id: UUIDs.ROLE_EDITOR,
    name: 'Editor',
    slug: 'editor',
    description: 'Editor role for content management',
    tenantId: null,
  },
  {
    id: UUIDs.ROLE_VIEWER,
    name: 'Viewer',
    slug: 'viewer',
    description: 'Viewer role with read-only access',
    tenantId: null,
  },
  {
    id: UUIDs.ROLE_COUNCIL_MEMBER,
    name: 'Council Member',
    slug: 'council-member',
    description: 'Role for council members',
    tenantId: null,
  },
  {
    id: UUIDs.ROLE_CHAMBER_PRESIDENT,
    name: 'Chamber President',
    slug: 'chamber-president',
    description: 'Role for chamber president',
    tenantId: null,
  },
  {
    id: UUIDs.ROLE_PUBLIC,
    name: 'Public',
    slug: 'public',
    description: 'Public access role',
    tenantId: null,
  },
] as const;

/**
 * Converte nome de role de snake_case para kebab-case
 * Exemplo: admin_chamber -> admin-chamber
 */
export function snakeCaseToKebabCase(str: string): string {
  return str.replace(/_/g, '-');
}

/**
 * Converte nome de role de kebab-case para snake_case (para buscar no JSON)
 * Exemplo: admin-chamber -> admin_chamber
 */
function kebabCaseToSnakeCase(str: string): string {
  return str.replace(/-/g, '_');
}

async function seedPermissions() {
  console.log('📝 Seeding permissions...');
  const results = { created: 0, updated: 0 };

  for (const perm of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({
      where: { key: perm.key },
    });

    if (existing) {
      await prisma.permission.update({
        where: { key: perm.key },
        data: {
          name: perm.name,
          description: perm.description,
        },
      });
      results.updated++;
    } else {
      await prisma.permission.create({
        data: {
          id: perm.id,
          key: perm.key,
          name: perm.name,
          description: perm.description,
        },
      });
      results.created++;
    }
  }

  console.log(
    `✅ Permissions: ${results.created} criadas, ${results.updated} atualizadas`,
  );
  return results;
}

async function seedRoles() {
  console.log('👥 Seeding roles...');
  const results = { created: 0, updated: 0 };

  for (const role of ROLES) {
    const existing = await prisma.role.findUnique({
      where: { slug: role.slug },
    });

    if (existing) {
      await prisma.role.update({
        where: { slug: role.slug },
        data: {
          name: role.name,
          description: role.description,
          tenantId: role.tenantId,
        },
      });
      results.updated++;
    } else {
      await prisma.role.create({
        data: {
          id: role.id,
          name: role.name,
          slug: role.slug,
          description: role.description,
          tenantId: role.tenantId,
        },
      });
      results.created++;
    }
  }

  console.log(
    `✅ Roles: ${results.created} criadas, ${results.updated} atualizadas`,
  );
  return results;
}

async function seedRolePermissions() {
  console.log('🔗 Seeding role permissions mappings...');
  const results = { rolesProcessed: 0, permissionsAssigned: 0 };

  // Obter todos os IDs de permissions para criar mapeamento key -> id
  const allPermissions = await prisma.permission.findMany();
  const permissionKeyToId = new Map(allPermissions.map((p) => [p.key, p.id]));

  // Processar cada role conforme o mapeamento do JSON
  for (const role of ROLES) {
    const roleKeySnakeCase = kebabCaseToSnakeCase(role.slug);
    const permissionKeys =
      (rolesPermissions as Record<string, string[]>)[roleKeySnakeCase] || [];

    // Obter IDs das permissions para este role
    const permissionIds = permissionKeys
      .map((key) => permissionKeyToId.get(key))
      .filter((id): id is string => id !== undefined);

    if (permissionIds.length === 0) {
      console.log(`⚠️  Role ${role.slug} não tem permissions mapeadas`);
      continue;
    }

    // Obter role do banco (pode ter sido criado/atualizado)
    const dbRole = await prisma.role.findUnique({
      where: { slug: role.slug },
    });

    if (!dbRole) {
      console.log(`⚠️  Role ${role.slug} não encontrado no banco`);
      continue;
    }

    // Deletar todas as associações existentes deste role
    await prisma.rolePermission.deleteMany({
      where: { roleId: dbRole.id },
    });

    // Criar novas associações
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: dbRole.id,
        permissionId,
      })),
      skipDuplicates: true,
    });

    results.rolesProcessed++;
    results.permissionsAssigned += permissionIds.length;

    console.log(
      `  ✓ ${role.slug}: ${permissionIds.length} permissions associadas`,
    );
  }

  console.log(
    `✅ Role Permissions: ${results.rolesProcessed} roles processados, ${results.permissionsAssigned} permissões atribuídas`,
  );
  return results;
}

async function seedTenant() {
  console.log('🏛️  Seeding tenant...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'sample-city' },
    update: {
      name: 'Sample City',
      status: 'ACTIVE',
    },
    create: {
      id: UUIDs.TENANT_SAMPLE_CITY,
      name: 'Sample City',
      slug: 'sample-city',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Tenant criado/atualizado: ${tenant.name} (${tenant.slug})`);
  return tenant;
}

async function seedUsers(tenantId: string) {
  console.log('👤 Seeding users...');
  const results = { created: 0, updated: 0 };

  // Super User (global, tenant_id = null)
  const superUserRole = await prisma.role.findUnique({
    where: { slug: 'super-user' },
  });

  if (!superUserRole) {
    throw new Error('Role super-user não encontrado');
  }

  // Super User - usar findFirst pois tenantId é null (não funciona com upsert e unique composta)
  let superUser = await prisma.user.findFirst({
    where: {
      email: 'super.user@voto-inteligente.com',
      tenantId: null,
    },
  });

  if (superUser) {
    superUser = await prisma.user.update({
      where: { id: superUser.id },
      data: {
        name: 'Super User',
        passwordHash: PLACEHOLDER_PASSWORD_HASH,
      },
    });
  } else {
    superUser = await prisma.user.create({
      data: {
        id: UUIDs.USER_SUPER_USER,
        name: 'Super User',
        email: 'super.user@voto-inteligente.com',
        passwordHash: PLACEHOLDER_PASSWORD_HASH,
        tenantId: null,
      },
    });
  }

  // Atribuir role super-user
  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: superUser.id,
        roleId: superUserRole.id,
      },
    },
    update: {},
    create: {
      userId: superUser.id,
      roleId: superUserRole.id,
      grantedBy: superUser.id,
    },
  });

  console.log(
    `  ✓ Super User: ${superUser.email} (tenant: null) - ATENÇÃO: password hash é placeholder!`,
  );
  results.created++;

  // Admin Chamber (vinculado ao tenant)
  const adminChamberRole = await prisma.role.findUnique({
    where: { slug: 'admin-chamber' },
  });

  if (!adminChamberRole) {
    throw new Error('Role admin-chamber não encontrado');
  }

  const adminChamber = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenantId,
        email: 'admin@sample-city.gov',
      },
    },
    update: {
      name: 'Admin Chamber',
      passwordHash: PLACEHOLDER_PASSWORD_HASH,
    },
    create: {
      id: UUIDs.USER_ADMIN_CHAMBER,
      name: 'Admin Chamber',
      email: 'admin@sample-city.gov',
      passwordHash: PLACEHOLDER_PASSWORD_HASH,
      tenantId: tenantId,
    },
  });

  // Atribuir role admin-chamber
  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: adminChamber.id,
        roleId: adminChamberRole.id,
      },
    },
    update: {},
    create: {
      userId: adminChamber.id,
      roleId: adminChamberRole.id,
      grantedBy: superUser.id,
    },
  });

  console.log(
    `  ✓ Admin Chamber: ${adminChamber.email} (tenant: ${tenantId}) - ATENÇÃO: password hash é placeholder!`,
  );
  results.created++;

  console.log(`✅ Users: ${results.created} criados/atualizados`);
  return { superUser, adminChamber };
}

async function seedPoliticalStructure(tenantId: string, adminUserId: string) {
  console.log('🏛️  Seeding political structure...');

  // Political Position
  const position = await prisma.politicalPosition.upsert({
    where: {
      id: UUIDs.POSITION_CHAMBER_PRESIDENT,
    },
    update: {
      name: 'Chamber President',
      description: 'President of the chamber',
      level: 'municipal',
      tenantId: tenantId,
    },
    create: {
      id: UUIDs.POSITION_CHAMBER_PRESIDENT,
      name: 'Chamber President',
      description: 'President of the chamber',
      level: 'municipal',
      tenantId: tenantId,
    },
  });

  console.log(`  ✓ Political Position: ${position.name}`);

  // Council Member
  const councilMember = await prisma.councilMember.upsert({
    where: {
      id: UUIDs.COUNCIL_MEMBER_1,
    },
    update: {
      userId: adminUserId,
      positionId: position.id,
      tenantId: tenantId,
      startDate: new Date('2024-01-01'),
      endDate: null,
      status: 'active',
    },
    create: {
      id: UUIDs.COUNCIL_MEMBER_1,
      userId: adminUserId,
      positionId: position.id,
      tenantId: tenantId,
      startDate: new Date('2024-01-01'),
      endDate: null,
      status: 'active',
    },
  });

  console.log(
    `  ✓ Council Member: vinculado ao usuário ${adminUserId} na posição ${position.name}`,
  );

  console.log('✅ Political structure criada/atualizada');
  return { position, councilMember };
}

async function main() {
  console.log('🌱 Iniciando seed determinístico...');
  console.log('');
  console.log(
    '⚠️  ATENÇÃO: Este seed usa password hashes placeholders que DEVEM ser trocados antes de produção!',
  );
  console.log('');

  try {
    // Seed em ordem: permissions -> roles -> role_permissions -> tenant -> users -> political structure
    await prisma.$transaction(
      async () => {
        await seedPermissions();
        await seedRoles();
        await seedRolePermissions();
      },
      {
        timeout: 30000, // 30 segundos
      },
    );

    const tenant = await seedTenant();

    const { adminChamber } = await seedUsers(tenant.id);

    await seedPoliticalStructure(tenant.id, adminChamber.id);

    console.log('');
    console.log('✅ Seed concluído com sucesso!');
    console.log('');
    console.log('📋 Resumo:');
    console.log(`  - Permissions: ${PERMISSIONS.length} definidas`);
    console.log(`  - Roles: ${ROLES.length} definidas`);
    console.log(`  - Tenant: ${tenant.name}`);
    console.log(`  - Users: 2 criados (super_user e admin_chamber)`);
    console.log(`  - Political Position: 1 criada`);
    console.log(`  - Council Member: 1 criado`);
    console.log('');
    console.log(
      '🔒 IMPORTANTE: Troque os password hashes antes de usar em produção!',
    );
  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
