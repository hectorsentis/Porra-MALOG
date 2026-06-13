import type { ReactNode } from "react";
import { CountryLabel } from "@/components/CountryLabel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicShell } from "@/components/shell/PublicShell";
import { PageTitle } from "@/components/PageTitle";
import { CompositionChart, DepartmentChart, TopTenChart } from "@/components/dashboard/DashboardCharts";
import { getPublicDashboard } from "@/lib/public/queries";
import { parsePublicFilters } from "@/lib/public/filters";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { FilterChips } from "@/components/FilterChips";

export const dynamic = "force-dynamic";

function Kpi({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
      </CardContent>
    </Card>
  );
}

type DashboardNextMatch = NonNullable<Awaited<ReturnType<typeof getPublicDashboard>>["nextMatch"]>;

function formatMadridMatchTime(match: DashboardNextMatch) {
  if (!match.fecha) return match.hora ? `${match.hora} Madrid` : "Fecha por confirmar";
  const date = new Date(match.fecha);
  const day = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
  if (match.hora) return `${day} - ${match.hora} Madrid`;
  const time = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
  return `${day} - ${time} Madrid`;
}

function NextMatchValue({ match }: { match: DashboardNextMatch | null }) {
  if (!match) return <span>Calendario pendiente</span>;
  return (
    <span className="block space-y-1">
      <span className="block text-sm font-semibold text-slate-600">{formatMadridMatchTime(match)}</span>
      <span className="flex flex-wrap items-center gap-1 text-base font-bold text-slate-950">
        <CountryLabel value={match.homeTeam} />
        <span className="text-slate-500">vs</span>
        <CountryLabel value={match.awayTeam} />
      </span>
    </span>
  );
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const data = await getPublicDashboard(filters);

  return (
    <PublicShell>
      <PageTitle title="PORRA MUNDIAL 2026 MALOG" subtitle="Clasificacion, apuestas y evolucion de la porra." />
      <PublicFiltersForm filters={filters} compact />
      <FilterChips filters={filters} basePath="/" />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Lider actual" value={data.leader?.alias ?? "Clasificacion abierta"} />
        <Kpi label="Puntos lider" value={data.leader?.pointsTotal ?? 0} />
        <Kpi label="Distancia al segundo" value={data.distanceToSecond ?? 0} />
        <Kpi label="Participantes" value={data.participantsCount} />
        <Kpi label="Puntos repartidos" value={data.distributedPoints} />
        <Kpi label="Partidos computados" value={data.computedMatches} />
        <Kpi label="Ultima actualizacion" value={data.lastUpdatedAt ? new Date(data.lastUpdatedAt).toLocaleString("es-ES") : "Pendiente"} />
        <Kpi label="Proximo partido" value={<NextMatchValue match={data.nextMatch} />} />
      </section>

      <section className="dashboard-grid mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ranking General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {data.ranking.slice(0, 12).map((row) => (
                <div key={row.slug} className="grid grid-cols-[40px_1fr_64px] items-center gap-2 rounded-md border border-slate-100 px-3 py-2">
                  <span className="font-bold text-primary">{row.pos}</span>
                  <span className="truncate font-semibold">{row.alias}</span>
                  <span className="text-right font-bold">{row.pointsTotal}</span>
                </div>
              ))}
              {data.ranking.length === 0 ? <p className="text-sm text-slate-500">No hay participantes con los filtros seleccionados.</p> : null}
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10</CardTitle>
            </CardHeader>
            <CardContent>
              <TopTenChart ranking={data.ranking} />
            </CardContent>
          </Card>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Composicion de puntos</CardTitle>
              </CardHeader>
              <CardContent>
                <CompositionChart composition={data.composition} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Media por departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <DepartmentChart data={data.departmentAverages} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
