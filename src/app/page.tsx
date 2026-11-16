import { ArrowRight, BarChart3, Palette, QrCode, ScanLine, Smartphone, Zap } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Smartphone, title: 'Apple Wallet y Google Wallet', text: 'Tus clientes guardan la tarjeta en su teléfono. Sin descargar apps.' },
  { icon: Zap, title: 'Se actualiza sola', text: 'Cada sello o punto se refleja al instante en la wallet del cliente.' },
  { icon: Palette, title: 'Con tu marca', text: 'Logo, colores e imagen propia, con vista previa en vivo de ambas wallets.' },
  { icon: ScanLine, title: 'Escáner para tu equipo', text: 'Escanea el QR con la cámara del celular y suma o canjea en segundos.' },
  { icon: QrCode, title: 'Registro con un QR', text: 'Imprime el QR de tu mostrador: el cliente se registra en 10 segundos.' },
  { icon: BarChart3, title: 'Métricas claras', text: 'Tarjetas emitidas, clientes activos, puntos otorgados y canjes por día.' },
];

function DemoCard({ className, bg, fg, label, title, value }: { className?: string; bg: string; fg: string; label: string; title: string; value: string }) {
  return (
    <div className={`w-64 rounded-2xl p-4 shadow-2xl ring-1 ring-black/5 ${className}`} style={{ background: bg, color: fg }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: label }}>
          Sellos
        </span>
      </div>
      <div className="mt-6 grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="aspect-square rounded-full border-2"
            style={{ borderColor: label, background: i < 6 ? label : 'transparent' }}
          />
        ))}
      </div>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: label }}>
            Recompensa
          </p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-md bg-white">
          <QrCode className="h-9 w-9 text-black" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">Crear cuenta gratis</Link>
          </Button>
        </nav>
      </header>

      <main>
        <section className="container grid items-center gap-12 py-12 md:grid-cols-2 md:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <Smartphone className="h-3.5 w-3.5" aria-hidden /> Tarjetas digitales de lealtad
            </span>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Tu tarjeta de sellos, ahora en la{' '}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">wallet</span> de tus clientes.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Crea un programa de puntos o sellos para tu negocio, emítelo en Apple Wallet y Google Wallet, y haz que tus clientes
              vuelvan más seguido.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">
                  Empezar ahora <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/join/cafe-aroma">Ver tarjeta de ejemplo</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto h-[360px] w-full max-w-md" aria-hidden>
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-violet-200 via-fuchsia-100 to-amber-100 blur-3xl" />
            <DemoCard className="absolute left-0 top-6 -rotate-6" bg="#3E2723" fg="#FFF8E1" label="#FFCC80" title="Café Aroma" value="Café gratis" />
            <DemoCard className="absolute right-0 top-28 rotate-6" bg="#0F766E" fg="#F0FDFA" label="#99F6E4" title="Lavandería Zen" value="Lavado gratis" />
          </div>
        </section>

        <section className="container pb-20">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">Todo lo que necesitas para fidelizar</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Rewards Wallet
      </footer>
    </div>
  );
}
