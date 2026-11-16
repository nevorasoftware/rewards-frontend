'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge, EmptyState, Skeleton, Table, TBody, Td, Th, THead, Tr } from '@/components/ui/misc';
import { api } from '@/lib/api';
import type { AdminBusiness } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/utils';

interface PlatformStats {
  businesses: number;
  activeBusinesses: number;
  cards: number;
  transactions: number;
}

export default function AdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const businesses = useQuery({ queryKey: ['admin', 'businesses'], queryFn: () => api<AdminBusiness[]>('/admin/businesses') });
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api<PlatformStats>('/admin/stats') });

  const toggle = useMutation({
    mutationFn: (b: AdminBusiness) => api(`/admin/businesses/${b.id}/status`, { method: 'PATCH', body: { isActive: !b.isActive } }),
    onSuccess: (_, b) => {
      toast.success(b.isActive ? `${b.name} desactivado` : `${b.name} activado`);
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (businesses.data ?? []).filter(
      (b) => !q || b.name.toLowerCase().includes(q) || b.slug.includes(q) || b.ownerEmail?.toLowerCase().includes(q),
    );
  }, [businesses.data, search]);

  const tiles = stats.data
    ? [
        { label: 'Negocios', value: stats.data.businesses },
        { label: 'Negocios activos', value: stats.data.activeBusinesses },
        { label: 'Tarjetas emitidas', value: stats.data.cards },
        { label: 'Transacciones', value: stats.data.transactions },
      ]
    : [];

  return (
    <>
      <PageHeader title="Negocios" description="Administra los negocios de la plataforma." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.data
          ? tiles.map((t) => (
              <Card key={t.label}>
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground">{t.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums">{formatNumber(t.value)}</p>
                </CardContent>
              </Card>
            ))
          : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" aria-label="Buscar negocios" placeholder="Buscar por nombre, slug o email" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        {businesses.isLoading ? (
          <Skeleton className="m-4 h-40" />
        ) : businesses.isError ? (
          <p className="p-6 text-destructive">{businesses.error.message}</p>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title="Sin negocios" />
          </div>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Negocio</Th>
                <Th className="hidden md:table-cell">Dueño</Th>
                <Th className="text-right">Clientes</Th>
                <Th className="hidden lg:table-cell">Creado</Th>
                <Th>Estado</Th>
                <Th>
                  <span className="sr-only">Acciones</span>
                </Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((b) => (
                <Tr key={b.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-black/10" style={{ background: b.backgroundColor }} aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{b.name}</p>
                        <a href={`/join/${b.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
                          /join/{b.slug} <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      </div>
                    </div>
                  </Td>
                  <Td className="hidden text-muted-foreground md:table-cell">{b.ownerEmail ?? '—'}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(b._count.customers)}</Td>
                  <Td className="hidden text-muted-foreground lg:table-cell">{formatDate(b.createdAt)}</Td>
                  <Td>
                    <Badge variant={b.isActive ? 'success' : 'destructive'}>{b.isActive ? 'Activo' : 'Inactivo'}</Badge>
                  </Td>
                  <Td className="text-right">
                    <Button
                      size="sm"
                      variant={b.isActive ? 'outline' : 'default'}
                      loading={toggle.isPending && toggle.variables?.id === b.id}
                      onClick={() => {
                        if (b.isActive && !confirm(`¿Desactivar ${b.name}? Sus usuarios no podrán entrar y las tarjetas quedarán inactivas.`)) return;
                        toggle.mutate(b);
                      }}
                    >
                      {b.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
