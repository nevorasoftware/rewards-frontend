'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface Point {
  date: string;
  value: number;
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Single-series daily bar chart: one measure at a time (no dual axis). */
export function ActivityChart({ data, unit }: { data: Point[]; unit: string }) {
  return (
    <div className="h-64 w-full" role="img" aria-label={`Gráfico de ${unit} por día`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="0" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Point;
              return (
                <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
                  <p className="text-muted-foreground">{shortDate(p.date)}</p>
                  <p className="font-semibold text-foreground">
                    {formatNumber(p.value)} {unit}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
