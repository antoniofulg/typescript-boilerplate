'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { TenantStatus } from '@/types/tenant';

type TenantsFiltersProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: TenantStatus | 'ALL';
  onStatusFilterChange: (status: TenantStatus | 'ALL') => void;
};

export function TenantsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: TenantsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por nome ou slug..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange(value as TenantStatus | 'ALL')
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="INACTIVE">Inativo</SelectItem>
            <SelectItem value="SUSPENDED">Suspenso</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
