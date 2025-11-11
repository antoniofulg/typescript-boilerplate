import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create super admin
  const superAdminPassword = 'admin';
  const saltRounds = 10;
  const superAdminPasswordHash = await bcrypt.hash(
    superAdminPassword,
    saltRounds,
  );

  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'admin@voto-inteligente.com' },
    update: {},
    create: {
      name: 'Super Administrador',
      email: 'admin@voto-inteligente.com',
      passwordHash: superAdminPasswordHash,
    },
  });

  console.log('✅ Created super admin:', {
    email: superAdmin.email,
    name: superAdmin.name,
    password: superAdminPassword, // Log apenas para desenvolvimento
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
