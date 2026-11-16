import type { LabeledValue, ProgramDesign, ProgramType } from '@/lib/types';

/** Everything the wallet previews need; built from the editor's live form state. */
export interface PreviewModel {
  businessName: string;
  logoUrl: string | null;
  iconUrl: string | null;
  stripUrl: string | null;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  logoText: string;
  cardTitle: string;
  type: ProgramType;
  stampsRequired: number;
  rewardDescription: string;
  terms: string;
  design: ProgramDesign;
  sample: { customerName: string; stamps: number; balance: number; serial: string };
}

/** Mirrors the backend's buildCardContent() so previews match the real passes. */
export function cardTexts(m: PreviewModel) {
  const isStamps = m.type === 'STAMPS';
  const rewards = isStamps && m.stampsRequired > 0 ? Math.floor(m.sample.stamps / m.stampsRequired) : 0;
  const progressText = isStamps
    ? rewards > 0
      ? `¡Recompensa disponible! (${rewards})`
      : `Te faltan ${Math.max(m.stampsRequired - m.sample.stamps, 0)} sellos`
    : `${m.sample.balance} puntos acumulados`;
  return {
    balanceLabel: isStamps ? 'Sellos' : 'Puntos',
    balanceValue: isStamps ? `${m.sample.stamps}/${m.stampsRequired}` : String(m.sample.balance),
    progressText,
    rewards,
    title: m.cardTitle || m.businessName,
    logoText: m.logoText || m.businessName,
  };
}

export function backFields(m: PreviewModel): LabeledValue[] {
  const d = m.design;
  return [
    { label: 'Recompensa', value: m.rewardDescription },
    ...(d.backFields ?? []),
    ...(d.phone ? [{ label: 'Teléfono', value: d.phone }] : []),
    ...(d.address ? [{ label: 'Dirección', value: d.address }] : []),
    ...(d.website ? [{ label: 'Sitio web', value: d.website }] : []),
    ...(d.links ?? []).map((l) => ({ label: l.label, value: l.url })),
    ...(m.terms ? [{ label: 'Términos y condiciones', value: m.terms }] : []),
    { label: 'Número de tarjeta', value: m.sample.serial },
  ].filter((f) => f.value);
}
