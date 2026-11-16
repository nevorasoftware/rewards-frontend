import Link from 'next/link';

export default function JoinNotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">Este programa no está disponible</h1>
        <p className="mt-2 text-muted-foreground">Verifica el enlace o pregunta en el negocio.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-primary hover:underline">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
