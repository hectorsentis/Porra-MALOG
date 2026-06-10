import { ClassificationTable } from "@/components/clasificacion/ClassificationTable";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicClassification } from "@/lib/public/queries";
import { parsePublicFilters } from "@/lib/public/filters";
import { PublicFiltersForm } from "@/components/PublicFiltersForm";
import { FilterChips } from "@/components/FilterChips";

export const dynamic = "force-dynamic";

export default async function ClasificacionPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePublicFilters(await searchParams);
  const rows = await getPublicClassification(filters);
  return (
    <PublicShell>
      <PageTitle title="Clasificacion" subtitle="Ranking actual con puntos por categoria y movimientos de la jornada." />
      <PublicFiltersForm filters={filters} />
      <FilterChips filters={filters} basePath="/clasificacion" />
      <Card>
        <CardContent>
          <ClassificationTable rows={rows} />
        </CardContent>
      </Card>
    </PublicShell>
  );
}
