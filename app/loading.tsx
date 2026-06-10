export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-air-page text-slate-500">
      <div className="loading-reticle" aria-hidden />
      <p className="font-display text-sm uppercase tracking-[0.3em]">Cargando</p>
    </div>
  );
}
