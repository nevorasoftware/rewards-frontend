'use client';

import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

export interface MessageInput {
  title: string;
  body: string;
}

/** Title + body form for wallet messages, with a live notification preview. */
export function MessageForm({
  idPrefix,
  submitLabel,
  loading,
  disabled,
  onSubmit,
}: {
  idPrefix: string;
  submitLabel: string;
  loading?: boolean;
  disabled?: boolean;
  onSubmit: (input: MessageInput, reset: () => void) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ title: title.trim(), body: body.trim() }, () => {
      setTitle('');
      setBody('');
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Título" htmlFor={`${idPrefix}-title`} hint={`${title.length}/60`}>
        <Input
          id={`${idPrefix}-title`}
          required
          minLength={2}
          maxLength={60}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej.: 2x1 en capuchinos"
        />
      </Field>
      <Field label="Mensaje" htmlFor={`${idPrefix}-body`} hint={`${body.length}/300`}>
        <Textarea
          id={`${idPrefix}-body`}
          required
          minLength={2}
          maxLength={300}
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ej.: Solo hoy, presenta tu tarjeta en caja."
        />
      </Field>
      {(title || body) && (
        <div aria-label="Vista previa de la notificación" className="rounded-xl border bg-muted/50 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Vista previa</p>
          <p className="mt-1 font-semibold">{title || 'Título'}</p>
          <p className="text-muted-foreground">{body || 'Mensaje'}</p>
        </div>
      )}
      <Button type="submit" className="w-full" loading={loading} disabled={disabled}>
        <Send aria-hidden /> {submitLabel}
      </Button>
    </form>
  );
}
