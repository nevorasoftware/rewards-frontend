import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-accent/60 to-background px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
