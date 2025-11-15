# RBAC - Gerenciamento de Roles e Permissões

Este módulo implementa a camada de UI e lógica de negócio para gerenciamento de Roles e Permissões (RBAC) e cálculo/exibição de permissões efetivas de usuários.

## Componentes

- **PermissionsList**: Listagem paginada de permissões com busca e filtro por domínio
- **RolesList**: Listagem de roles com operações CRUD
- **RolePermissionsEditor**: Grid de permissões × roles com operações em lote
- **UserRolesManager**: Atribuição/remoção de roles para usuários
- **UserPermissionsOverride**: Overrides de permissões específicas do usuário
- **EffectivePermissionsView**: Visualização de permissões efetivas com estados visuais

## Como executar os testes

```bash
# Executar todos os testes
npm test

# Executar testes com UI
npm run test:ui

# Executar testes de cobertura
npm run test:coverage
```

## Integração

Os componentes utilizam `AuthApiService` para comunicação com o backend. Certifique-se de que os endpoints REST estão disponíveis conforme os contratos definidos em `lib/authApiService.ts`.
