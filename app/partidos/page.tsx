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

const matchFilterFields = ["fase", "grupo", "jornada", "equipo", "estado", "fecha"] as const;
type MatchFilterField = (typeof matchFilterFields)[number];

function fieldLabels(field: MatchFilterField) {
  return {
    fase: "Fase",
    grupo: "Grupo",
    jornada: "Jornada",
    equipo: "Equipo",
    estado: "Estado",
    fecha: "Fecha"
  }[field] ?? field;
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
      <PageTitle title="Partidos" subtitle="Calendario del Mundial, marcadores oficiales y termómetro de la grada de la porra." />
      <form className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-6">
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
        <button className="h-10 self-end rounded-md bg-primary px-4 text-sm font-semibold text-[#FFFFFF]">Filtrar</button>
      </form>
      <FilterChips filters={filters} basePath="/partidos" />
      <div className="grid gap-3">
        {matches.map((match) => (
          <Card key={match.matchId}>
            <CardContent className="grid gap-3 lg:grid-cols-[1fr_140px_140px_140px_120px] lg:items-center">
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
            </CardContent>
          </Card>
        ))}
        {matches.length === 0 ? <Card><CardContent><p className="text-sm text-slate-600">No hay partidos con los filtros seleccionados.</p></CardContent></Card> : null}
      </div>
    </PublicShell>
  );
}

