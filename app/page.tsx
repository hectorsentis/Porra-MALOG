import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicShell } from "@/components/shell/PublicShell";
import { PageTitle } from "@/components/PageTitle";
import { CompositionChart, DepartmentChart, TopTenChart } from "@/components/dashboard/DashboardCharts";
import { getPublicDashboard } from "@/lib/public/queries";
import { parsePublicFilters } from "@/lib/public/filters";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { FilterChips } from "@/components/FilterChips";

export const dynamic = "force-dynamic";

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
        <Kpi label="Estado" value={data.ranking.length ? "Publicado" : "Pendiente de apertura"} />
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
