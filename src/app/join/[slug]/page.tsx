import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { BrandTheme } from '@/components/brand-theme';
import { API_URL } from '@/lib/api';
import type { PublicBusiness } from '@/lib/types';
import { JoinForm } from './join-form';

export const dynamic = 'force-dynamic';

async function loadBusiness(slug: string): Promise<PublicBusiness | null> {
  try {
    const res = await fetch(`${API_URL}/public/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as PublicBusiness;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const business = await loadBusiness((await params).slug);
  if (!business) return { title: 'Negocio no encontrado' };
  return {
    title: { absolute: `${business.program.cardTitle || business.name} · Únete` },
    description: business.program.rewardDescription || `Programa de recompensas de ${business.name}`,
    // Home-screen install (required on iPhone for browser notifications).
    manifest: `/join/${encodeURIComponent(business.slug)}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: business.name, statusBarStyle: 'default' },
    ...(business.iconUrl || business.logoUrl ? { icons: { apple: (business.iconUrl || business.logoUrl)! } } : {}),
  };
}

export async function generateViewport({ params }: { params: Promise<{ slug: string }> }): Promise<Viewport> {
  const business = await loadBusiness((await params).slug);
  return { themeColor: business?.backgroundColor ?? '#6d4aed' };
}

export default async function JoinPage({ params }: { params: Promise<{ slug: string }> }) {
  const business = await loadBusiness((await params).slug);
  if (!business) notFound();
  const { program } = business;

  return (
    <BrandTheme colors={business} className="min-h-screen bg-brand-bg text-brand-fg">
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-10 pt-8">
        <header className="flex flex-col items-center text-center">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt={business.name} className="h-20 w-20 rounded-2xl bg-white object-contain p-1 shadow-lg" />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white/15 text-3xl font-bold" aria-hidden>
              {business.name.slice(0, 1)}
            </span>
          )}
          <h1 className="mt-4 text-3xl font-extrabold">{program.cardTitle || business.name}</h1>
          <p className="mt-1 text-sm text-brand-label">{business.name}</p>
        </header>

        {business.stripImageUrl && (
          <img src={business.stripImageUrl} alt="" className="mt-6 aspect-[1032/336] w-full rounded-2xl object-cover shadow-lg" />
        )}

        <section className="mt-6 rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/15">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-label">Tu recompensa</p>
          <p className="mt-1 text-lg font-semibold">{program.rewardDescription || 'Beneficios exclusivos para clientes frecuentes'}</p>
          <p className="mt-1 text-sm opacity-80">
            {program.type === 'STAMPS'
              ? `Junta ${program.stampsRequired} sellos y recíbela.`
              : `Gana ${program.pointsPerCurrency} punto${program.pointsPerCurrency === 1 ? '' : 's'} por cada $1 de compra.`}
          </p>
        </section>

        <JoinForm slug={business.slug} businessName={business.name} />

        {program.terms && (
          <details className="mt-6 text-xs opacity-80">
            <summary className="cursor-pointer font-semibold">Términos y condiciones</summary>
            <p className="mt-2 whitespace-pre-line">{program.terms}</p>
          </details>
        )}
      </main>
    </BrandTheme>
  );
}
