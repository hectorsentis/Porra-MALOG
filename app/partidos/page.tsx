import Link from "next/link";
import { CountryLabel } from "@/components/CountryLabel";
import { FilterChips } from "@/components/FilterChips";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PhaseBadge } from "@/components/ui/phase-badge";
import { parsePublicFilters } from "@/lib/public/filters";
import { getMatchFilterOptions, getPublicMatches } from "@/lib/public/matches";

export const dynamic = "force-dynamic";

const matchFilterFields = ["fase", "grupo", "jornada", "equipo", "estado"] as const;
type MatchFilterField = (typeof matchFilterFields)[number];

function fieldLabels(field: MatchFilterField) {
  return {
    fase: "Fase",
    grupo: "Grupo",
    jornada: "Jornada",
    equipo: "Equipo",
    estado: "Estado"
  }[field] ?? field;
}

type Pedometer = {
  mode: string;
  value: string;
  detail: string;
  winners: Array<{ alias: string; slug: string }>;
} | null;

function PedometerSummary({ pedometer }: { pedometer: Pedometer }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{"Piedr\u00f3metro"}</p>
      {pedometer ? (
        <>
          <p className="text-lg font-bold"><CountryLabel value={pedometer.value} /></p>
          <p className="text-xs text-slate-500">{pedometer.detail}</p>
          <p className="mt-1 truncate text-xs font-semibold text-primary">
            {pedometer.winners.slice(0, 2).map((winner, index) => (
              <span key={winner.slug || winner.alias}>{index > 0 ? ", " : ""}<Link href={`/participantes/${winner.slug}`}>{winner.alias}</Link></span>
            ))}
            {pedometer.winners.length > 2 ? ` +${pedometer.winners.length - 2}` : ""}
          </p>
        </>
      ) : (
        <p className="text-sm font-semibold text-slate-500">Sin pedrada</p>
      )}
    </div>
  );
}
function statusClass(status: string) {
  if (status === "OFFICIAL") return "border-air-up text-air-up";
  if (status === "DRAFT") return "border-air-gold text-air-gold";
  if (status === "VOID") return "border-air-down text-air-down";
  return "text-slate-600";
}

export default async function PartidosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parsePublicFilters(await searchParams);
  const [matches, options] = await Promise.all([getPublicMatches(filters), getMatchFilterOptions()]);

  return (
    <PublicShell>
      <PageTitle title="Partidos" subtitle={"Calendario del Mundial, marcadores oficiales y term\u00f3metro de la grada de la porra."} />
      <form className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-7">
        {matchFilterFields.map((field) => (
          <label key={field} className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fieldLabels(field)}
            <select name={field} defaultValue={filters[field] ?? ""} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900">
              <option value="">Todos</option>
              {(options[field] ?? []).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Desde
          <input name="fechaDesde" type="date" defaultValue={filters.fechaDesde ?? ""} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900" />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Hasta
          <input name="fechaHasta" type="date" defaultValue={filters.fechaHasta ?? ""} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900" />
        </label>        <button className="h-10 self-end rounded-md bg-primary px-4 text-sm font-semibold text-[#FFFFFF]">Filtrar</button>
      </form>
      <FilterChips filters={filters} basePath="/partidos" />
      <div className="grid gap-3">
        {matches.map((match) => (
          <Card key={match.matchId}>
            <CardContent className="grid gap-3 lg:grid-cols-[1fr_120px_130px_110px_130px_170px] lg:items-center">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge className={statusClass(match.status)}>{match.statusLabel}</Badge>
                  <PhaseBadge fase={match.fase} />
                  <span className="text-xs font-semibold uppercase text-slate-500">{match.jornadaId ?? "Jornada"}</span>
                </div>
                <Link href={`/partidos/${match.matchId}`} className="text-lg font-bold text-primary"><CountryLabel value={match.homeTeam} /> vs <CountryLabel value={match.awayTeam} /></Link>
                <p className="text-sm text-slate-600">{match.fecha ? new Date(match.fecha).toLocaleDateString("es-ES") : "Fecha por confirmar"} {match.hora ?? ""}</p>
              </div>
              <div><p className="text-xs uppercase text-slate-500">Marcador</p><p className="text-2xl font-bold">{match.resultText ?? "-"}</p></div>
              <div><p className="text-xs uppercase text-slate-500">Puntos de la porra</p><p className="text-2xl font-bold">{match.pointsDistributed}</p></div>
              <div><p className="text-xs uppercase text-slate-500">Exactos</p><p className="text-2xl font-bold">{match.exactScores}</p></div>
              <div><p className="text-xs uppercase text-slate-500">Marcador favorito</p><p className="text-lg font-bold">{match.prediction.mostPredictedResult}</p><p className="text-xs text-slate-500">{match.prediction.mostPredictedPct}%</p></div>
              <PedometerSummary pedometer={match.pedometer} />
            </CardContent>
          </Card>
        ))}
        {matches.length === 0 ? <Card><CardContent><p className="text-sm text-slate-600">No hay partidos con los filtros seleccionados.</p></CardContent></Card> : null}
      </div>
    </PublicShell>
  );
}

