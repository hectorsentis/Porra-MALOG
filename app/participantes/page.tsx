import Link from "next/link";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicClassification } from "@/lib/public/queries";

export const dynamic = "force-dynamic";

export default async function ParticipantesPage() {
  const rows = await getPublicClassification();
  return (
    <PublicShell>
      <PageTitle title="Participantes" subtitle="Directorio publico por alias." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Link key={row.slug} href={`/participantes/${row.slug}`}>
            <Card className="transition hover:border-primary">
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{row.alias}</p>
                    <p className="text-sm text-slate-500">{row.departamento ?? "Sin departamento"} · {row.rango ?? "Sin rango"}</p>
                  </div>
                  <strong className="text-primary">#{row.pos}</strong>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PublicShell>
  );
}
