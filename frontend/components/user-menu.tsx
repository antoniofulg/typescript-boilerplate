'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { user, token, logout, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Show loading state during actual loading
  if (loading) {
    return (
      <Button
        variant="ghost"
        className="relative size-10 rounded-full"
        disabled
      >
        <Avatar className="size-10">
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  // If we have a token but no user yet, show loading (user is being fetched)
  if (token && !user) {
    return (
      <Button
        variant="ghost"
        className="relative size-10 rounded-full"
        disabled
      >
        <Avatar className="size-10">
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  // Only show "Entrar" if user is not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" onClick={() => router.push('/auth')}>
        <User className="mr-2 size-4" />
        Entrar
      </Button>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'SUPER_USER' || role === 'ADMIN') return 'default';
    if (role === 'OPERATOR') return 'secondary';
    return 'outline';
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-10 rounded-full cursor-pointer"
        >
          <Avatar className="size-10">
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="pt-1">
              <Badge
                variant={getRoleBadgeVariant(user.role)}
                className="text-xs"
              >
                {user.role}
              </Badge>
              {user.tenant && (
                <Badge variant="outline" className="ml-1 text-xs">
                  {user.tenant.name}
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/')}>
          <User className="mr-2 size-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings className="mr-2 size-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 size-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
