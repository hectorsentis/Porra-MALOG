import Link from "next/link";
import { ClassificationTable } from "@/components/clasificacion/ClassificationTable";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClassificationOverview } from "@/lib/public/clasificacion";
import { parsePublicFilters, type PublicFilters } from "@/lib/public/filters";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { FilterChips } from "@/components/FilterChips";
import { getTemporalClassification } from "@/lib/public/temporal";
import { getHistoricalRanking, type HistoricalRanking } from "@/lib/public/historico";
import { DeltaBadge } from "@/components/clasificacion/DeltaBadge";

export const dynamic = "force-dynamic";

const tabs = [
  ["general", "General"],
  ["diaria", "Clasificacion diaria"],
  ["semanal", "Clasificacion semanal"],
  ["historico", "Ranking historico"]
];

const deltaModes = [
  ["both", "Ambos"],
  ["phase", "Solo fase"],
  ["day", "Solo dia"]
] as const;

type DeltaMode = (typeof deltaModes)[number][0];

function tabHref(tab: string, filters: PublicFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "tab") params.set(key, value);
  }
  params.set("tab", tab);
  return `/clasificacion?${params.toString()}`;
}

function deltaHref(delta: DeltaMode, filters: PublicFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "tab") params.set(key, value);
  }
  params.set("tab", "general");
  if (delta !== "both") params.set("delta", delta);
  return `/clasificacion?${params.toString()}`;
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
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
      <button className="h-10 self-end rounded-md bg-primary px-4 text-sm font-semibold text-[#FFFFFF]">Aplicar</button>
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

function HistoricoEventSelector({ filters, historico }: { filters: PublicFilters; historico: HistoricalRanking }) {
  return (
    <form className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_120px]">
      <input type="hidden" name="tab" value="historico" />
      {filters.alias ? <input type="hidden" name="alias" value={filters.alias} /> : null}
      {filters.departamento ? <input type="hidden" name="departamento" value={filters.departamento} /> : null}
      {filters.rango ? <input type="hidden" name="rango" value={filters.rango} /> : null}
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Evento
        <select name="snapshot" defaultValue={historico.selected?.id ?? ""} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900">
          {historico.events.map((event) => (
            <option key={event.id} value={event.id}>
              {new Date(event.createdAt).toLocaleString("es-ES")} — {event.label}{event.isLatest ? " (actual)" : ""}
            </option>
          ))}
        </select>
      </label>
      <button className="h-10 self-end rounded-md bg-primary px-4 text-sm font-semibold text-[#FFFFFF]">Ver</button>
    </form>
  );
}

function HistoricoTable({ rows }: { rows: HistoricalRanking["rows"] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[1000px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Pos</th>
            <th className="px-3 py-2">Δ</th>
            <th className="px-3 py-2">Alias</th>
            <th className="px-3 py-2">Departamento</th>
            <th className="px-3 py-2">Pts totales</th>
            <th className="px-3 py-2">Pts este evento</th>
            <th className="px-3 py-2">Pts grupos</th>
            <th className="px-3 py-2">Pts elim.</th>
            <th className="px-3 py-2">Pts bonus</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.participantId} className="border-t border-slate-100">
              <td className="px-3 py-2 font-bold text-primary">{row.pos}</td>
              <td className="px-3 py-2"><DeltaBadge value={row.deltaPos} /></td>
              <td className="px-3 py-2"><Link className="font-semibold text-primary" href={`/participantes/${row.slug}`}>{row.alias}</Link></td>
              <td className="px-3 py-2">{row.departamento ?? "-"}</td>
              <td className="px-3 py-2 font-bold">{row.pointsTotal}</td>
              <td className="px-3 py-2">{row.pointsGainedThisRun}</td>
              <td className="px-3 py-2">{row.pointsMatches}</td>
              <td className="px-3 py-2">{row.pointsEliminatorias}</td>
              <td className="px-3 py-2">{row.pointsBonus}</td>
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
  const params = await searchParams;
  const filters = parsePublicFilters(params);
  const activeTab = filters.tab && ["general", "diaria", "semanal", "historico"].includes(filters.tab) ? filters.tab : "general";
  const deltaParam = Array.isArray(params.delta) ? params.delta[0] : params.delta;
  const delta: DeltaMode = deltaParam === "phase" || deltaParam === "day" ? deltaParam : "both";
  const snapshotParam = Array.isArray(params.snapshot) ? params.snapshot[0] : params.snapshot;
  const overview = activeTab === "general" ? await getClassificationOverview(filters) : null;
  const temporal = activeTab === "diaria" || activeTab === "semanal" ? await getTemporalClassification(filters, activeTab === "diaria" ? "daily" : "weekly") : null;
  const historico = activeTab === "historico" ? await getHistoricalRanking(filters, snapshotParam) : null;
  return (
    <PublicShell>
      <PageTitle title="Clasificacion" subtitle="Ranking actual, clasificacion diaria y clasificacion de una semana movil de 7 dias." />
      <nav className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <Link key={key} href={tabHref(key, filters)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${activeTab === key ? "border-primary bg-primary text-[#FFFFFF]" : "border-slate-200 bg-white text-slate-700"}`}>{label}</Link>
        ))}
      </nav>
      {activeTab === "general" || activeTab === "historico" ? <PublicFiltersForm filters={filters} compact /> : <DateFilter filters={{ ...filters, tab: activeTab }} days={temporal?.availableDays ?? []} />}
      <FilterChips filters={{ ...filters, tab: activeTab }} basePath="/clasificacion" />
      {activeTab === "historico" && historico ? <HistoricoEventSelector filters={filters} historico={historico} /> : null}
      {activeTab === "general" && overview ? (
        <>
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <strong className="text-slate-950">Fase actual: {overview.currentPhaseGroup ?? "—"}</strong>
            <span className="mx-2 text-slate-400">·</span>
            <span>Δ fase: cambio de posicion desde el inicio de la fase actual</span>
            <span className="mx-2 text-slate-400">·</span>
            <span>Δ dia: cambio de posicion desde {overview.estDayLabel}</span>
          </div>
          <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Lider" value={overview.rows[0] ? `${overview.rows[0].alias} (${overview.rows[0].pointsTotal})` : "—"} />
            <Kpi label="Mayor subida hoy" value={overview.topDayGainer ? `${overview.topDayGainer.alias} (+${overview.topDayGainer.deltaPosDay})` : "—"} />
            <Kpi label="Mayor subida en fase" value={overview.topPhaseGainer ? `${overview.topPhaseGainer.alias} (+${overview.topPhaseGainer.deltaPosPhase})` : "—"} />
            <Kpi label="Partidos computados hoy" value={overview.matchesToday} />
          </section>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">Mostrar deltas:</span>
            {deltaModes.map(([key, label]) => (
              <Link key={key} href={deltaHref(key, filters)} className={`rounded-md border px-3 py-1 text-xs font-semibold ${delta === key ? "border-primary bg-primary text-[#FFFFFF]" : "border-slate-200 bg-white text-slate-700"}`}>{label}</Link>
            ))}
          </div>
        </>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "general"
              ? "Clasificacion general"
              : activeTab === "diaria"
                ? `Clasificacion diaria ${temporal?.selectedDay ?? ""}`
                : activeTab === "semanal"
                  ? `Clasificacion semanal ${temporal?.startDay ?? ""} - ${temporal?.endDay ?? ""}`
                  : historico?.selected
                    ? `Ranking historico — ${historico.selected.label} (${new Date(historico.selected.createdAt).toLocaleString("es-ES")})`
                    : "Ranking historico"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === "general" && overview ? (
            <ClassificationTable
              rows={overview.rows}
              delta={delta}
              topDayGainerAlias={overview.topDayGainer?.alias ?? null}
              topPhaseGainerAlias={overview.topPhaseGainer?.alias ?? null}
            />
          ) : activeTab === "historico" && historico ? (
            historico.rows.length > 0 ? (
              <HistoricoTable rows={historico.rows} />
            ) : (
              <p className="text-sm text-slate-600">No hay eventos historicos todavia.</p>
            )
          ) : temporal && temporal.rows.length > 0 ? (
            <TemporalTable rows={temporal.rows} />
          ) : (
            <p className="text-sm text-slate-600">No hay resultados oficiales para el periodo seleccionado.</p>
          )}
        </CardContent>
      </Card>
    </PublicShell>
  );
}
