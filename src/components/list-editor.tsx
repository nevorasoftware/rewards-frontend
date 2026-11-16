'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';

/** Editable list of two-field rows (label/value or label/url). */
export function ListEditor<T extends { [K in keyof T]: string }>({
  idPrefix,
  rows,
  onChange,
  max,
  keys,
  placeholders,
  addLabel,
  multiline = false,
}: {
  idPrefix: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  max: number;
  keys: [keyof T & string, keyof T & string];
  placeholders: [string, string];
  addLabel: string;
  multiline?: boolean;
}) {
  const [k1, k2] = keys;
  const update = (index: number, key: string, value: string) =>
    onChange(rows.map((r, i) => (i === index ? ({ ...r, [key]: value } as T) : r)));

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-start gap-2">
          <Input
            aria-label={`${placeholders[0]} ${index + 1}`}
            id={`${idPrefix}-${index}-a`}
            value={row[k1]}
            placeholder={placeholders[0]}
            maxLength={40}
            className="w-2/5"
            onChange={(e) => update(index, k1, e.target.value)}
          />
          {multiline ? (
            <Textarea
              aria-label={`${placeholders[1]} ${index + 1}`}
              value={row[k2]}
              placeholder={placeholders[1]}
              rows={2}
              maxLength={500}
              className="min-h-10 flex-1"
              onChange={(e) => update(index, k2, e.target.value)}
            />
          ) : (
            <Input
              aria-label={`${placeholders[1]} ${index + 1}`}
              value={row[k2]}
              placeholder={placeholders[1]}
              className="flex-1"
              onChange={(e) => update(index, k2, e.target.value)}
            />
          )}
          <Button type="button" variant="ghost" size="icon" aria-label="Eliminar" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
            <Trash2 aria-hidden />
          </Button>
        </div>
      ))}
      {rows.length < max && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { [k1]: '', [k2]: '' } as T])}>
          <Plus aria-hidden /> {addLabel}
        </Button>
      )}
    </div>
  );
}
