'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BellRing, Mail, Phone, SlidersHorizontal, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { use, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app-shell';
import { MessageForm } from '@/components/message-form';
import { OwnerOnly } from '@/components/owner-only';
import { StampGrid } from '@/components/stamp-grid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Badge, EmptyState, Skeleton, Table, TBody, Td, Th, THead, Tr } from '@/components/ui/misc';
import { api } from '@/lib/api';
import type { CustomerDetail, DirectNotificationResult, TransactionType } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/utils';

const TX_LABEL: Record<TransactionType, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  EARN: { label: 'Suma', variant: 'success' },
  REDEEM: { label: 'Canje', variant: 'default' },
  ADJUST: { label: 'Ajuste', variant: 'warning' },
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <OwnerOnly>
      <Detail id={use(params).id} />
    </OwnerOnly>
  );
}

function Detail({ id }: { id: string }) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['customer', id], queryFn: () => api<CustomerDetail>(`/customers/${id}`) });
  const [adjustSerial, setAdjustSerial] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [messageOpen, setMessageOpen] = useState(false);

  const sendMessage = useMutation({
    mutationFn: (input: { title: string; body: string }) =>
      api<DirectNotificationResult>(`/notifications/customers/${id}`, { method: 'POST', body: input }),
    onSuccess: (r) => {
      if (r.delivered) {
        const where = [r.webSent ? 'su teléfono' : null, r.appleSent ? 'Apple Wallet' : null]
          .filter(Boolean)
          .join(', ');
        toast.success('Mensaje enviado', { description: `Entregado en ${where}.` });
        setMessageOpen(false);
      } else {
        toast.error('No se pudo entregar', { description: 'El cliente no ha activado los avisos en su tarjeta.' });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const adjust = useMutation({
    mutationFn: () =>
      api(`/cards/${encodeURIComponent(adjustSerial!)}/adjust`, {
        method: 'POST',
        body: { amount: Math.trunc(Number(amount)), note: note.trim() },
      }),
    onSuccess: () => {
      toast.success('Ajuste aplicado');
      setAdjustSerial(null);
      setAmount('');
      setNote('');
      qc.invalidateQueries({ queryKey: ['customer', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (e) => toast.error(e.message),
  });

  function onAdjust(e: FormEvent) {
    e.preventDefault();
    if (!Number(amount) || note.trim().length < 2) {
      toast.error('Indica una cantidad distinta de cero y el motivo');
      return;
    }
    adjust.mutate();
  }

  if (query.isLoading) return <Skeleton className="h-96" />;
  if (query.isError) return <p className="text-destructive">{query.error.message}</p>;
  const customer = query.data!;
  const reachable = customer.cards.some((c) => c.status === 'ACTIVE' && (c._count.appleRegistrations > 0 || c._count.pushSubscriptions > 0));

  return (
    <>
      <Link href="/dashboard/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Clientes
      </Link>
      <PageHeader title={customer.name} description={`Cliente desde ${formatDate(customer.createdAt)}`} />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-5 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" aria-hidden /> {customer.email ?? 'Sin email'}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" aria-hidden /> {customer.phone ?? 'Sin teléfono'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                disabled={!reachable}
                title={reachable ? undefined : 'El cliente no ha activado los avisos en su tarjeta'}
                onClick={() => setMessageOpen(true)}
              >
                <BellRing aria-hidden /> Enviar notificación
              </Button>
            </CardContent>
          </Card>

          {customer.cards.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{card.program.name}</CardTitle>
                  <Badge variant={card.status === 'ACTIVE' ? 'success' : 'destructive'}>{card.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}</Badge>
                </div>
                <p className="font-mono text-xs text-muted-foreground">{card.serialNumber}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {card.program.type === 'STAMPS' ? (
                  <>
                    <p className="text-2xl font-bold">
                      {card.stamps} <span className="text-base font-normal text-muted-foreground">/ {card.program.stampsRequired} sellos</span>
                    </p>
                    <StampGrid stamps={card.stamps} required={card.program.stampsRequired} />
                  </>
                ) : (
                  <p className="text-2xl font-bold">
                    {formatNumber(card.balance)} <span className="text-base font-normal text-muted-foreground">puntos</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant={card._count.appleRegistrations > 0 ? 'success' : 'secondary'}>
                    <Smartphone className="mr-1 h-3 w-3" aria-hidden />
                    Apple: {card._count.appleRegistrations > 0 ? `${card._count.appleRegistrations} dispositivo(s)` : 'no instalada'}
                  </Badge>
                  <Badge variant={card.googleObjectId ? 'success' : 'secondary'}>Google: {card.googleObjectId ? 'emitida' : 'no emitida'}</Badge>
                  <Badge variant={card._count.pushSubscriptions > 0 ? 'success' : 'secondary'}>
                    Avisos: {card._count.pushSubscriptions > 0 ? 'activados' : 'no activados'}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => setAdjustSerial(card.serialNumber)}>
                  <SlidersHorizontal aria-hidden /> Ajuste manual
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Historial de transacciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {customer.cards.every((c) => c.transactions.length === 0) ? (
              <div className="p-5">
                <EmptyState title="Sin movimientos" description="Las sumas y canjes aparecerán aquí." />
              </div>
            ) : (
              <Table>
                <THead>
                  <Tr>
                    <Th>Fecha</Th>
                    <Th>Tipo</Th>
                    <Th className="text-right">Cantidad</Th>
                    <Th className="hidden md:table-cell">Nota</Th>
                    <Th className="hidden lg:table-cell">Registrado por</Th>
                  </Tr>
                </THead>
                <TBody>
                  {customer.cards.flatMap((card) =>
                    card.transactions.map((tx) => {
                      const unit = card.program.type === 'STAMPS' ? 'sellos' : 'pts';
                      const signed = tx.type === 'REDEEM' ? -tx.amount : tx.amount;
                      return (
                        <Tr key={tx.id}>
                          <Td className="whitespace-nowrap text-muted-foreground">{formatDate(tx.createdAt, true)}</Td>
                          <Td>
                            <Badge variant={TX_LABEL[tx.type].variant}>{TX_LABEL[tx.type].label}</Badge>
                          </Td>
                          <Td className={`text-right font-semibold ${signed < 0 ? 'text-destructive' : 'text-success'}`}>
                            {signed > 0 ? '+' : ''}
                            {formatNumber(signed)} {unit}
                          </Td>
                          <Td className="hidden max-w-xs truncate text-muted-foreground md:table-cell">{tx.note ?? '—'}</Td>
                          <Td className="hidden text-muted-foreground lg:table-cell">{tx.staffUser?.email ?? '—'}</Td>
                        </Tr>
                      );
                    }),
                  )}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notificación para {customer.name}</DialogTitle>
            <DialogDescription>Le llega como aviso emergente en su teléfono.</DialogDescription>
          </DialogHeader>
          <MessageForm
            idPrefix="direct"
            submitLabel="Enviar"
            loading={sendMessage.isPending}
            onSubmit={(input, reset) => sendMessage.mutate(input, { onSuccess: (r) => r.delivered && reset() })}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(adjustSerial)} onOpenChange={(open) => !open && setAdjustSerial(null)}>
        <DialogContent>
          <form onSubmit={onAdjust} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Ajuste manual</DialogTitle>
              <DialogDescription>Usa un número negativo para restar. Queda registrado en el historial.</DialogDescription>
            </DialogHeader>
            <Field label="Cantidad" htmlFor="adj-amount">
              <Input id="adj-amount" type="number" step={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej.: 2 o -1" />
            </Field>
            <Field label="Motivo" htmlFor="adj-note">
              <Input id="adj-note" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Ej.: compensación por error" />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustSerial(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={adjust.isPending}>
                Aplicar ajuste
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
