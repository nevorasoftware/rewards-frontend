import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StampGrid({ stamps, required, className }: { stamps: number; required: number; className?: string }) {
  const filled = Math.min(stamps, required);
  return (
    <div className={cn('grid grid-cols-5 gap-2', className)} role="img" aria-label={`${filled} de ${required} sellos`}>
      {Array.from({ length: required }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'grid aspect-square place-items-center rounded-full border-2 text-xs font-bold',
            i < filled ? 'border-primary bg-primary text-primary-foreground' : 'border-dashed border-muted-foreground/40 text-muted-foreground',
          )}
        >
          {i < filled ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
        </span>
      ))}
    </div>
  );
}
