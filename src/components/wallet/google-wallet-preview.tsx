'use client';

import { ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { readableTextColor } from '@/lib/utils';
import { backFields, cardTexts, type PreviewModel } from './preview-model';

/**
 * Approximation of a Google Wallet loyalty card. Google picks the text color
 * automatically from the background (foreground/label colors are ignored), shows
 * the program logo in a circle and the hero image at the bottom.
 */
export function GoogleWalletPreview({ model }: { model: PreviewModel }) {
  const t = cardTexts(model);
  const text = readableTextColor(model.backgroundColor);
  const isStamps = model.type === 'STAMPS';
  const details = backFields(model).filter((f) => f.label !== 'Número de tarjeta');

  return (
    <figure className="w-[320px] shrink-0" aria-label="Vista previa en Google Wallet">
      <figcaption className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.99-4.32 2.99-7.33z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22z" />
          <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96l3.33-2.58z" />
          <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.87A10 10 0 0 0 3.07 7.52L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98z" />
        </svg>
        Google Wallet
      </figcaption>
      <div className="overflow-hidden rounded-[20px] shadow-xl ring-1 ring-black/10" style={{ background: model.backgroundColor, color: text }}>
        <div className="flex items-center gap-3 px-4 pt-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
            {model.logoUrl ? (
              <img src={model.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-black">{model.businessName.slice(0, 1).toUpperCase()}</span>
            )}
          </span>
          <span className="truncate text-sm font-medium">{model.businessName}</span>
        </div>
        <p className="px-4 pt-3 text-[22px] font-normal leading-tight">{t.title}</p>

        <div className="grid grid-cols-2 gap-2 px-4 pt-4">
          <div>
            <p className="text-[11px] opacity-80">{t.balanceLabel}</p>
            <p className="text-[18px] font-medium">{t.balanceValue}</p>
          </div>
          {isStamps && (
            <div className="text-right">
              <p className="text-[11px] opacity-80">Recompensas</p>
              <p className="text-[18px] font-medium">{t.rewards}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center px-4 pb-4 pt-5">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={model.sample.serial} size={116} />
          </div>
          <p className="mt-1.5 font-mono text-[11px] opacity-90">{model.sample.serial}</p>
        </div>

        {model.stripUrl ? (
          <img src={model.stripUrl} alt="" className="aspect-[1032/336] w-full object-cover" />
        ) : (
          <div className="h-2" />
        )}
      </div>

      <div className="mt-3 space-y-2 rounded-xl border bg-card p-3 text-sm">
        <p className="text-xs font-semibold text-muted-foreground">Detalles de la tarjeta</p>
        <div>
          <p className="text-xs text-muted-foreground">{t.balanceLabel}</p>
          <p>{t.progressText}</p>
        </div>
        {(model.design.frontFields ?? []).map((f, i) => (
          <div key={`f${i}`}>
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <p>{f.value}</p>
          </div>
        ))}
        {details.map((f, i) => {
          const isLink = /^https?:\/\//.test(f.value);
          return (
            <div key={i}>
              <p className="text-xs text-muted-foreground">{f.label}</p>
              {isLink ? (
                <span className="inline-flex items-center gap-1 text-blue-600">
                  {f.value} <ExternalLink className="h-3 w-3" aria-hidden />
                </span>
              ) : (
                <p className="whitespace-pre-line break-words">{f.value}</p>
              )}
            </div>
          );
        })}
      </div>
    </figure>
  );
}
