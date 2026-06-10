export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
