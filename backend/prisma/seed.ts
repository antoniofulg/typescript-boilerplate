import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create example tenants
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'camara-exemplo-1' },
    update: {},
    create: {
      name: 'Câmara Municipal de Exemplo 1',
      slug: 'camara-exemplo-1',
      status: 'ACTIVE',
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'camara-exemplo-2' },
    update: {},
    create: {
      name: 'Câmara Municipal de Exemplo 2',
      slug: 'camara-exemplo-2',
      status: 'ACTIVE',
    },
  });

  const tenant3 = await prisma.tenant.upsert({
    where: { slug: 'camara-exemplo-3' },
    update: {},
    create: {
      name: 'Câmara Municipal de Exemplo 3',
      slug: 'camara-exemplo-3',
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
