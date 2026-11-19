import { api } from '@/lib/api';

/**
 * - ok: the browser can subscribe.
 * - ios-install: iPhone/iPad in Safari; Apple only allows web notifications from a page
 *   added to the home screen (iOS 16.4+).
 * - unsupported: no Web Push in this browser.
 */
export type PushSupport = 'ok' | 'ios-install' | 'unsupported';

export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (ios && !standalone) return 'ios-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  return 'ok';
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const cardPath = (slug: string, serial: string) => `/public/${encodeURIComponent(slug)}/cards/${encodeURIComponent(serial)}/push`;

/** Existing subscription of this browser, if any (does not prompt). */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'ok') return null;
  const registration = await navigator.serviceWorker.getRegistration('/');
  return registration ? registration.pushManager.getSubscription() : null;
}

/** Re-sends an existing subscription so the server links it to this card (idempotent). */
export async function syncSubscription(slug: string, serial: string, subscription: PushSubscription): Promise<void> {
  await api(cardPath(slug, serial), { method: 'POST', auth: false, body: subscription.toJSON() });
}

/**
 * Asks for permission and subscribes this browser to the card's notifications.
 * Must run from a click: Safari rejects permission prompts after an await.
 */
export async function enablePush(slug: string, serial: string): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission === 'denied') throw new Error('Bloqueaste los avisos. Actívalos en la configuración del navegador para este sitio.');
  if (permission !== 'granted') throw new Error('No se activaron los avisos.');

  const { publicKey } = await api<{ publicKey: string | null }>('/public/push/key', { auth: false });
  if (!publicKey) throw new Error('Los avisos no están disponibles por ahora.');

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  const options = { userVisibleOnly: true, applicationServerKey: base64UrlToBytes(publicKey) };
  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe(options);
  } catch {
    // A subscription made with an older server key blocks a new one: replace it.
    await (await registration.pushManager.getSubscription())?.unsubscribe();
    subscription = await registration.pushManager.subscribe(options);
  }
  await syncSubscription(slug, serial, subscription);
}

export async function disablePush(slug: string, serial: string): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await api(cardPath(slug, serial), { method: 'DELETE', auth: false, body: { endpoint: subscription.endpoint } }).catch(() => undefined);
  await subscription.unsubscribe();
}
