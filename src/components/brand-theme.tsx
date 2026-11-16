import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Exposes a business's colors as CSS variables (--brand-bg/fg/label) for its subtree. */
export function BrandTheme({
  colors,
  className,
  children,
}: {
  colors: { backgroundColor: string; foregroundColor: string; labelColor: string };
  className?: string;
  children: ReactNode;
}) {
  const style = {
    '--brand-bg': colors.backgroundColor,
    '--brand-fg': colors.foregroundColor,
    '--brand-label': colors.labelColor,
  } as CSSProperties;
  return (
    <div style={style} className={cn(className)}>
      {children}
    </div>
  );
}
