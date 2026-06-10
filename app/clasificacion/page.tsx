import Link from "next/link";
import { ClassificationTable } from "@/components/clasificacion/ClassificationTable";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicClassification } from "@/lib/public/queries";
import { parsePublicFilters, type PublicFilters } from "@/lib/public/filters";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { FilterChips } from "@/components/FilterChips";
import { getTemporalClassification } from "@/lib/public/temporal";

export const dynamic = "force-dynamic";

const tabs = [
  ["general", "General"],
  ["diaria", "Clasificacion diaria"],
  ["semanal", "Clasificacion semanal"]
];

function tabHref(tab: string, filters: PublicFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "tab") params.set(key, value);
  }
  params.set("tab", tab);
  return `/clasificacion?${params.toString()}`;
}

function DateFilter({ filters, days }: { filters: PublicFilters; days: string[] }) {
  return (
    <form className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_180px_120px]">
      <input type="hidden" name="tab" value={filters.tab ?? "diaria"} />
      {filters.alias ? <input type="hidden" name="alias" value={filters.alias} /> : null}
      {filters.departamento ? <input type="hidden" name="departamento" value={filters.departamento} /> : null}
      {filters.rango ? <input type="hidden" name="rango" value={filters.rango} /> : null}
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Fecha de partido oficial
        <select name="fecha" defaultValue={filters.fecha ?? ""} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900">
          <option value="">Ultima disponible</option>
          {days.map((day) => <option key={day} value={day}>{day}</option>)}
        </select>
      </label>
      <button className="h-10 self-end rounded-md bg-primary px-4 text-sm font-semibold text-white">Aplicar</button>
    </form>
  );
}

function TemporalTable({ rows }: { rows: Awaited<ReturnType<typeof getTemporalClassification>>["rows"] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Pos</th>
            <th className="px-3 py-2">Alias</th>
            <th className="px-3 py-2">Departamento</th>
            <th className="px-3 py-2">Rango</th>
            <th className="px-3 py-2">Puntos</th>
            <th className="px-3 py-2">Partidos</th>
            <th className="px-3 py-2">KO</th>
            <th className="px-3 py-2">Exactos</th>
            <th className="px-3 py-2">Signos</th>
            <th className="px-3 py-2">Cruces</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.participantId} className="border-t border-slate-100">
              <td className="px-3 py-2 font-bold text-primary">{row.pos}</td>
              <td className="px-3 py-2"><Link className="font-semibold text-primary" href={`/participantes/${row.slug}`}>{row.alias}</Link></td>
              <td className="px-3 py-2">{row.departamento ?? "-"}</td>
              <td className="px-3 py-2">{row.rango ?? "-"}</td>
              <td className="px-3 py-2 font-bold">{row.pointsTotal}</td>
              <td className="px-3 py-2">{row.pointsMatches}</td>
              <td className="px-3 py-2">{row.pointsEliminatorias}</td>
              <td className="px-3 py-2">{row.exactScores}</td>
              <td className="px-3 py-2">{row.correctSigns}</td>
              <td className="px-3 py-2">{row.correctCruces}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ClasificacionPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const activeTab = filters.tab && ["general", "diaria", "semanal"].includes(filters.tab) ? filters.tab : "general";
  const rows = activeTab === "general" ? await getPublicClassification(filters) : [];
  const temporal = activeTab === "diaria" || activeTab === "semanal" ? await getTemporalClassification(filters, activeTab === "diaria" ? "daily" : "weekly") : null;
  return (
    <PublicShell>
      <PageTitle title="Clasificacion" subtitle="Ranking actual, clasificacion diaria y clasificacion de una semana movil de 7 dias." />
      <nav className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <Link key={key} href={tabHref(key, filters)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${activeTab === key ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700"}`}>{label}</Link>
        ))}
      </nav>
      {activeTab === "general" ? <PublicFiltersForm filters={filters} /> : <DateFilter filters={{ ...filters, tab: activeTab }} days={temporal?.availableDays ?? []} />}
      <FilterChips filters={{ ...filters, tab: activeTab }} basePath="/clasificacion" />
      <Card>
        <CardHeader>
          <CardTitle>{activeTab === "general" ? "Clasificacion general" : activeTab === "diaria" ? `Clasificacion diaria ${temporal?.selectedDay ?? ""}` : `Clasificacion semanal ${temporal?.startDay ?? ""} - ${temporal?.endDay ?? ""}`}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === "general" ? <ClassificationTable rows={rows} /> : temporal && temporal.rows.length > 0 ? <TemporalTable rows={temporal.rows} /> : <p className="text-sm text-slate-600">No hay resultados oficiales para el periodo seleccionado.</p>}
        </CardContent>
      </Card>
    </PublicShell>
  );
}
