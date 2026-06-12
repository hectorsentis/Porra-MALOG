import type { ReactNode } from "react";

export function PageTitle({ title, subtitle }: { title: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-slate-950">{title}</h1>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
