'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

/** Staff users are restricted to the scanner; owner-only pages redirect them there. */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const isOwner = user?.role === 'BUSINESS_OWNER';
  useEffect(() => {
    if (user && !isOwner) router.replace('/dashboard/scanner');
  }, [user, isOwner, router]);
  return isOwner ? <>{children}</> : null;
}
