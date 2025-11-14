'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  menuItems,
  filterMenuItemsByRole,
  groupMenuItemsBySection,
} from '@/lib/menu-config';
import type { UserRole } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';

type SidebarProps = {
  user: { role: UserRole } | null;
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Filtrar itens do menu baseado no role do usuário
  const filteredItems = filterMenuItemsByRole(menuItems, user?.role);

  // Agrupar por seção
  const groupedItems = groupMenuItemsBySection(filteredItems);

  // Garantir que o componente está montado no cliente antes de usar pathname
  // This is a common pattern to avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleLinkClick = () => {
    setIsMobileOpen(false);
  };

  const isActive = (path: string) => {
    if (!mounted) return false;
    return pathname === path;
  };

  const renderMenuItems = (items: typeof menuItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.path);

      return (
        <Button
          key={item.id}
          variant={mounted && active ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start gap-3',
            mounted && active && 'bg-accent font-medium',
          )}
          asChild
        >
          <Link href={item.path} onClick={handleLinkClick}>
            <Icon className="size-5" />
            <span>{item.label}</span>
          </Link>
        </Button>
      );
    });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2 px-2 py-4">
        <h2 className="text-lg font-semibold">Menu</h2>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section} className="space-y-1">
            {renderMenuItems(items)}
          </div>
        ))}
      </nav>
    </div>
  );

  // Renderizar placeholder no servidor para evitar problemas de hidratação
  if (!mounted) {
    return (
      <>
        {/* Desktop Sidebar - Placeholder */}
        <aside
          className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background"
          suppressHydrationWarning
        >
          <div className="flex h-full flex-col gap-4 p-4">
            <div className="flex items-center gap-2 px-2 py-4">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <Separator />
            <nav className="flex-1 space-y-1">
              {Object.entries(groupedItems).map(([section, items]) => (
                <div key={section} className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className="w-full justify-start gap-3"
                        asChild
                      >
                        <Link href={item.path}>
                          <Icon className="size-5" />
                          <span>{item.label}</span>
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border"
              suppressHydrationWarning
            >
              <Menu className="size-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-0"
            suppressHydrationWarning
          >
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SheetDescription className="sr-only">
              Navegue entre as páginas da aplicação
            </SheetDescription>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="size-5" />
                <span className="sr-only">Fechar menu</span>
              </Button>
            </div>
            <div className="flex h-[calc(100vh-73px)] flex-col gap-4 p-4 overflow-y-auto">
              <Separator />
              <nav className="flex-1 space-y-1">
                {Object.entries(groupedItems).map(([section, items]) => (
                  <div key={section} className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.id}
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          asChild
                        >
                          <Link href={item.path} onClick={handleLinkClick}>
                            <Icon className="size-5" />
                            <span>{item.label}</span>
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background"
        suppressHydrationWarning
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border"
            suppressHydrationWarning
          >
            <Menu className="size-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0" suppressHydrationWarning>
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Navegue entre as páginas da aplicação
          </SheetDescription>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="size-5" />
              <span className="sr-only">Fechar menu</span>
            </Button>
          </div>
          <div className="flex h-[calc(100vh-73px)] flex-col gap-4 p-4 overflow-y-auto">
            <Separator />
            <nav className="flex-1 space-y-1">
              {Object.entries(groupedItems).map(([section, items]) => (
                <div key={section} className="space-y-1">
                  {renderMenuItems(items)}
                </div>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
