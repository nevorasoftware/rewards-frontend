'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Info } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app-shell';
import { MessageForm } from '@/components/message-form';
import { OwnerOnly } from '@/components/owner-only';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, EmptyState, Skeleton, Table, TBody, Td, Th, THead, Tr } from '@/components/ui/misc';
import { api } from '@/lib/api';
import type { NotificationKind, NotificationSettings, NotificationsOverview, WalletNotification } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const KIND_LABEL: Record<NotificationKind, { label: string; variant: 'success' | 'default' | 'warning' | 'secondary' }> = {
  EARN: { label: 'Suma', variant: 'success' },
  REWARD: { label: 'Premio', variant: 'warning' },
  REDEEM: { label: 'Canje', variant: 'default' },
  BROADCAST: { label: 'A todos', variant: 'default' },
  DIRECT: { label: 'Directo', variant: 'secondary' },
};

const TOGGLES: { key: keyof NotificationSettings; label: string; example: string }[] = [
  { key: 'notifyOnEarn', label: 'Al sumar sellos o puntos', example: '“¡Sumaste un sello! Llevas 3/10.”' },
  { key: 'notifyOnReward', label: 'Al completar la tarjeta', example: '“¡Tu premio está listo! 🎁”' },
  { key: 'notifyOnRedeem', label: 'Al canjear la recompensa', example: '“Recompensa canjeada.”' },
];

export default function NotificationsPage() {
  return (
    <OwnerOnly>
      <Notifications />
    </OwnerOnly>
  );
}

function Notifications() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<NotificationsOverview>('/notifications'),
    // Broadcast stats are filled in background: refresh while any is still at zero.
    refetchInterval: (q) =>
      q.state.data?.items.some((n) => n.kind === 'BROADCAST' && n.googleSent + n.appleSent + n.failed < n.recipients) ? 4000 : false,
  });

  const settings = useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) =>
      api<NotificationSettings>('/notifications/settings', { method: 'PATCH', body: patch }),
    onSuccess: (data) => {
      qc.setQueryData<NotificationsOverview>(['notifications'], (old) => (old ? { ...old, settings: data } : old));
      toast.success('Preferencias guardadas');
    },
    onError: (e) => toast.error(e.message),
  });

  const broadcast = useMutation({
    mutationFn: (input: { title: string; body: string }) =>
      api<WalletNotification>('/notifications/broadcast', { method: 'POST', body: input }),
    onSuccess: (n) => {
      toast.success('Mensaje en camino', { description: `Se enviará a ${n.recipients} tarjeta(s).` });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const data = query.data;

  return (
    <>
      <PageHeader
        title="Notificaciones"
        description="Avisos que llegan al teléfono de tus clientes a través de su tarjeta en Google Wallet y Apple Wallet."
      />

      {data && !data.googleConfigured && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Google Wallet no está configurado en el servidor: los mensajes se guardan pero no llegan a los teléfonos.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Avisos automáticos</CardTitle>
              <CardDescription>Se envían solos cada vez que el personal registra un movimiento en el escáner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!data ? (
                <Skeleton className="h-28" />
              ) : (
                TOGGLES.map((t) => (
                  <label key={t.key} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                      checked={data.settings[t.key]}
                      disabled={settings.isPending}
                      onChange={(e) => settings.mutate({ [t.key]: e.target.checked } as Partial<NotificationSettings>)}
                    />
                    <span>
                      <span className="font-medium">{t.label}</span>
                      <span className="block text-muted-foreground">{t.example}</span>
                    </span>
                  </label>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {query.isLoading ? (
                <Skeleton className="m-4 h-32" />
              ) : !data?.items.length ? (
                <div className="p-5">
                  <EmptyState icon={<Bell aria-hidden />} title="Aún no hay notificaciones" description="Los avisos enviados aparecerán aquí." />
                </div>
              ) : (
                <Table>
                  <THead>
                    <Tr>
                      <Th>Fecha</Th>
                      <Th>Tipo</Th>
                      <Th>Mensaje</Th>
                      <Th className="text-right">Entregadas</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {data.items.map((n) => {
                      const delivered = n.googleSent + n.appleSent;
                      const pending = n.recipients - delivered - n.failed;
                      return (
                        <Tr key={n.id}>
                          <Td className="whitespace-nowrap align-top text-muted-foreground">{formatDate(n.createdAt, true)}</Td>
                          <Td className="align-top">
                            <Badge variant={KIND_LABEL[n.kind].variant}>{KIND_LABEL[n.kind].label}</Badge>
                          </Td>
                          <Td className="max-w-xs align-top">
                            <p className="font-medium">{n.title}</p>
                            <p className="line-clamp-2 text-muted-foreground">{n.body}</p>
                            {n.customer && <p className="mt-1 text-xs text-muted-foreground">Para: {n.customer.name}</p>}
                          </Td>
                          <Td className="whitespace-nowrap text-right align-top">
                            {delivered}/{n.recipients}
                            {pending > 0 && <span className="block text-xs text-muted-foreground">enviando…</span>}
                            {n.failed > 0 && <span className="block text-xs text-destructive">{n.failed} sin entregar</span>}
                          </Td>
                        </Tr>
                      );
                    })}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Mensaje a todos</CardTitle>
            <CardDescription>
              {data ? `${data.reachableCards} cliente(s) con la tarjeta guardada en su wallet.` : 'Promociones, horarios o avisos.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MessageForm
              idPrefix="broadcast"
              submitLabel="Enviar a todos"
              loading={broadcast.isPending}
              disabled={!data?.reachableCards}
              onSubmit={(input, reset) => {
                if (!confirm(`¿Enviar este mensaje a ${data?.reachableCards ?? 0} cliente(s)?`)) return;
                broadcast.mutate(input, { onSuccess: reset });
              }}
            />
            <p className="flex gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Google Wallet avisa como máximo 3 veces por tarjeta cada 24 horas (contando los avisos automáticos). Pasado ese límite el
              mensaje igual queda en la tarjeta, pero sin sonar en el teléfono.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
