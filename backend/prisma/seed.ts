import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create super user
  const superUserEmail =
    process.env.SUPER_USER_EMAIL || 'admin@voto-inteligente.com';
  const superUserPassword = process.env.SUPER_USER_PASSWORD || 'admin';
  const saltRounds = 10;
  const superUserPasswordHash = await bcrypt.hash(
    superUserPassword,
    saltRounds,
  );

  // Check if super user already exists
  let superUser = await prisma.user.findFirst({
    where: {
      email: superUserEmail,
      tenantId: null,
    },
  });

  if (superUser) {
    // Update existing super user
    superUser = await prisma.user.update({
      where: { id: superUser.id },
      data: {
        name: 'Super Usuário',
        email: superUserEmail,
        passwordHash: superUserPasswordHash,
      },
    });
  } else {
    // Create new super user (role field removed - will be assigned via RBAC)
    superUser = await prisma.user.create({
      data: {
        name: 'Super Usuário',
        email: superUserEmail,
        passwordHash: superUserPasswordHash,
        tenantId: null,
      },
    });
  }

  // Create or get super-user role
  let superUserRole = await prisma.role.findUnique({
    where: { slug: 'super-user' },
  });

  if (!superUserRole) {
    superUserRole = await prisma.role.create({
      data: {
        name: 'Super User',
        slug: 'super-user',
        description: 'Super user role with full system access',
        tenantId: null, // Global role
      },
    });
  }

  // Assign super-user role to super user
  const existingAssignment = await prisma.userRoleAssignment.findUnique({
    where: {
      userId_roleId: {
        userId: superUser.id,
        roleId: superUserRole.id,
      },
    },
  });

  if (!existingAssignment) {
    await prisma.userRoleAssignment.create({
      data: {
        userId: superUser.id,
        roleId: superUserRole.id,
        grantedBy: superUser.id, // Self-granted for initial setup
      },
    });
  }

  console.log('✅ Created super user:', {
    email: superUser.email,
    name: superUser.name,
    password: superUserPassword, // Log apenas para desenvolvimento
  });

  // Create example tenants
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'tenant-1' },
    update: {},
    create: {
      name: 'Tenant 1',
      slug: 'tenant-1',
      status: 'ACTIVE',
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'tenant-2' },
    update: {},
    create: {
      name: 'Tenant 2',
      slug: 'tenant-2',
      status: 'ACTIVE',
    },
  });

  const tenant3 = await prisma.tenant.upsert({
    where: { slug: 'tenant-3' },
    update: {},
    create: {
      name: 'Tenant 3',
      slug: 'tenant-3',
      status: 'INACTIVE',
    },
  });

  console.log('✅ Created tenants:', {
    tenant1: tenant1.name,
    tenant2: tenant2.name,
    tenant3: tenant3.name,
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
