'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app-shell';
import { OwnerOnly } from '@/components/owner-only';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Badge, Skeleton, Table, TBody, Td, Th, THead, Tr } from '@/components/ui/misc';
import { api } from '@/lib/api';
import type { TeamMember } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function TeamPage() {
  return (
    <OwnerOnly>
      <Team />
    </OwnerOnly>
  );
}

function Team() {
  const qc = useQueryClient();
  const team = useQuery({ queryKey: ['team'], queryFn: () => api<TeamMember[]>('/team') });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const create = useMutation({
    mutationFn: () => api<TeamMember>('/team', { method: 'POST', body: { email, password } }),
    onSuccess: () => {
      toast.success('Usuario creado', { description: 'Comparte el email y la contraseña con tu colaborador.' });
      setEmail('');
      setPassword('');
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/team/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <>
      <PageHeader title="Equipo" description="El personal solo puede usar el escáner para sumar y canjear." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0">
          {team.isLoading ? (
            <Skeleton className="m-4 h-32" />
          ) : (
            <Table>
              <THead>
                <Tr>
                  <Th>Email</Th>
                  <Th>Rol</Th>
                  <Th className="hidden sm:table-cell">Desde</Th>
                  <Th>
                    <span className="sr-only">Acciones</span>
                  </Th>
                </Tr>
              </THead>
              <TBody>
                {team.data?.map((m) => (
                  <Tr key={m.id}>
                    <Td className="font-medium">{m.email}</Td>
                    <Td>
                      <Badge variant={m.role === 'BUSINESS_OWNER' ? 'default' : 'secondary'}>{m.role === 'BUSINESS_OWNER' ? 'Dueño' : 'Personal'}</Badge>
                    </Td>
                    <Td className="hidden text-muted-foreground sm:table-cell">{formatDate(m.createdAt)}</Td>
                    <Td className="text-right">
                      {m.role === 'BUSINESS_STAFF' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Eliminar a ${m.email}`}
                          onClick={() => confirm(`¿Eliminar a ${m.email}?`) && remove.mutate(m.id)}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agregar personal</CardTitle>
            <CardDescription>Podrá iniciar sesión y escanear tarjetas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Email" htmlFor="staff-email">
                <Input id="staff-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Contraseña temporal" htmlFor="staff-password" hint="Mínimo 8 caracteres">
                <Input id="staff-password" type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Button type="submit" className="w-full" loading={create.isPending}>
                <UserPlus aria-hidden /> Crear usuario
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
