import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-2xl font-bold">Página no encontrada</h1>
        <Link href="/" className="mt-6 inline-block font-semibold text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
