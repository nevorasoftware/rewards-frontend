'use client';

import { ImagePlus, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ImageKindSpec {
  kind: 'logo' | 'icon' | 'strip';
  title: string;
  hint: string;
  aspects: { label: string; value: number }[];
  minWidth: number;
  minHeight: number;
}

export const IMAGE_SPECS: Record<'logo' | 'icon' | 'strip', ImageKindSpec> = {
  logo: {
    kind: 'logo',
    title: 'Logo',
    hint: 'Apple 160×50 · Google 660×660. PNG con fondo transparente recomendado.',
    aspects: [
      { label: 'Horizontal', value: 160 / 50 },
      { label: 'Cuadrado', value: 1 },
    ],
    minWidth: 160,
    minHeight: 50,
  },
  icon: {
    kind: 'icon',
    title: 'Ícono',
    hint: 'Se usa en notificaciones y en la pantalla de bloqueo (29/58/87 px).',
    aspects: [{ label: 'Cuadrado', value: 1 }],
    minWidth: 87,
    minHeight: 87,
  },
  strip: {
    kind: 'strip',
    title: 'Imagen principal (strip / hero)',
    hint: 'Apple 375×123 · Google 1032×336. Mínimo 375×123 px.',
    aspects: [{ label: 'Panorámica', value: 375 / 123 }],
    minWidth: 375,
    minHeight: 123,
  },
};

/** Crops the selected area to a PNG blob (capped at 2000px wide). */
async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const scale = Math.min(1, 2000 / area.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('crop failed'))), 'image/png'));
}

export function ImageUploader({
  spec,
  currentUrl,
  onUpload,
  previewBackground,
}: {
  spec: ImageKindSpec;
  currentUrl: string | null;
  onUpload: (file: Blob) => Promise<void>;
  previewBackground: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(spec.aspects[0].value);
  const [area, setArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen');
      return;
    }
    setError(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setSource(URL.createObjectURL(file));
  }

  async function confirm() {
    if (!source || !area) return;
    if (area.width < spec.minWidth || area.height < spec.minHeight) {
      setError(`El recorte es muy pequeño: mínimo ${spec.minWidth}×${spec.minHeight}px. Reduce el zoom o usa una imagen más grande.`);
      return;
    }
    setUploading(true);
    try {
      await onUpload(await cropToBlob(source, area));
      URL.revokeObjectURL(source);
      setSource(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const inputId = `upload-${spec.kind}`;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm font-medium">
          {spec.title}
        </label>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload aria-hidden /> {currentUrl ? 'Cambiar' : 'Subir'}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors hover:border-primary',
          spec.kind === 'strip' ? 'aspect-[375/123]' : 'h-24',
        )}
        style={{ background: currentUrl ? previewBackground : undefined }}
        aria-label={`Subir ${spec.title.toLowerCase()}`}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="" className={cn('max-h-full', spec.kind === 'strip' ? 'h-full w-full object-cover' : 'object-contain p-2')} />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            <ImagePlus className="h-5 w-5" aria-hidden /> Arrastra o haz clic
          </span>
        )}
      </button>
      <p className="text-xs text-muted-foreground">{spec.hint}</p>
      {error && !source && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <Dialog open={Boolean(source)} onOpenChange={(open) => !open && !uploading && setSource(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recortar {spec.title.toLowerCase()}</DialogTitle>
            <DialogDescription>Ajusta el encuadre. Generaremos automáticamente todos los tamaños de Apple y Google.</DialogDescription>
          </DialogHeader>
          <div className="relative h-72 overflow-hidden rounded-lg bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:20px_20px]">
            {source && (
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                minZoom={0.5}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex flex-1 items-center gap-2 text-sm">
              Zoom
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-[hsl(var(--primary))]"
              />
            </label>
            {spec.aspects.length > 1 && (
              <div className="flex gap-1" role="group" aria-label="Proporción">
                {spec.aspects.map((a) => (
                  <Button key={a.label} type="button" size="sm" variant={aspect === a.value ? 'default' : 'outline'} onClick={() => setAspect(a.value)}>
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSource(null)} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirm} loading={uploading}>
              Usar imagen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
