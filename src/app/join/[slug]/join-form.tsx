'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState, type FormEvent } from 'react';
import { AppleWalletButton, GoogleWalletButton } from '@/components/wallet/wallet-buttons';
import { api } from '@/lib/api';
import { detectPlatform, type Platform } from '@/lib/device';
import type { JoinResult } from '@/lib/types';

const storageKey = (slug: string) => `rw.join.${slug}`;

export function JoinForm({ slug, businessName }: { slug: string; businessName: string }) {
  const [platform, setPlatform] = useState<Platform>('other');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JoinResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    let saved: JoinResult | null = null;
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) saved = JSON.parse(raw) as JoinResult;
    } catch {
      /* ignore */
    }
    if (!saved?.serialNumber) return;
    // Wallet save links are short-lived and change with server config: only the
    // serial is reused from storage, the links are always fetched fresh.
    setRefreshing(true);
    let cancelled = false;
    api<JoinResult>(`/public/${encodeURIComponent(slug)}/cards/${encodeURIComponent(saved.serialNumber)}`, { auth: false })
      .then((fresh) => {
        if (cancelled) return;
        setRefreshing(false);
        setResult(fresh);
        try {
          localStorage.setItem(storageKey(slug), JSON.stringify(fresh));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRefreshing(false);
        try {
          localStorage.removeItem(storageKey(slug));
        } catch {
          /* ignore */
        }
        setResult(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError('Ingresa tu nombre');
    if (!email.trim() && !phone.trim()) return setError('Ingresa tu email o teléfono');
    if (!consent) return setError('Debes aceptar los términos para continuar');
    setLoading(true);
    try {
      const res = await api<JoinResult>(`/public/${encodeURIComponent(slug)}/join`, {
        method: 'POST',
        auth: false,
        body: { name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined },
      });
      setResult(res);
      try {
        localStorage.setItem(storageKey(slug), JSON.stringify(res));
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (refreshing) {
    return (
      <div className="mt-6 flex justify-center text-white/80" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Cargando tu tarjeta" />
      </div>
    );
  }

  if (result) {
    const { links } = result;
    const apple = (
      <AppleWalletButton
        key="apple"
        href={links.apple}
        disabledReason={links.appleConfigured ? undefined : 'Apple Wallet aún no está disponible para este negocio'}
      />
    );
    const google = (
      <GoogleWalletButton
        key="google"
        href={links.google}
        disabledReason={links.google ? undefined : 'Google Wallet aún no está disponible para este negocio'}
      />
    );
    const buttons = platform === 'android' ? [google, apple] : [apple, google];
    const showBoth = platform === 'other';

    return (
      <section aria-live="polite" className="mt-6 rounded-2xl bg-white p-5 text-center text-gray-900 shadow-xl">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
        <h2 className="mt-2 text-xl font-bold">
          {result.isNew ? `¡Bienvenido, ${result.customerName.split(' ')[0]}!` : `¡Hola de nuevo, ${result.customerName.split(' ')[0]}!`}
        </h2>
        <p className="mt-1 text-sm text-gray-600">Guarda tu tarjeta de {businessName} en tu teléfono.</p>
        <div className="mt-5 flex flex-col items-center gap-3">
          {showBoth ? buttons : buttons[0]}
          {!showBoth && (
            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer">¿Usas otro teléfono?</summary>
              <div className="mt-3 flex justify-center">{buttons[1]}</div>
            </details>
          )}
        </div>
        {!links.googleConfigured && links.google && (
          <p className="mt-3 text-xs text-amber-700">Modo demostración: las credenciales de Google Wallet no están configuradas.</p>
        )}
        <div className="mt-6 border-t pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">O muestra este código en caja</p>
          <div className="mt-3 inline-block rounded-xl border p-3">
            <QRCodeSVG value={result.serialNumber} size={140} />
          </div>
          <p className="mt-1 font-mono text-xs text-gray-500">{result.serialNumber}</p>
        </div>
        <button
          type="button"
          className="mt-4 text-xs text-gray-500 underline"
          onClick={() => {
            localStorage.removeItem(storageKey(slug));
            setResult(null);
          }}
        >
          Registrar a otra persona
        </button>
      </section>
    );
  }

  const inputClass =
    'h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-bg)]';

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3 rounded-2xl bg-white p-5 text-gray-900 shadow-xl">
      <h2 className="text-lg font-bold">Obtén tu tarjeta gratis</h2>
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Nombre
        </label>
        <input id="name" autoComplete="name" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input id="email" type="email" autoComplete="email" inputMode="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium">
          Teléfono
        </label>
        <input id="phone" type="tel" autoComplete="tel" inputMode="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4" />
        Acepto los términos del programa y que {businessName} me contacte sobre mis recompensas.
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-bg text-base font-semibold text-brand-fg shadow-md ring-1 ring-black/10 transition hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Crear mi tarjeta
      </button>
    </form>
  );
}
