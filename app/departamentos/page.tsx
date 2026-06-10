import { DepartmentChart } from "@/components/dashboard/DashboardCharts";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicDashboard } from "@/lib/public/queries";
import { parsePublicFilters } from "@/lib/public/filters";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { FilterChips } from "@/components/FilterChips";

export const dynamic = "force-dynamic";

export default async function DepartamentosPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const data = await getPublicDashboard(filters);
  return (
    <PublicShell>
      <PageTitle title="Departamentos" subtitle="Medias, volumen de participantes y rendimiento por unidad." />
      <PublicFiltersForm filters={filters} />
      <FilterChips filters={filters} basePath="/departamentos" />
      <Card>
        <CardHeader><CardTitle>Media por departamento</CardTitle></CardHeader>
        <CardContent>
          <DepartmentChart data={data.departmentAverages} />
        </CardContent>
      </Card>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {data.departmentAverages.map((row) => (
          <Card key={row.departamento}>
            <CardContent>
              <p className="font-bold">{row.departamento}</p>
              <p className="text-sm text-slate-600">{row.participants} participantes · media {row.averagePoints}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PublicShell>
  );
}
