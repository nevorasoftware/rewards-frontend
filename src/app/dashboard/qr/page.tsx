'use client';

import { useQuery } from '@tanstack/react-query';
import { Copy, Download, ExternalLink, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app-shell';
import { OwnerOnly } from '@/components/owner-only';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { api } from '@/lib/api';
import type { Business, Program } from '@/lib/types';

export default function QrPage() {
  return (
    <OwnerOnly>
      <QrPoster />
    </OwnerOnly>
  );
}

function QrPoster() {
  const business = useQuery({ queryKey: ['business'], queryFn: () => api<Business>('/businesses/me') });
  const programs = useQuery({ queryKey: ['programs'], queryFn: () => api<Program[]>('/programs') });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_WEB_URL ?? '');

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_WEB_URL) setOrigin(window.location.origin);
  }, []);

  if (!business.data || !origin) return <Skeleton className="mx-auto h-[600px] max-w-md" />;
  const b = business.data;
  const program = programs.data?.[0];
  const url = `${origin.replace(/\/$/, '')}/join/${b.slug}`;

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr-${b.slug}.png`;
    link.click();
  }

  return (
    <>
      <PageHeader
        title="QR de registro"
        description="Imprímelo y colócalo en tu mostrador. Tus clientes lo escanean para obtener su tarjeta."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(url).then(() => toast.success('Enlace copiado'))}
            >
              <Copy aria-hidden /> Copiar enlace
            </Button>
            <Button variant="outline" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden /> Abrir página
              </a>
            </Button>
            <Button variant="outline" onClick={download}>
              <Download aria-hidden /> PNG
            </Button>
            <Button onClick={() => window.print()}>
              <Printer aria-hidden /> Imprimir
            </Button>
          </>
        }
      />

      <div
        className="mx-auto flex max-w-md flex-col items-center rounded-3xl p-8 text-center shadow-xl print:max-w-none print:rounded-none print:shadow-none"
        style={{ background: b.backgroundColor, color: b.foregroundColor }}
      >
        {b.logoUrl && <img src={b.logoUrl} alt="" className="h-16 w-16 rounded-xl bg-white object-contain p-1" />}
        <h2 className="mt-4 text-3xl font-extrabold">{program?.cardTitle || b.name}</h2>
        <p className="mt-2 text-lg" style={{ color: b.labelColor }}>
          {program?.rewardDescription ? `Gana: ${program.rewardDescription}` : 'Únete a nuestro programa de recompensas'}
        </p>
        <div className="mt-6 rounded-2xl bg-white p-4">
          <QRCodeCanvas ref={canvasRef} value={url} size={260} level="M" marginSize={2} />
        </div>
        <p className="mt-6 text-xl font-bold">Escanea y guarda tu tarjeta</p>
        <p className="mt-1 text-sm opacity-80">Apple Wallet · Google Wallet</p>
        <p className="mt-4 break-all font-mono text-xs opacity-70">{url}</p>
      </div>
    </>
  );
}
