import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { PrizePieChart } from "@/components/statistics/StatisticsCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicBote } from "@/lib/public/bote";

export const dynamic = "force-dynamic";

function Money({ value, currency }: { value: number; currency: string }) {
  return <>{value.toFixed(2)} {currency}</>;
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
          <Card><CardContent><p className="text-xs uppercase text-slate-500">Bote total</p><p className="text-3xl font-bold text-primary"><Money value={bote.total} currency={bote.currency} /></p></CardContent></Card>
          {bote.prizes.map((prize) => (
            <Card key={prize.name}><CardContent><p className="text-xs uppercase text-slate-500">{prize.name}</p><p className="text-3xl font-bold"><Money value={prize.value} currency={bote.currency} /></p></CardContent></Card>
          ))}
        </div>
      </section>
      <Card className="mt-4">
        <CardHeader><CardTitle>Reglas del reparto</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-700">{bote.rules}</p>
          {bote.balance !== 0 ? <p className="mt-3 text-sm font-semibold text-air-gold">La suma de premios difiere del bote configurado en {bote.balance.toFixed(2)} {bote.currency}.</p> : null}
        </CardContent>
      </Card>
    </PublicShell>
  );
}