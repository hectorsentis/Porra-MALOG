import { DepartmentChart } from "@/components/dashboard/DashboardCharts";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { SimpleBarChart } from "@/components/statistics/StatisticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicDashboard } from "@/lib/public/queries";
import { parsePublicFilters } from "@/lib/public/filters";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { FilterChips } from "@/components/FilterChips";
import { getAdvancedStatistics } from "@/lib/public/statistics";

export const dynamic = "force-dynamic";

export default async function DepartamentosPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const [data, stats] = await Promise.all([getPublicDashboard(filters), getAdvancedStatistics(filters)]);
  return (
    <PublicShell>
      <PageTitle title="Departamentos" subtitle="Medias, volumen de participantes y rendimiento por unidad y rango." />
      <PublicFiltersForm filters={filters} />
      <FilterChips filters={filters} basePath="/departamentos" />

      <Card className="mb-4">
        <CardHeader><CardTitle>Media de puntos por rango</CardTitle></CardHeader>
        <CardContent>
          {stats.ranges.length > 0 ? <SimpleBarChart data={stats.ranges} nameKey="rango" valueKey="average" /> : <p className="text-sm text-slate-600">No hay rangos con los filtros seleccionados.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Media por departamento</CardTitle></CardHeader>
          <CardContent>
            <DepartmentChart data={data.departmentAverages} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Volumen por rango</CardTitle></CardHeader>
          <CardContent>
            {stats.ranges.length > 0 ? <SimpleBarChart data={stats.ranges} nameKey="rango" valueKey="participants" /> : <p className="text-sm text-slate-600">No hay rangos con los filtros seleccionados.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {data.departmentAverages.map((row) => (
          <Card key={row.departamento}>
            <CardContent>
              <p className="font-bold">{row.departamento}</p>
              <p className="text-sm text-slate-600">{row.participants} participantes - media {row.averagePoints}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Detalle por rango</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-2">Rango</th><th className="px-3 py-2">Participantes</th><th className="px-3 py-2">Media</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Min</th><th className="px-3 py-2">Max</th><th className="px-3 py-2">MVP</th></tr>
              </thead>
              <tbody>
                {stats.ranges.map((row) => (
                  <tr key={row.rango} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold">{row.rango}</td>
                    <td className="px-3 py-2">{row.participants}</td>
                    <td className="px-3 py-2 font-bold text-primary">{row.average}</td>
                    <td className="px-3 py-2">{row.total}</td>
                    <td className="px-3 py-2">{row.min}</td>
                    <td className="px-3 py-2">{row.max}</td>
                    <td className="px-3 py-2">{row.mvp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PublicShell>
  );
}
