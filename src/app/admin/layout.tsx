'use client';

import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useRequireRole } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useRequireRole(['SUPER_ADMIN']);
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center" aria-busy>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
