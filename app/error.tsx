"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <section className="w-full max-w-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">No hemos podido actualizar los datos</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          El servicio está temporalmente ocupado. Inténtalo de nuevo en unos minutos.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mx-auto mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
      </section>
    </main>
  );
}
