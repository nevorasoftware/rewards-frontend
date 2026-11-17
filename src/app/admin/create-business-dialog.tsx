'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { api } from '@/lib/api';

interface CreatedBusiness {
  business: { id: string; name: string; slug: string };
  owner: { id: string; email: string };
}

const empty = { businessName: '', slug: '', email: '', password: '' };

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function CreateBusinessDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [slugTouched, setSlugTouched] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      api<CreatedBusiness>('/admin/businesses', {
        method: 'POST',
        body: {
          businessName: form.businessName.trim(),
          slug: form.slug || undefined,
          email: form.email.trim(),
          password: form.password,
        },
      }),
    onSuccess: (r) => {
      toast.success(`${r.business.name} creado`, {
        description: `Comparte con el dueño: ${r.owner.email} y la contraseña. Página: /join/${r.business.slug}`,
      });
      qc.invalidateQueries({ queryKey: ['admin'] });
      setForm(empty);
      setSlugTouched(false);
      setOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden /> Nuevo negocio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo negocio</DialogTitle>
          <DialogDescription>Se crea con su cuenta de dueño y un programa de sellos inicial que podrá editar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nombre del negocio" htmlFor="nb-name">
            <Input
              id="nb-name"
              required
              minLength={2}
              maxLength={80}
              value={form.businessName}
              onChange={(e) =>
                setForm((f) => ({ ...f, businessName: e.target.value, slug: slugTouched ? f.slug : toSlug(e.target.value) }))
              }
            />
          </Field>
          <Field label="Dirección de la página" htmlFor="nb-slug" hint={`Los clientes se registran en /join/${form.slug || 'tu-negocio'}`}>
            <Input
              id="nb-slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={48}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }));
              }}
            />
          </Field>
          <Field label="Email del dueño" htmlFor="nb-email">
            <Input id="nb-email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Contraseña temporal" htmlFor="nb-password" hint="Mínimo 8 caracteres">
            <Input
              id="nb-password"
              type="text"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={create.isPending}>
              Crear negocio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
