'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-shell';
import { OwnerOnly } from '@/components/owner-only';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge, EmptyState, Skeleton, Table, TBody, Td, Th, THead, Tr } from '@/components/ui/misc';
import { api } from '@/lib/api';
import type { CardSummary, Customer, Paginated } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/utils';

const PAGE_SIZE = 20;

function cardBalance(card: CardSummary): string {
  return card.program.type === 'STAMPS' ? `${card.stamps}/${card.program.stampsRequired} sellos` : `${formatNumber(card.balance)} pts`;
}

export default function CustomersPage() {
  return (
    <OwnerOnly>
      <CustomersList />
    </OwnerOnly>
  );
}

function CustomersList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ['customers', debounced, page],
    queryFn: () =>
      api<Paginated<Customer>>(`/customers?${new URLSearchParams({ search: debounced, page: String(page), pageSize: String(PAGE_SIZE) })}`),
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader title="Clientes" description={data ? `${formatNumber(data.total)} clientes registrados` : undefined} />
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          aria-label="Buscar clientes"
          placeholder="Buscar por nombre, email, teléfono o tarjeta"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        {query.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : query.isError ? (
          <p className="p-6 text-destructive">{query.error.message}</p>
        ) : data && data.items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title={debounced ? 'Sin resultados' : 'Aún no tienes clientes'}
              description={debounced ? 'Prueba con otra búsqueda.' : 'Comparte tu QR de registro para que tus clientes obtengan su tarjeta.'}
              action={
                !debounced && (
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/dashboard/qr">Ver QR de registro</Link>
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Cliente</Th>
                <Th className="hidden md:table-cell">Contacto</Th>
                <Th>Saldo</Th>
                <Th className="hidden lg:table-cell">Tarjeta</Th>
                <Th className="hidden sm:table-cell">Registro</Th>
              </Tr>
            </THead>
            <TBody>
              {data?.items.map((c) => {
                const card = c.cards[0];
                return (
                  <Tr
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                  >
                    <Td>
                      <Link href={`/dashboard/customers/${c.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                        {c.name}
                      </Link>
                    </Td>
                    <Td className="hidden text-muted-foreground md:table-cell">{c.email ?? c.phone ?? '—'}</Td>
                    <Td>
                      {card ? (
                        <span className="flex items-center gap-2">
                          {cardBalance(card)}
                          {card.status !== 'ACTIVE' && <Badge variant="destructive">Inactiva</Badge>}
                        </span>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td className="hidden font-mono text-xs lg:table-cell">{card?.serialNumber ?? '—'}</Td>
                    <Td className="hidden text-muted-foreground sm:table-cell">{formatDate(c.createdAt)}</Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-end gap-2" aria-label="Paginación">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft aria-hidden /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Siguiente <ChevronRight aria-hidden />
          </Button>
        </nav>
      )}
    </>
  );
}
