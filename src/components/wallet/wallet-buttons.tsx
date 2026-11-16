import { cn } from '@/lib/utils';

/*
 * "Add to Apple Wallet" / "Add to Google Wallet" buttons following each brand's
 * badge layout (black pill, wallet glyph, two-line label). For production you can
 * swap these for the official localized badge artwork from Apple and Google.
 */

function AppleWalletGlyph() {
  return (
    <svg viewBox="0 0 32 24" className="h-7 w-9" aria-hidden>
      <rect x="1" y="1" width="30" height="22" rx="4" fill="#fff" />
      <rect x="3" y="4" width="26" height="5" rx="1.5" fill="#3B82F6" />
      <rect x="3" y="7.5" width="26" height="5" rx="1.5" fill="#F59E0B" />
      <rect x="3" y="11" width="26" height="5" rx="1.5" fill="#22C55E" />
      <rect x="3" y="14.5" width="26" height="5" rx="1.5" fill="#EF4444" />
      <path d="M1 16h9.5a5.5 5.5 0 0 0 11 0H31v3a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4z" fill="#E5E7EB" />
    </svg>
  );
}

function GoogleWalletGlyph() {
  return (
    <svg viewBox="0 0 32 24" className="h-7 w-9" aria-hidden>
      <rect x="2" y="2" width="28" height="9" rx="3" fill="#EA4335" />
      <rect x="2" y="6" width="28" height="9" rx="3" fill="#FBBC04" />
      <rect x="2" y="10" width="28" height="9" rx="3" fill="#34A853" />
      <path d="M2 14h10a4 4 0 0 0 8 0h10v5a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill="#4285F4" />
    </svg>
  );
}

interface WalletButtonProps {
  href: string | null;
  disabledReason?: string;
  className?: string;
}

function WalletButton({ href, disabledReason, className, glyph, line1, line2 }: WalletButtonProps & { glyph: React.ReactNode; line1: string; line2: string }) {
  const content = (
    <>
      {glyph}
      <span className="flex flex-col text-left leading-tight">
        <span className="text-[11px] font-medium">{line1}</span>
        <span className="text-[17px] font-semibold">{line2}</span>
      </span>
    </>
  );
  const base = cn(
    'inline-flex h-14 min-w-[220px] items-center justify-center gap-3 rounded-xl bg-black px-5 text-white shadow-md transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black',
    className,
  );
  if (!href || disabledReason) {
    return (
      <span className={cn(base, 'cursor-not-allowed opacity-50')} aria-disabled title={disabledReason}>
        {content}
      </span>
    );
  }
  return (
    <a href={href} className={cn(base, 'hover:scale-[1.02] active:scale-[0.98]')} rel="noopener">
      {content}
    </a>
  );
}

export function AppleWalletButton(props: WalletButtonProps) {
  return <WalletButton {...props} glyph={<AppleWalletGlyph />} line1="Agregar a" line2="Apple Wallet" />;
}

export function GoogleWalletButton(props: WalletButtonProps) {
  return <WalletButton {...props} glyph={<GoogleWalletGlyph />} line1="Agregar a" line2="Google Wallet" />;
}
