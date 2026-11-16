'use client';

import { PageHeader } from '@/components/app-shell';
import { OwnerOnly } from '@/components/owner-only';

export default function DashboardPage() {
  return (
    <OwnerOnly>
      <PageHeader title="Resumen" description="Métricas de tu programa de recompensas." />
    </OwnerOnly>
  );
}
