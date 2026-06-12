import Link from "next/link";
import { notFound } from "next/navigation";
import { CountryLabel } from "@/components/CountryLabel";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhaseBadge } from "@/components/ui/phase-badge";
import { getPublicMatchDetail } from "@/lib/public/matches";
import { predictionSign } from "@/lib/public/matchStats";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const detail = await getPublicMatchDetail(matchId);
  if (!detail) notFound();
  const { match, prediction, bets, pedometer } = detail;

  return (
    <PublicShell>
      <PageTitle title={<><CountryLabel value={match.homeTeam} /> - <CountryLabel value={match.awayTeam} /></>} subtitle={match.jornadaId ?? "Jornada"} />
      <div className="-mt-3 mb-4"><PhaseBadge fase={match.fase} /></div>
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader><CardTitle>Resumen del partido</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            <div><p className="text-xs uppercase text-slate-500">Estado</p><Badge>{match.statusLabel}</Badge></div>
            <div><p className="text-xs uppercase text-slate-500">Fecha</p><p className="text-2xl font-bold">{match.fecha ? new Date(match.fecha).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" }) : "Por confirmar"}</p>{match.hora ? <p className="text-sm text-slate-500">{match.hora}</p> : null}</div>
            <div><p className="text-xs uppercase text-slate-500">Resultado</p><p className="text-2xl font-bold">{match.resultText ?? "-"}</p></div>
            <div><p className="text-xs uppercase text-slate-500">Puntos</p><p className="text-2xl font-bold">{detail.pointsDistributed}</p></div>
            <div><p className="text-xs uppercase text-slate-500">Exactos</p><p className="text-2xl font-bold">{detail.exactScores}</p></div>
            <div><p className="text-xs uppercase text-slate-500">{"Piedr\u00f3metro"}</p><p className="text-lg font-bold">{pedometer ? <CountryLabel value={pedometer.value} /> : "-"}</p><p className="text-xs text-slate-500">{pedometer ? `${pedometer.detail} · ${pedometer.winners.map((winner) => winner.alias).join(", ")}` : "Sin pedrada"}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mercado 1-X-2</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            {prediction.signRows.map((row) => (
              <div key={row.name} className="rounded-md border border-slate-100 p-3"><p className="text-xs uppercase text-slate-500">{row.name}</p><p className="text-2xl font-bold">{row.value}</p></div>
            ))}
            <div className="col-span-3 text-sm text-slate-600">Resultado mas apostado: <strong>{prediction.mostPredictedResult}</strong> ({prediction.mostPredictedPct}%)</div>
          </CardContent>
        </Card>
      </section>
      <Card className="mt-4">
        <CardHeader><CardTitle>Predicciones publicas</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-2">Alias</th><th className="px-3 py-2">Departamento</th><th className="px-3 py-2">Rango</th><th className="px-3 py-2">Prediccion</th><th className="px-3 py-2">Signo</th><th className="px-3 py-2">Clasificado</th><th className="px-3 py-2">Puntos</th></tr>
            </thead>
            <tbody>
              {bets.map((bet) => {
                const [home, away] = bet.prediction.split("-").map((value) => Number(value));
                return (
                  <tr key={bet.participantId} className="border-t border-slate-100">
                    <td className="px-3 py-2"><Link className="font-semibold text-primary" href={`/participantes/${bet.slug}`}>{bet.alias}</Link></td>
                    <td className="px-3 py-2">{bet.departamento ?? "-"}</td>
                    <td className="px-3 py-2">{bet.rango ?? "-"}</td>
                    <td className="px-3 py-2">{bet.prediction}</td>
                    <td className="px-3 py-2">{Number.isFinite(home) && Number.isFinite(away) ? predictionSign(home, away) : "-"}</td>
                    <td className="px-3 py-2">{bet.predQualifiedTeamId ? <CountryLabel value={bet.predQualifiedTeamId} /> : "-"}</td>
                    <td className="px-3 py-2 font-bold">{bet.pointsTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PublicShell>
  );
}