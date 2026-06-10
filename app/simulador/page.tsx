import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicDashboard } from "@/lib/public/queries";

export const dynamic = "force-dynamic";

export default async function SimuladorPage() {
  const data = await getPublicDashboard();
  return (
    <PublicShell>
      <PageTitle title="Simulador" subtitle="Proyecciones sin sobrescribir resultados oficiales." />
      <Card>
        <CardHeader><CardTitle>Ranking base</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-600">Prueba marcadores y revisa el impacto proyectado antes de publicar resultados oficiales.</p>
          <div className="grid gap-2">
            {data.ranking.slice(0, 8).map((row) => (
              <div key={row.slug} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                <span>{row.alias}</span>
                <strong>{row.pointsTotal}</strong>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PublicShell>
  );
}
