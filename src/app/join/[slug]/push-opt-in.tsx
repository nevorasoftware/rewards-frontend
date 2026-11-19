'use client';

import { BellOff, BellRing, CheckCircle2, Loader2, Share } from 'lucide-react';
import { useEffect, useState } from 'react';
import { currentSubscription, disablePush, enablePush, pushSupport, syncSubscription, type PushSupport } from '@/lib/push';

type State = 'checking' | 'off' | 'on' | 'working';

/** "Activar avisos": browser notifications with the full message, independent of any wallet. */
export function PushOptIn({ slug, serial, businessName }: { slug: string; serial: string; businessName: string }) {
  const [support, setSupport] = useState<PushSupport>('unsupported');
  const [state, setState] = useState<State>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = pushSupport();
    setSupport(s);
    if (s !== 'ok') return setState('off');
    let cancelled = false;
    currentSubscription()
      .then(async (sub) => {
        if (cancelled) return;
        if (sub && Notification.permission === 'granted') {
          setState('on');
          // Keep the server in sync (e.g. same phone, card re-issued).
          await syncSubscription(slug, serial, sub).catch(() => undefined);
        } else {
          setState('off');
        }
      })
      .catch(() => !cancelled && setState('off'));
    return () => {
      cancelled = true;
    };
  }, [slug, serial]);

  if (support === 'unsupported' || state === 'checking') return null;

  if (support === 'ios-install') {
    return (
      <div className="mt-5 rounded-xl bg-gray-50 p-4 text-left text-sm text-gray-700">
        <p className="flex items-center gap-2 font-semibold text-gray-900">
          <BellRing className="h-4 w-4" aria-hidden /> Recibe avisos de {businessName}
        </p>
        <p className="mt-1">
          En iPhone toca <Share className="inline h-4 w-4 align-text-bottom" aria-label="Compartir" />{' '}
          <strong>Compartir → Agregar a inicio</strong>, abre la tarjeta desde ese ícono y activa los avisos.
        </p>
      </div>
    );
  }

  async function turnOn() {
    setError(null);
    setState('working');
    try {
      await enablePush(slug, serial);
      setState('on');
    } catch (e) {
      setError((e as Error).message);
      setState('off');
    }
  }

  async function turnOff() {
    setState('working');
    await disablePush(slug, serial).catch(() => undefined);
    setState('off');
  }

  if (state === 'on') {
    return (
      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-800">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden /> Avisos activados en este teléfono
        </span>
        <button type="button" onClick={turnOff} className="inline-flex items-center gap-1 text-xs underline">
          <BellOff className="h-3.5 w-3.5" aria-hidden /> Desactivar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={turnOn}
        disabled={state === 'working'}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-bg text-base font-semibold text-brand-fg shadow-md ring-1 ring-black/10 transition hover:opacity-90 disabled:opacity-60"
      >
        {state === 'working' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <BellRing className="h-4 w-4" aria-hidden />}
        Activar avisos
      </button>
      <p className="mt-2 text-xs text-gray-500">Te avisaremos al sumar sellos, cuando tu premio esté listo y de promociones.</p>
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
