'use client';

import { useMutation } from '@tanstack/react-query';
import { Gift, Minus, Plus, RotateCcw, Search } from 'lucide-react';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app-shell';
import { QrScanner } from '@/components/qr-scanner';
import { StampGrid } from '@/components/stamp-grid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/api';
import type { CardView } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

export default function ScannerPage() {
  const [card, setCard] = useState<CardView | null>(null);
  const [manual, setManual] = useState('');
  const [stampsToAdd, setStampsToAdd] = useState(1);
  const [purchase, setPurchase] = useState('');
  const [redeemPoints, setRedeemPoints] = useState('');
  const lastScan = useRef<{ text: string; at: number } | null>(null);

  const lookup = useMutation({
    mutationFn: (serial: string) => api<CardView>(`/cards/${encodeURIComponent(serial)}`),
    onSuccess: (data) => {
      setCard(data);
      setStampsToAdd(1);
      setPurchase('');
      setRedeemPoints('');
      if (navigator.vibrate) navigator.vibrate(60);
    },
    onError: (e) => toast.error(e instanceof ApiError && e.status === 404 ? 'Tarjeta no encontrada en este negocio' : e.message),
  });

  const earn = useMutation({
    mutationFn: (body: { amount?: number; purchaseAmount?: number }) =>
      api<CardView>(`/cards/${encodeURIComponent(card!.serialNumber)}/earn`, { method: 'POST', body }),
    onSuccess: (data) => {
      const prev = card!;
      setCard(data);
      setPurchase('');
      const added = data.program.type === 'STAMPS' ? data.stamps - prev.stamps : data.balance - prev.balance;
      toast.success(data.program.type === 'STAMPS' ? `+${added} sello${added === 1 ? '' : 's'}` : `+${formatNumber(added)} puntos`, {
        description: data.rewardsAvailable > prev.rewardsAvailable ? '¡El cliente completó una recompensa!' : 'La wallet del cliente se actualizará en segundos.',
      });
    },
    onError: (e) => toast.error(e.message),
  });

  const redeem = useMutation({
    mutationFn: (body: { amount?: number }) =>
      api<CardView>(`/cards/${encodeURIComponent(card!.serialNumber)}/redeem`, { method: 'POST', body }),
    onSuccess: (data) => {
      setCard(data);
      setRedeemPoints('');
      toast.success('Recompensa canjeada', { description: data.program.rewardDescription });
    },
    onError: (e) => toast.error(e.message),
  });

  const onScan = useCallback(
    (text: string) => {
      // html5-qrcode fires repeatedly while the code stays in frame.
      const now = Date.now();
      if (lookup.isPending || (lastScan.current && lastScan.current.text === text && now - lastScan.current.at < 3000)) return;
      lastScan.current = { text, at: now };
      lookup.mutate(text);
    },
    [lookup],
  );

  function onManual(e: FormEvent) {
    e.preventDefault();
    if (manual.trim()) lookup.mutate(manual.trim().toUpperCase());
  }

  const busy = earn.isPending || redeem.isPending;
  const points = card?.program.type === 'POINTS';
  const previewPoints = card && purchase ? Math.floor(Number(purchase) * card.program.pointsPerCurrency) : 0;

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Escáner" description="Escanea el QR de la tarjeta del cliente." />

      {!card ? (
        <div className="space-y-4">
          <QrScanner active={!card} onScan={onScan} />
          <form onSubmit={onManual} className="flex gap-2">
            <Input
              aria-label="Número de tarjeta"
              placeholder="RW-XXXX-XXXX-XXXX"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className="font-mono uppercase"
              autoCapitalize="characters"
            />
            <Button type="submit" variant="outline" loading={lookup.isPending}>
              <Search aria-hidden /> Buscar
            </Button>
          </form>
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xl font-bold">{card.customer.name}</p>
                <p className="truncate text-sm text-muted-foreground">{card.customer.email ?? card.customer.phone ?? card.serialNumber}</p>
              </div>
              <Badge variant={card.status === 'ACTIVE' ? 'success' : 'destructive'}>{card.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}</Badge>
            </div>

            {points ? (
              <div className="rounded-xl bg-accent p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground">Saldo</p>
                <p className="text-4xl font-extrabold">{formatNumber(card.balance)}</p>
                <p className="text-sm text-muted-foreground">puntos</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold">
                    {Math.min(card.stamps, card.program.stampsRequired)} / {card.program.stampsRequired} sellos
                  </p>
                  {card.rewardsAvailable > 0 && <Badge variant="success">{card.rewardsAvailable} recompensa(s) lista(s)</Badge>}
                </div>
                <StampGrid stamps={card.stamps} required={card.program.stampsRequired} />
              </div>
            )}

            {points ? (
              <div className="space-y-3">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (Number(purchase) > 0) earn.mutate({ purchaseAmount: Number(purchase) });
                  }}
                >
                  <Input
                    aria-label="Monto de la compra"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="Monto de compra $"
                    value={purchase}
                    onChange={(e) => setPurchase(e.target.value)}
                    className="h-12 text-lg"
                  />
                  <Button type="submit" size="lg" variant="success" loading={earn.isPending} disabled={busy || previewPoints < 1}>
                    <Plus aria-hidden /> {previewPoints > 0 ? formatNumber(previewPoints) : ''} pts
                  </Button>
                </form>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (Number(redeemPoints) > 0) redeem.mutate({ amount: Math.floor(Number(redeemPoints)) });
                  }}
                >
                  <Input
                    aria-label="Puntos a canjear"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={card.balance}
                    placeholder="Puntos a canjear"
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.value)}
                    className="h-12 text-lg"
                  />
                  <Button type="submit" size="lg" loading={redeem.isPending} disabled={busy || !(Number(redeemPoints) > 0) || Number(redeemPoints) > card.balance}>
                    <Gift aria-hidden /> Canjear
                  </Button>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" aria-label="Menos sellos" onClick={() => setStampsToAdd(Math.max(1, stampsToAdd - 1))}>
                    <Minus aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="xl"
                    variant="success"
                    className="flex-1"
                    loading={earn.isPending}
                    disabled={busy}
                    onClick={() => earn.mutate({ amount: stampsToAdd })}
                  >
                    <Plus aria-hidden /> Sumar {stampsToAdd} sello{stampsToAdd === 1 ? '' : 's'}
                  </Button>
                  <Button type="button" variant="outline" size="icon" aria-label="Más sellos" onClick={() => setStampsToAdd(Math.min(20, stampsToAdd + 1))}>
                    <Plus aria-hidden />
                  </Button>
                </div>
                <Button
                  type="button"
                  size="xl"
                  className="w-full"
                  loading={redeem.isPending}
                  disabled={busy || card.rewardsAvailable < 1}
                  onClick={() => redeem.mutate({})}
                >
                  <Gift aria-hidden /> Canjear: {card.program.rewardDescription || 'recompensa'}
                </Button>
                {card.rewardsAvailable < 1 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Faltan {card.program.stampsRequired - card.stamps} sellos para canjear.
                  </p>
                )}
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setCard(null);
                setManual('');
                lastScan.current = null;
              }}
            >
              <RotateCcw aria-hidden /> Escanear otra tarjeta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
