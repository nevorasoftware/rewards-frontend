'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coffee, Loader2, Save, Send, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app-shell';
import { ColorField } from '@/components/color-field';
import { IMAGE_SPECS, ImageUploader } from '@/components/image-uploader';
import { ListEditor } from '@/components/list-editor';
import { OwnerOnly } from '@/components/owner-only';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Badge } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppleWalletPreview } from '@/components/wallet/apple-wallet-preview';
import { GoogleWalletPreview } from '@/components/wallet/google-wallet-preview';
import type { PreviewModel } from '@/components/wallet/preview-model';
import { api } from '@/lib/api';
import type { Business, DesignLink, LabeledValue, Program, ProgramDesign, ProgramType, PublishResult } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

interface BrandForm {
  name: string;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
}

interface ProgramForm {
  name: string;
  type: ProgramType;
  stampsRequired: number;
  pointsPerCurrency: number;
  rewardDescription: string;
  terms: string;
  cardTitle: string;
  isActive: boolean;
  design: Required<Pick<ProgramDesign, 'frontFields' | 'backFields' | 'links'>> & Omit<ProgramDesign, 'frontFields' | 'backFields' | 'links'>;
}

const PRESETS = [
  { name: 'Café', bg: '#3E2723', fg: '#FFF8E1', label: '#FFCC80' },
  { name: 'Menta', bg: '#0F766E', fg: '#F0FDFA', label: '#99F6E4' },
  { name: 'Noche', bg: '#111827', fg: '#F9FAFB', label: '#A5B4FC' },
  { name: 'Coral', bg: '#E11D48', fg: '#FFF1F2', label: '#FECDD3' },
  { name: 'Sol', bg: '#FACC15', fg: '#1C1917', label: '#78350F' },
];

function toProgramForm(p: Program): ProgramForm {
  const d = p.design ?? {};
  return {
    name: p.name,
    type: p.type,
    stampsRequired: p.stampsRequired,
    pointsPerCurrency: Number(p.pointsPerCurrency),
    rewardDescription: p.rewardDescription,
    terms: p.terms,
    cardTitle: p.cardTitle,
    isActive: p.isActive,
    design: {
      logoText: d.logoText ?? '',
      frontFields: d.frontFields ?? [],
      backFields: d.backFields ?? [],
      links: d.links ?? [],
      phone: d.phone ?? '',
      address: d.address ?? '',
      website: d.website ?? '',
    },
  };
}

/** Drops empty rows/strings so the API validators don't reject half-filled fields. */
function cleanDesign(design: ProgramForm['design']): ProgramDesign {
  const rows = (list: LabeledValue[]) => list.filter((r) => r.label.trim() && r.value.trim());
  const links = (list: DesignLink[]) => list.filter((r) => r.label.trim() && r.url.trim());
  return {
    ...(design.logoText?.trim() ? { logoText: design.logoText.trim() } : {}),
    frontFields: rows(design.frontFields),
    backFields: rows(design.backFields),
    links: links(design.links),
    ...(design.phone?.trim() ? { phone: design.phone.trim() } : {}),
    ...(design.address?.trim() ? { address: design.address.trim() } : {}),
    ...(design.website?.trim() ? { website: design.website.trim() } : {}),
  };
}

function publishSummary(r: PublishResult): string {
  const google =
    r.google.status === 'mock'
      ? 'Google: sin credenciales (modo demo)'
      : r.google.status === 'error'
        ? `Google: error (${r.google.error})`
        : `Google: ${r.google.updatedObjects} tarjetas actualizadas`;
  const apple =
    r.apple.status === 'mock'
      ? 'Apple: sin credenciales (modo demo)'
      : r.apple.status === 'error'
        ? `Apple: error (${r.apple.error})`
        : `Apple: ${r.apple.pushedDevices} dispositivos notificados`;
  return `${google} · ${apple}`;
}

export default function CardEditorPage() {
  return (
    <OwnerOnly>
      <CardEditor />
    </OwnerOnly>
  );
}

function CardEditor() {
  const qc = useQueryClient();
  const businessQuery = useQuery({ queryKey: ['business'], queryFn: () => api<Business>('/businesses/me') });
  const programsQuery = useQuery({ queryKey: ['programs'], queryFn: () => api<Program[]>('/programs') });
  const program = programsQuery.data?.[0];

  const [brand, setBrand] = useState<BrandForm | null>(null);
  const [form, setForm] = useState<ProgramForm | null>(null);
  const [sampleProgress, setSampleProgress] = useState(0.6);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (businessQuery.data && !brand) {
      const b = businessQuery.data;
      setBrand({ name: b.name, backgroundColor: b.backgroundColor, foregroundColor: b.foregroundColor, labelColor: b.labelColor });
    }
  }, [businessQuery.data, brand]);

  useEffect(() => {
    if (program && !form) setForm(toProgramForm(program));
  }, [program, form]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const editBrand = (patch: Partial<BrandForm>) => {
    setBrand((b) => (b ? { ...b, ...patch } : b));
    setDirty(true);
  };
  const editForm = (patch: Partial<ProgramForm>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
    setDirty(true);
  };
  const editDesign = (patch: Partial<ProgramForm['design']>) => {
    setForm((f) => (f ? { ...f, design: { ...f.design, ...patch } } : f));
    setDirty(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!brand || !form || !program) return;
      await api<Business>('/businesses/me', { method: 'PATCH', body: brand });
      await api<Program>(`/programs/${program.id}`, {
        method: 'PATCH',
        body: { ...form, design: cleanDesign(form.design) },
      });
    },
    onSuccess: () => {
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['business'] });
      qc.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  const publish = useMutation({
    mutationFn: async () => {
      await save.mutateAsync();
      return api<{ result: PublishResult }>(`/programs/${program!.id}/publish`, { method: 'POST' });
    },
    onSuccess: ({ result }) => {
      qc.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Diseño publicado', { description: publishSummary(result) });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  async function upload(kind: 'logo' | 'icon' | 'strip', file: Blob) {
    const data = new FormData();
    data.append('file', file, `${kind}.png`);
    const updated = await api<Business>(`/businesses/me/images/${kind}`, { method: 'POST', form: data });
    qc.setQueryData(['business'], updated);
    toast.success('Imagen actualizada', { description: 'Pulsa “Publicar” para enviarla a las tarjetas existentes.' });
  }

  const business = businessQuery.data;
  const model: PreviewModel | null = useMemo(() => {
    if (!brand || !form || !business) return null;
    const stamps = Math.round(form.stampsRequired * sampleProgress);
    return {
      businessName: brand.name,
      logoUrl: business.logoUrl,
      iconUrl: business.iconUrl,
      stripUrl: business.stripImageUrl,
      backgroundColor: brand.backgroundColor,
      foregroundColor: brand.foregroundColor,
      labelColor: brand.labelColor,
      logoText: form.design.logoText ?? '',
      cardTitle: form.cardTitle,
      type: form.type,
      stampsRequired: form.stampsRequired,
      rewardDescription: form.rewardDescription,
      terms: form.terms,
      design: cleanDesign(form.design),
      sample: { customerName: 'María López', stamps, balance: Math.round(500 * sampleProgress), serial: 'RW-DEMO-1234-ABCD' },
    };
  }, [brand, form, business, sampleProgress]);

  if (businessQuery.isError || programsQuery.isError) {
    return <p className="text-destructive">No se pudo cargar la configuración: {(businessQuery.error ?? programsQuery.error)?.message}</p>;
  }
  if (!brand || !form || !model || !program) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Marca y tarjeta"
        description={
          program.publishedAt ? `Última publicación: ${formatDate(program.publishedAt, true)}` : 'Aún no has publicado el diseño en las wallets.'
        }
        actions={
          <>
            {dirty && <Badge variant="warning" className="self-center">Cambios sin guardar</Badge>}
            <Button
              variant="outline"
              onClick={() => save.mutate(undefined, { onSuccess: () => toast.success('Cambios guardados'), onError: (e) => toast.error(e.message) })}
              loading={save.isPending && !publish.isPending}
              disabled={!dirty}
            >
              <Save aria-hidden /> Guardar
            </Button>
            <Button onClick={() => publish.mutate()} loading={publish.isPending}>
              <Send aria-hidden /> Publicar
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
        <Tabs defaultValue="brand" className="min-w-0">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="brand">Marca</TabsTrigger>
            <TabsTrigger value="program">Programa</TabsTrigger>
            <TabsTrigger value="content">Contenido</TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Colores</CardTitle>
                <CardDescription>Google Wallet solo usa el color de fondo; el texto se ajusta automáticamente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Paletas sugeridas">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => editBrand({ backgroundColor: p.bg, foregroundColor: p.fg, labelColor: p.label })}
                      className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium hover:bg-secondary"
                    >
                      <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: p.bg }} aria-hidden />
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ColorField id="bg" label="Fondo" value={brand.backgroundColor} onChange={(v) => editBrand({ backgroundColor: v })} />
                  <ColorField id="fg" label="Texto" value={brand.foregroundColor} onChange={(v) => editBrand({ foregroundColor: v })} />
                  <ColorField id="label" label="Etiquetas" value={brand.labelColor} onChange={(v) => editBrand({ labelColor: v })} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Imágenes</CardTitle>
                <CardDescription>Se guardan al instante y se redimensionan a todos los tamaños de cada wallet.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <ImageUploader spec={IMAGE_SPECS.logo} currentUrl={business!.logoUrl} previewBackground={brand.backgroundColor} onUpload={(f) => upload('logo', f)} />
                <ImageUploader spec={IMAGE_SPECS.icon} currentUrl={business!.iconUrl} previewBackground={brand.backgroundColor} onUpload={(f) => upload('icon', f)} />
                <div className="md:col-span-2">
                  <ImageUploader spec={IMAGE_SPECS.strip} currentUrl={business!.stripImageUrl} previewBackground={brand.backgroundColor} onUpload={(f) => upload('strip', f)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="program" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tipo de programa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de programa">
                  {(
                    [
                      { type: 'STAMPS', icon: Coffee, title: 'Sellos', text: 'Ej.: compra 8 cafés y el 9.º es gratis.' },
                      { type: 'POINTS', icon: Star, title: 'Puntos', text: 'Acumula puntos por cada compra y canjéalos.' },
                    ] as const
                  ).map(({ type, icon: Icon, title, text }) => (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={form.type === type}
                      onClick={() => editForm({ type })}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                        form.type === type ? 'border-primary bg-accent' : 'hover:border-muted-foreground/30',
                      )}
                    >
                      <Icon className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                      <span>
                        <span className="block font-semibold">{title}</span>
                        <span className="text-sm text-muted-foreground">{text}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {form.type === 'STAMPS' ? (
                    <Field label="Sellos para la recompensa" htmlFor="stampsRequired">
                      <Input
                        id="stampsRequired"
                        type="number"
                        min={1}
                        max={50}
                        value={form.stampsRequired}
                        onChange={(e) => editForm({ stampsRequired: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
                      />
                    </Field>
                  ) : (
                    <Field label="Puntos por cada $1 de compra" htmlFor="ppc">
                      <Input
                        id="ppc"
                        type="number"
                        min={0}
                        step={0.1}
                        value={form.pointsPerCurrency}
                        onChange={(e) => editForm({ pointsPerCurrency: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </Field>
                  )}
                  <Field label="Nombre interno del programa" htmlFor="pname">
                    <Input id="pname" value={form.name} maxLength={80} onChange={(e) => editForm({ name: e.target.value })} />
                  </Field>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recompensa y condiciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Título de la tarjeta" htmlFor="cardTitle" hint="Aparece como nombre del programa en Google Wallet.">
                  <Input id="cardTitle" value={form.cardTitle} maxLength={40} onChange={(e) => editForm({ cardTitle: e.target.value })} />
                </Field>
                <Field label="Recompensa" htmlFor="reward">
                  <Input
                    id="reward"
                    value={form.rewardDescription}
                    maxLength={200}
                    placeholder="Un café gratis"
                    onChange={(e) => editForm({ rewardDescription: e.target.value })}
                  />
                </Field>
                <Field label="Términos y condiciones" htmlFor="terms">
                  <Textarea id="terms" value={form.terms} maxLength={2000} rows={4} onChange={(e) => editForm({ terms: e.target.value })} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => editForm({ isActive: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  Programa activo (permite nuevos registros)
                </label>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Frente de la tarjeta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Texto junto al logo" htmlFor="logoText" hint="Si lo dejas vacío se usa el nombre del negocio.">
                  <Input id="logoText" value={form.design.logoText ?? ''} maxLength={30} onChange={(e) => editDesign({ logoText: e.target.value })} />
                </Field>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Campos adicionales (máx. 4)</p>
                  <ListEditor
                    idPrefix="front"
                    rows={form.design.frontFields}
                    onChange={(frontFields) => editDesign({ frontFields })}
                    max={4}
                    keys={['label', 'value']}
                    placeholders={['Etiqueta', 'Valor']}
                    addLabel="Agregar campo"
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Reverso y contacto</CardTitle>
                <CardDescription>Información que el cliente ve al abrir los detalles de la tarjeta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ListEditor
                  idPrefix="back"
                  rows={form.design.backFields}
                  onChange={(backFields) => editDesign({ backFields })}
                  max={10}
                  keys={['label', 'value']}
                  placeholders={['Título', 'Contenido']}
                  addLabel="Agregar sección"
                  multiline
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Teléfono" htmlFor="phone">
                    <Input id="phone" type="tel" value={form.design.phone ?? ''} maxLength={30} onChange={(e) => editDesign({ phone: e.target.value })} />
                  </Field>
                  <Field label="Sitio web" htmlFor="website">
                    <Input id="website" type="url" value={form.design.website ?? ''} placeholder="https://" onChange={(e) => editDesign({ website: e.target.value })} />
                  </Field>
                </div>
                <Field label="Dirección" htmlFor="address">
                  <Input id="address" value={form.design.address ?? ''} maxLength={200} onChange={(e) => editDesign({ address: e.target.value })} />
                </Field>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Enlaces (máx. 5)</p>
                  <ListEditor
                    idPrefix="links"
                    rows={form.design.links}
                    onChange={(links) => editDesign({ links })}
                    max={5}
                    keys={['label', 'url']}
                    placeholders={['Texto', 'https://']}
                    addLabel="Agregar enlace"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <section aria-label="Vista previa en vivo" className="xl:sticky xl:top-8 xl:self-start">
          <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border bg-card p-3">
            <label htmlFor="progress" className="text-sm font-medium">
              Progreso de ejemplo
            </label>
            <input
              id="progress"
              type="range"
              min={0}
              max={1}
              step={1 / Math.max(form.stampsRequired, 10)}
              value={sampleProgress}
              onChange={(e) => setSampleProgress(Number(e.target.value))}
              className="w-40 accent-[hsl(var(--primary))]"
            />
          </div>
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center">
            <AppleWalletPreview model={model} />
            <GoogleWalletPreview model={model} />
          </div>
        </section>
      </div>
    </>
  );
}
