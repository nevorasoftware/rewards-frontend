'use client';

import { CreditCard, LayoutDashboard, LogOut, Menu, QrCode, ScanLine, Shield, Users, UsersRound, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard, roles: ['BUSINESS_OWNER'] },
  { href: '/dashboard/card', label: 'Marca y tarjeta', icon: CreditCard, roles: ['BUSINESS_OWNER'] },
  { href: '/dashboard/customers', label: 'Clientes', icon: Users, roles: ['BUSINESS_OWNER'] },
  { href: '/dashboard/scanner', label: 'Escáner', icon: ScanLine, roles: ['BUSINESS_OWNER', 'BUSINESS_STAFF'] },
  { href: '/dashboard/qr', label: 'QR de registro', icon: QrCode, roles: ['BUSINESS_OWNER'] },
  { href: '/dashboard/team', label: 'Equipo', icon: UsersRound, roles: ['BUSINESS_OWNER'] },
  { href: '/admin', label: 'Negocios', icon: Shield, roles: ['SUPER_ADMIN'] },
];

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  BUSINESS_OWNER: 'Dueño',
  BUSINESS_STAFF: 'Personal',
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const items = NAV.filter((item) => item.roles.includes(user.role));
  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          aria-current={isActive(href) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive(href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-auto space-y-3 border-t pt-4">
      <div className="px-1 text-sm">
        <p className="truncate font-semibold">{user.business?.name ?? 'Plataforma'}</p>
        <p className="truncate text-xs text-muted-foreground">
          {user.email} · {ROLE_LABEL[user.role]}
        </p>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground"
        onClick={() => {
          logout();
          router.replace('/login');
        }}
      >
        <LogOut aria-hidden /> Cerrar sesión
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r bg-card p-4 md:flex print-hidden">
        <Logo href={items[0]?.href ?? '/'} className="px-1 text-base" />
        {nav}
        {footer}
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:hidden print-hidden">
        <Logo href={items[0]?.href ?? '/'} className="text-base" />
        <Button variant="ghost" size="icon" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
      </header>
      {open && (
        <div className="fixed inset-x-0 top-14 z-30 flex max-h-[calc(100vh-3.5rem)] flex-col gap-4 overflow-y-auto border-b bg-card p-4 shadow-lg md:hidden">
          {nav}
          {footer}
        </div>
      )}

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print-hidden">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
