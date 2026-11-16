'use client';

import { Info, RotateCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { backFields, cardTexts, type PreviewModel } from './preview-model';

/**
 * Approximation of an Apple Wallet storeCard: logo + logoText header, strip image
 * with the primary field on top, secondary/auxiliary rows and a QR barcode.
 * The (i) button flips to the back fields, like in Wallet.
 */
export function AppleWalletPreview({ model }: { model: PreviewModel }) {
  const [flipped, setFlipped] = useState(false);
  const t = cardTexts(model);
  const label = { color: model.labelColor };
  const aux = (model.design.frontFields ?? []).slice(0, 4);

  return (
    <figure className="w-[320px] shrink-0" aria-label="Vista previa en Apple Wallet">
      <figcaption className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.59 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.83-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.3-3.53zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.3-.56.64-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.21z" />
        </svg>
        Apple Wallet
      </figcaption>
      <div
        className="relative overflow-hidden rounded-[14px] shadow-xl ring-1 ring-black/10"
        style={{ background: model.backgroundColor, color: model.foregroundColor, minHeight: 410 }}
      >
        {!flipped ? (
          <div className="flex h-full flex-col">
            <div className="flex h-[52px] items-center gap-2 px-3">
              {model.logoUrl ? (
                <img src={model.logoUrl} alt="" className="max-h-[34px] max-w-[110px] object-contain" />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-md bg-white/20 text-sm font-bold">
                  {model.businessName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="truncate text-[15px] font-semibold">{t.logoText}</span>
            </div>

            <div className="relative h-[105px]">
              {model.stripUrl && <img src={model.stripUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <div className="relative px-3 pt-3">
                <p className="text-[11px] font-semibold uppercase" style={label}>
                  {t.balanceLabel}
                </p>
                <p className="text-[38px] font-light leading-none">{t.balanceValue}</p>
              </div>
            </div>

            <div className="flex justify-between gap-3 px-3 pt-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase" style={label}>
                  Cliente
                </p>
                <p className="truncate text-[15px]">{model.sample.customerName}</p>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[10px] font-semibold uppercase" style={label}>
                  Estado
                </p>
                <p className="truncate text-[15px]">{t.progressText}</p>
              </div>
            </div>

            {aux.length > 0 && (
              <div className="flex gap-4 px-3 pt-2">
                {aux.map((f, i) => (
                  <div key={i} className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase" style={label}>
                      {f.label}
                    </p>
                    <p className="truncate text-[14px]">{f.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto flex flex-col items-center px-3 pb-4 pt-5">
              <div className="rounded-lg bg-white p-2.5">
                <QRCodeSVG value={model.sample.serial} size={108} />
                <p className="mt-1 text-center font-mono text-[10px] text-black">{model.sample.serial}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-[410px] space-y-3 overflow-y-auto bg-[#f2f2f7] p-4 text-black">
            {backFields(model).map((f, i) => (
              <div key={i} className="border-b border-black/10 pb-2">
                <p className="text-[11px] text-black/50">{f.label}</p>
                <p className="whitespace-pre-line break-words text-[13px]">{f.value}</p>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setFlipped(!flipped)}
          aria-label={flipped ? 'Ver frente de la tarjeta' : 'Ver reverso de la tarjeta'}
          className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-black/25 text-white hover:bg-black/40"
        >
          {flipped ? <RotateCcw className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
        </button>
      </div>
    </figure>
  );
}
