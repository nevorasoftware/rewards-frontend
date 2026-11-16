'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, Gift, QrCode, Smartphone, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ActivityChart } from '@/components/activity-chart';
import { PageHeader } from '@/components/app-shell';
import { OwnerOnly } from '@/components/owner-only';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton, Table, TBody, Td, Th, THead, Tr } from '@/components/ui/misc';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import type { AnalyticsSummary, Program } from '@/lib/types';
import { cn, formatNumber } from '@/lib/utils';

type Metric = 'earned' | 'redemptions' | 'cardsIssued';
const RANGES = [7, 30, 90] as const;

function StatTile({ label, value, hint, icon: Icon }: { label: string; value: number; hint?: string; icon: typeof Users }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums">{formatNumber(value)}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <OwnerOnly>
      <Dashboard />
    </OwnerOnly>
  );
}

function Dashboard() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [metric, setMetric] = useState<Metric>('earned');
  const [showTable, setShowTable] = useState(false);
  const summary = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => api<AnalyticsSummary>(`/analytics/summary?days=${days}`),
  });
  const programs = useQuery({ queryKey: ['programs'], queryFn: () => api<Program[]>('/programs') });
  const isStamps = (programs.data?.[0]?.type ?? 'STAMPS') === 'STAMPS';

  const earnedLabel = isStamps ? 'sellos otorgados' : 'puntos otorgados';
  const metricInfo: Record<Metric, { tab: string; unit: string }> = {
    earned: { tab: isStamps ? 'Sellos' : 'Puntos', unit: earnedLabel },
    redemptions: { tab: 'Canjes', unit: 'canjes' },
    cardsIssued: { tab: 'Tarjetas nuevas', unit: 'tarjetas nuevas' },
  };

  const data = summary.data;
  const series = data?.daily.map((d) => ({ date: d.date, value: d[metric] })) ?? [];

  return (
    <>
      <PageHeader
        title="Resumen"
        description="Cómo va tu programa de recompensas."
        actions={
          <div className="flex rounded-lg border bg-card p-1" role="group" aria-label="Rango de fechas">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={days === r}
                onClick={() => setDays(r)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium',
                  days === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {r} días
              </button>
            ))}
          </div>
        }
      />

      {summary.isError ? (
        <p className="text-destructive">{summary.error.message}</p>
      ) : !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Tarjetas emitidas" value={data.totals.cardsIssued} hint={`+${formatNumber(data.period.cardsIssued)} en ${days} días`} icon={CreditCard} />
            <StatTile label="Tarjetas activas" value={data.totals.activeCards} hint="Con movimientos en los últimos 30 días" icon={Sparkles} />
            <StatTile
              label={isStamps ? 'Sellos otorgados' : 'Puntos otorgados'}
              value={isStamps ? data.totals.stampsAwarded : data.totals.pointsAwarded}
              hint={`${formatNumber(data.period.earned)} en ${days} días`}
              icon={Users}
            />
            <StatTile label="Canjes" value={data.totals.redemptions} hint={`${formatNumber(data.period.redemptions)} en ${days} días`} icon={Gift} />
          </div>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle>Actividad diaria</CardTitle>
              <div className="flex items-center gap-2">
                <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
                  <TabsList>
                    {(Object.keys(metricInfo) as Metric[]).map((m) => (
                      <TabsTrigger key={m} value={m}>
                        {metricInfo[m].tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <Button variant="ghost" size="sm" onClick={() => setShowTable(!showTable)} aria-pressed={showTable}>
                  {showTable ? 'Ver gráfico' : 'Ver tabla'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showTable ? (
                <div className="max-h-72 overflow-y-auto">
                  <Table>
                    <THead>
                      <Tr>
                        <Th>Fecha</Th>
                        <Th className="text-right">{metricInfo.earned.tab}</Th>
                        <Th className="text-right">Canjes</Th>
                        <Th className="text-right">Tarjetas nuevas</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {[...data.daily].reverse().map((d) => (
                        <Tr key={d.date}>
                          <Td>{d.date}</Td>
                          <Td className="text-right tabular-nums">{formatNumber(d.earned)}</Td>
                          <Td className="text-right tabular-nums">{formatNumber(d.redemptions)}</Td>
                          <Td className="text-right tabular-nums">{formatNumber(d.cardsIssued)}</Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              ) : (
                <ActivityChart data={series} unit={metricInfo[metric].unit} />
              )}
              <p className="mt-2 text-xs text-muted-foreground">Días en horario UTC.</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <StatTile label="Clientes" value={data.totals.customers} icon={Users} />
            <StatTile label="Instalaciones en Apple Wallet" value={data.totals.appleDevices} hint="Dispositivos registrados" icon={Smartphone} />
            <StatTile label="Tarjetas en Google Wallet" value={data.totals.googleCards} hint="Objetos emitidos" icon={Smartphone} />
          </div>

          {data.totals.cardsIssued === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Consigue tus primeros clientes</p>
                  <p className="text-sm text-muted-foreground">Imprime tu QR de registro y colócalo junto a la caja.</p>
                </div>
                <Button asChild>
                  <Link href="/dashboard/qr">
                    <QrCode aria-hidden /> Ver QR
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
