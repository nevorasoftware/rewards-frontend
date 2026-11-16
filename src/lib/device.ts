export type Platform = 'ios' | 'android' | 'other';

export function detectPlatform(userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''): Platform {
  const ua = userAgent.toLowerCase();
  // iPadOS reports itself as Macintosh; touch support tells them apart.
  const isIpad = ua.includes('macintosh') && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/.test(ua) || isIpad) return 'ios';
  if (ua.includes('android')) return 'android';
  return 'other';
}
