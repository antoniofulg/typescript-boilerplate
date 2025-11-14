-- Seed script determinístico em SQL (PostgreSQL)
-- Este script popula o banco com as estruturas canônicas de RBAC e dados de exemplo
-- Usa UUIDs explícitos para garantir determinismo
--
-- IMPORTANTE: Os password hashes são placeholders - devem ser trocados antes de produção!
-- IMPORTANTE: Execute este script apenas se preferir usar SQL raw ao invés do seed.ts
--
-- Execute com: psql -d sua_database -f prisma/seed.sql
-- Ou importe via pgAdmin/outra ferramenta PostgreSQL

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Upsert de todas as permissions por key (idempotente)

INSERT INTO permissions (id, key, name, description, created_at)
VALUES
  ('00000000-0000-0001-0000-000000000001', 'tenant:create', 'Create Tenant', 'Create new tenants', NOW()),
  ('00000000-0000-0001-0000-000000000002', 'tenant:read', 'Read Tenant', 'View tenant information', NOW()),
  ('00000000-0000-0001-0000-000000000003', 'tenant:delete', 'Delete Tenant', 'Delete tenants', NOW()),
  ('00000000-0000-0001-0000-000000000004', 'user:create', 'Create User', 'Create new users', NOW()),
  ('00000000-0000-0001-0000-000000000005', 'user:manage', 'Manage User', 'Manage user accounts', NOW()),
  ('00000000-0000-0001-0000-000000000006', 'user:read', 'Read User', 'View user information', NOW()),
  ('00000000-0000-0001-0000-000000000007', 'agenda:create', 'Create Agenda', 'Create agenda items', NOW()),
  ('00000000-0000-0001-0000-000000000008', 'agenda:edit:any', 'Edit Any Agenda', 'Edit any agenda item', NOW()),
  ('00000000-0000-0001-0000-000000000009', 'agenda:edit:own', 'Edit Own Agenda', 'Edit own agenda items', NOW()),
  ('00000000-0000-0001-0000-000000000010', 'agenda:approve', 'Approve Agenda', 'Approve agenda items', NOW()),
  ('00000000-0000-0001-0000-000000000011', 'session:open', 'Open Session', 'Open voting sessions', NOW()),
  ('00000000-0000-0001-0000-000000000012', 'session:preside', 'Preside Session', 'Preside over sessions', NOW()),
  ('00000000-0000-0001-0000-000000000013', 'vote:record', 'Record Vote', 'Record votes', NOW()),
  ('00000000-0000-0001-0000-000000000014', 'vote:view', 'View Vote', 'View voting results', NOW()),
  ('00000000-0000-0001-0000-000000000015', 'attendance:record', 'Record Attendance', 'Record attendance', NOW()),
  ('00000000-0000-0001-0000-000000000016', 'attendance:view:own', 'View Own Attendance', 'View own attendance records', NOW()),
  ('00000000-0000-0001-0000-000000000017', 'document:upload', 'Upload Document', 'Upload documents', NOW()),
  ('00000000-0000-0001-0000-000000000018', 'document:read', 'Read Document', 'Read documents', NOW()),
  ('00000000-0000-0001-0000-000000000019', 'report:export', 'Export Report', 'Export reports', NOW()),
  ('00000000-0000-0001-0000-000000000020', 'report:view', 'View Report', 'View reports', NOW()),
  ('00000000-0000-0001-0000-000000000021', 'public:read', 'Public Read', 'Read public information', NOW()),
  ('00000000-0000-0001-0000-000000000022', 'audit:view', 'View Audit', 'View audit logs', NOW()),
  ('00000000-0000-0001-0000-000000000023', 'profile:edit_own', 'Edit Own Profile', 'Edit own user profile', NOW())
ON CONFLICT (key) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ============================================================================
-- ROLES (globais, tenant_id = null)
-- ============================================================================
-- Upsert de todas as roles por slug (idempotente)
-- Slugs convertidos de snake_case para kebab-case

INSERT INTO roles (id, name, slug, description, tenant_id, created_at)
VALUES
  ('00000000-0000-0002-0000-000000000001', 'Super User', 'super-user', 'Super user role with full system access', NULL, NOW()),
  ('00000000-0000-0002-0000-000000000002', 'Admin Chamber', 'admin-chamber', 'Administrator for chamber operations', NULL, NOW()),
  ('00000000-0000-0002-0000-000000000003', 'Editor', 'editor', 'Editor role for content management', NULL, NOW()),
  ('00000000-0000-0002-0000-000000000004', 'Viewer', 'viewer', 'Viewer role with read-only access', NULL, NOW()),
  ('00000000-0000-0002-0000-000000000005', 'Council Member', 'council-member', 'Role for council members', NULL, NOW()),
  ('00000000-0000-0002-0000-000000000006', 'Chamber President', 'chamber-president', 'Role for chamber president', NULL, NOW()),
  ('00000000-0000-0002-0000-000000000007', 'Public', 'public', 'Public access role', NULL, NOW())
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tenant_id = EXCLUDED.tenant_id;

-- ============================================================================
-- ROLE PERMISSIONS
-- ============================================================================
-- Deletar associações existentes e recriar conforme mapeamento

-- Deletar todas as associações existentes para sincronização
DELETE FROM role_permissions;

-- Super User: todas as permissions
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT '00000000-0000-0002-0000-000000000001', id, NOW()
FROM permissions;

-- Admin Chamber: user:create, user:manage, user:read, agenda:approve, document:upload, document:read, report:view, report:export, audit:view
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT '00000000-0000-0002-0000-000000000002', id, NOW()
FROM permissions
WHERE key IN ('user:create', 'user:manage', 'user:read', 'agenda:approve', 'document:upload', 'document:read', 'report:view', 'report:export', 'audit:view');

-- Editor: agenda:create, agenda:edit:own, vote:record, attendance:record, document:upload
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT '00000000-0000-0002-0000-000000000003', id, NOW()
FROM permissions
WHERE key IN ('agenda:create', 'agenda:edit:own', 'vote:record', 'attendance:record', 'document:upload');

-- Viewer: document:read, report:view, public:read
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT '00000000-0000-0002-0000-000000000004', id, NOW()
FROM permissions
WHERE key IN ('document:read', 'report:view', 'public:read');

-- Council Member: vote:view, attendance:view:own, document:read, profile:edit_own
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT '00000000-0000-0002-0000-000000000005', id, NOW()
FROM permissions
WHERE key IN ('vote:view', 'attendance:view:own', 'document:read', 'profile:edit_own');

-- Chamber President: session:open, session:preside, agenda:approve, report:view
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT '00000000-0000-0002-0000-000000000006', id, NOW()
FROM permissions
WHERE key IN ('session:open', 'session:preside', 'agenda:approve', 'report:view');

-- Public: public:read, document:read
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT '00000000-0000-0002-0000-000000000007', id, NOW()
FROM permissions
WHERE key IN ('public:read', 'document:read');

-- ============================================================================
-- TENANT
-- ============================================================================
-- Tenant de exemplo "Sample City"

INSERT INTO tenants (id, name, slug, status, created_at)
VALUES
  ('00000000-0000-0003-0000-000000000001', 'Sample City', 'sample-city', 'ACTIVE', NOW())
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- ============================================================================
-- USERS
-- ============================================================================
-- Super User (global, tenant_id = null)
-- Admin Chamber (vinculado ao tenant)

-- Placeholder password hash - DEVE SER TROCADO ANTES DE PRODUÇÃO!
-- Este hash corresponde a "placeholder"
DO $$
DECLARE
  placeholder_hash TEXT := '$2b$10$placeholder.hash.should.be.replaced.before.production.01234567890123456789012';
  super_user_id UUID := '00000000-0000-0004-0000-000000000001';
  admin_chamber_id UUID := '00000000-0000-0004-0000-000000000002';
  tenant_sample_city_id UUID := '00000000-0000-0003-0000-000000000001';
  role_super_user_id UUID := '00000000-0000-0002-0000-000000000001';
  role_admin_chamber_id UUID := '00000000-0000-0002-0000-000000000002';
BEGIN
  -- Super User
  INSERT INTO users (id, tenant_id, name, email, password_hash, token_version, created_at)
  VALUES (super_user_id, NULL, 'Super User', 'super.user@voto-inteligente.com', placeholder_hash, 0, NOW())
  ON CONFLICT (tenant_id, email) DO UPDATE
  SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash;

  -- Atribuir role super-user
  INSERT INTO user_roles (user_id, role_id, granted_by, granted_at)
  VALUES (super_user_id, role_super_user_id, super_user_id, NOW())
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Admin Chamber
  INSERT INTO users (id, tenant_id, name, email, password_hash, token_version, created_at)
  VALUES (admin_chamber_id, tenant_sample_city_id, 'Admin Chamber', 'admin@sample-city.gov', placeholder_hash, 0, NOW())
  ON CONFLICT (tenant_id, email) DO UPDATE
  SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash;

  -- Atribuir role admin-chamber
  INSERT INTO user_roles (user_id, role_id, granted_by, granted_at)
  VALUES (admin_chamber_id, role_admin_chamber_id, super_user_id, NOW())
  ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;

-- ============================================================================
-- POLITICAL POSITION
-- ============================================================================
-- Political Position de exemplo "Chamber President"

INSERT INTO political_positions (id, name, description, level, tenant_id, created_at)
VALUES
  ('00000000-0000-0005-0000-000000000001', 'Chamber President', 'President of the chamber', 'municipal', '00000000-0000-0003-0000-000000000001', NOW())
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  tenant_id = EXCLUDED.tenant_id;

-- ============================================================================
-- COUNCIL MEMBER
-- ============================================================================
-- Council Member de exemplo vinculado ao tenant e ao admin user

INSERT INTO council_members (id, user_id, position_id, tenant_id, start_date, end_date, status, created_at)
VALUES
  (
    '00000000-0000-0006-0000-000000000001',
    '00000000-0000-0004-0000-000000000002', -- admin_chamber user
    '00000000-0000-0005-0000-000000000001', -- chamber_president position
    '00000000-0000-0003-0000-000000000001', -- sample-city tenant
    '2024-01-01',
    NULL,
    'active',
    NOW()
  )
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  position_id = EXCLUDED.position_id,
  tenant_id = EXCLUDED.tenant_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  status = EXCLUDED.status;

-- ============================================================================
-- RESUMO
-- ============================================================================
-- O seed foi concluído. Verifique os registros criados/atualizados:
--
-- SELECT COUNT(*) as total_permissions FROM permissions;
-- SELECT COUNT(*) as total_roles FROM roles;
-- SELECT COUNT(*) as total_role_permissions FROM role_permissions;
-- SELECT COUNT(*) as total_tenants FROM tenants;
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_positions FROM political_positions;
-- SELECT COUNT(*) as total_council_members FROM council_members;
--
-- ⚠️  IMPORTANTE: Troque os password hashes antes de usar em produção!

