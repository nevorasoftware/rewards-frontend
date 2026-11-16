'use client';

import { CameraOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';

const ELEMENT_ID = 'qr-reader';

/**
 * Camera QR reader (html5-qrcode). Loaded client-side only; stops the camera
 * when paused or unmounted.
 */
export function QrScanner({ active, onScan }: { active: boolean; onScan: (text: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let started = false;

    (async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (cancelled) return;
      const scanner = new Html5Qrcode(ELEMENT_ID, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: (w, h) => ({ width: Math.min(w, h) * 0.7, height: Math.min(w, h) * 0.7 }), aspectRatio: 1 },
          (text) => onScanRef.current(text.trim()),
          () => undefined,
        );
        started = true;
        setError(null);
        if (cancelled) await scanner.stop();
      } catch (e) {
        const message = String((e as Error)?.message ?? e);
        setError(
          /permission|notallowed/i.test(message)
            ? 'Permite el acceso a la cámara en tu navegador para escanear.'
            : 'No se pudo iniciar la cámara. Usa la búsqueda manual.',
        );
      }
    })();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner && started) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined);
      }
    };
  }, [active]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
      <div id={ELEMENT_ID} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white">
          <CameraOff className="h-8 w-8" aria-hidden />
          {error}
        </div>
      )}
      {!active && !error && <div className="absolute inset-0 bg-black/60" aria-hidden />}
    </div>
  );
}
