'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

const HEX = /^#[0-9a-fA-F]{6}$/;

export function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: selector`}
          value={HEX.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-card p-1"
        />
        <Input
          id={id}
          value={text}
          maxLength={7}
          className="font-mono uppercase"
          aria-invalid={!HEX.test(text)}
          onChange={(e) => {
            const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
            setText(next);
            if (HEX.test(next)) onChange(next.toUpperCase());
          }}
          onBlur={() => setText(value)}
        />
      </div>
    </div>
  );
}
