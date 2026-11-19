import { API_URL } from '@/lib/api';
import type { PublicBusiness } from '@/lib/types';

/**
 * Per-business web app manifest: lets customers add their card page to the home
 * screen, which iPhone requires before it allows browser notifications.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await fetch(`${API_URL}/public/${encodeURIComponent(slug)}`, { cache: 'no-store' }).catch(() => null);
  if (!res?.ok) return new Response('Not found', { status: 404 });
  const business = (await res.json()) as PublicBusiness;
  const start = `/join/${encodeURIComponent(slug)}`;
  const icon = business.iconUrl || business.logoUrl;
  return new Response(
    JSON.stringify({
      name: business.program.cardTitle || business.name,
      short_name: business.name.slice(0, 12),
      start_url: start,
      scope: start,
      display: 'standalone',
      background_color: business.backgroundColor,
      theme_color: business.backgroundColor,
      ...(icon ? { icons: [{ src: icon, sizes: 'any', purpose: 'any' }] } : {}),
    }),
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=300' } },
  );
}
