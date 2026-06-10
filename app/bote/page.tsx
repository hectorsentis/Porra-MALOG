import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { PrizePieChart } from "@/components/statistics/StatisticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicBote } from "@/lib/public/bote";

export const dynamic = "force-dynamic";

function Money({ value }: { value: number }) {
  return <>{value.toFixed(2)} EUR</>;
}

export default async function BotePage() {
  const bote = await getPublicBote();

  return (
    <PublicShell>
      <PageTitle title="Bote" subtitle="Premios y reglas de reparto de la PORRA MUNDIAL 2026 MALOG." />
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Distribucion de premios</CardTitle></CardHeader>
          <CardContent>
            <PrizePieChart data={bote.prizes} />
          </CardContent>
        </Card>
        <div className="grid gap-3">
          <Card><CardContent><p className="text-xs uppercase text-slate-500">Bote total</p><p className="text-3xl font-bold text-primary"><Money value={bote.total} /></p></CardContent></Card>
          <Card><CardContent><p className="text-xs uppercase text-slate-500">Participantes incluidos</p><p className="text-3xl font-bold">{bote.includedParticipants}</p></CardContent></Card>
          <Card><CardContent><p className="text-xs uppercase text-slate-500">Aportacion base</p><p className="text-3xl font-bold"><Money value={bote.amountPerParticipant} /></p></CardContent></Card>
        </div>
      </section>
      <Card className="mt-4">
        <CardHeader><CardTitle>Reglas del reparto</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-700">{bote.rules}</p>
        </CardContent>
      </Card>
    </PublicShell>
  );
}
