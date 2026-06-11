import { clearTestResultsAction, deleteResultAction, saveResultAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { scoreMatch } from "@/lib/game/scoreMatch";
import { getActiveGameRules } from "@/lib/game/ruleConfig";

export const dynamic = "force-dynamic";

const PHASE_ORDER = ["GRUPOS", "R32", "R16", "QF", "SF", "TERCER_PUESTO", "FINAL"];

const PHASE_LABELS: Record<string, string> = {
  GRUPOS: "Fase de grupos",
  R32: "Dieciseisavos de final",
  R16: "Octavos de final",
  QF: "Cuartos de final",
  SF: "Semifinales",
  TERCER_PUESTO: "Tercer y cuarto puesto",
  FINAL: "Final"
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  DRAFT: "Borrador",
  OFFICIAL: "Oficial",
  SIMULATED: "Simulado",
  VOID: "Anulado"
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "border-slate-200 text-slate-500",
  DRAFT: "border-amber-300 bg-amber-50 text-amber-700",
  OFFICIAL: "border-emerald-300 bg-emerald-50 text-emerald-700",
  SIMULATED: "border-sky-300 bg-sky-50 text-sky-700",
  VOID: "border-red-300 bg-red-50 text-red-700"
};

type MatchRowData = {
  matchId: string;
  matchNo: number | null;
  fase: string | null;
  jornadaId: string | null;
  grupo: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  qualifiedTeamId: string | null;
  status: string;
};

type PreviewRow = {
  participantId: string;
  alias: string;
  predHomeGoals: number | null;
  predAwayGoals: number | null;
  predQualifiedTeamId: string | null;
  pointsResult: number;
  pointsQualified: number;
  pointsCruceExacto: number;
  pointsTotal: number;
  spainMatch: boolean;
  multiplier: number;
};

function ProgressBadge({ played, total }: { played: number; total: number }) {
  const complete = total > 0 && played === total;
  return (
    <Badge className={complete ? STATUS_STYLES.OFFICIAL : "border-slate-200 text-slate-500"}>
      {played}/{total} jugados
    </Badge>
  );
}

function PointsPreview({ rows }: { rows: PreviewRow[] }) {
  const scoring = rows.filter((row) => row.pointsTotal > 0).sort((a, b) => b.pointsTotal - a.pointsTotal);
  const totalPoints = scoring.reduce((sum, row) => sum + row.pointsTotal, 0);

  return (
    <details className="mt-2 rounded-md border border-amber-200 bg-amber-50/60">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-2 text-xs font-semibold text-amber-900">
        <span>Vista previa de puntos (borrador, no oficial)</span>
        <Badge className="border-amber-300 bg-white text-amber-800">
          {scoring.length}/{rows.length} participantes · {totalPoints} pts
        </Badge>
      </summary>
      <div className="overflow-x-auto p-2 pt-0">
        {scoring.length === 0 ? (
          <p className="px-1 py-2 text-xs text-amber-900">Con este resultado nadie acertaria puntos.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-amber-900">
                <th className="px-2 py-1">Participante</th>
                <th className="px-2 py-1">Pronostico</th>
                <th className="px-2 py-1">Resultado</th>
                <th className="px-2 py-1">Clasificacion</th>
                <th className="px-2 py-1">Cruce exacto</th>
                <th className="px-2 py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {scoring.map((row) => (
                <tr key={row.participantId} className="border-t border-amber-100">
                  <td className="px-2 py-1 font-medium">{row.alias}</td>
                  <td className="px-2 py-1">
                    {row.predHomeGoals ?? "-"} - {row.predAwayGoals ?? "-"}
                  </td>
                  <td className="px-2 py-1">
                    {row.pointsResult}
                    {row.spainMatch && row.multiplier > 1 ? ` (x${row.multiplier})` : ""}
                  </td>
                  <td className="px-2 py-1">{row.pointsQualified}</td>
                  <td className="px-2 py-1">{row.pointsCruceExacto}</td>
                  <td className="px-2 py-1 font-semibold">{row.pointsTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </details>
  );
}

function MatchRow({ match, showQualified, preview }: { match: MatchRowData; showQualified: boolean; preview?: PreviewRow[] }) {
  return (
    <div className="rounded-md border border-slate-100 p-3">
      <form
        action={saveResultAction}
        className={cn(
          "grid items-center gap-2 md:grid-cols-[1fr_64px_64px_auto_auto_auto]",
          showQualified && "md:grid-cols-[1fr_64px_64px_1fr_auto_auto]"
        )}
      >
        <input type="hidden" name="matchId" value={match.matchId} />
        <div>
          <p className="text-sm font-semibold">
            #{match.matchNo ?? "-"} {match.homeTeam ?? "Local"} - {match.awayTeam ?? "Visitante"}
          </p>
          <p className="text-xs text-slate-500">{match.jornadaId ?? "Jornada"}</p>
        </div>
        <input
          aria-label="Goles local"
          className="h-10 rounded-md border border-slate-200 px-2 text-sm"
          name="homeGoals"
          defaultValue={match.homeGoals ?? ""}
          type="number"
          min="0"
        />
        <input
          aria-label="Goles visitante"
          className="h-10 rounded-md border border-slate-200 px-2 text-sm"
          name="awayGoals"
          defaultValue={match.awayGoals ?? ""}
          type="number"
          min="0"
        />
        {showQualified ? (
          <select
            aria-label="Equipo clasificado"
            name="qualifiedTeamId"
            defaultValue={match.qualifiedTeamId ?? ""}
            className="h-10 rounded-md border border-slate-200 px-2 text-sm"
          >
            <option value="">Quien clasifica...</option>
            {match.homeTeamId ? <option value={match.homeTeamId}>{match.homeTeam ?? match.homeTeamId}</option> : null}
            {match.awayTeamId ? <option value={match.awayTeamId}>{match.awayTeam ?? match.awayTeamId}</option> : null}
          </select>
        ) : null}
        <Badge className={cn("justify-self-start", STATUS_STYLES[match.status] ?? "")}>
          {STATUS_LABELS[match.status] ?? match.status}
        </Badge>
        <div className="flex gap-2">
          <Button name="intent" value="draft" variant="secondary">
            Borrador
          </Button>
          <Button name="intent" value="official">
            Oficial
          </Button>
          {match.status !== "PENDING" ? (
            <ConfirmButton
              formAction={deleteResultAction}
              variant="danger"
              confirmMessage={`Borrar el resultado de #${match.matchNo ?? match.matchId} (${match.homeTeam ?? "Local"} - ${match.awayTeam ?? "Visitante"})? Esto lo deja pendiente y recalcula la clasificacion si era oficial.`}
            >
              Borrar
            </ConfirmButton>
          ) : null}
        </div>
      </form>
      {preview ? <PointsPreview rows={preview} /> : null}
    </div>
  );
}

export default async function AdminResultadosPage() {
  await requireAdmin();
  let matches: MatchRowData[] = [];
  try {
    matches = await prisma.match.findMany({
      orderBy: [{ fecha: "asc" }, { matchNo: "asc" }],
      select: {
        matchId: true,
        matchNo: true,
        fase: true,
        jornadaId: true,
        grupo: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: true,
        awayTeam: true,
        homeGoals: true,
        awayGoals: true,
        qualifiedTeamId: true,
        status: true
      }
    });
  } catch {
    matches = [];
  }

  const totalPlayed = matches.filter((match) => match.status === "OFFICIAL").length;

  const draftMatches = matches.filter((match) => match.status === "DRAFT" && match.homeGoals != null && match.awayGoals != null);
  const previewsByMatch = new Map<string, PreviewRow[]>();
  if (draftMatches.length > 0) {
    const draftMatchIds = draftMatches.map((match) => match.matchId);
    const [rules, bets, participants] = await Promise.all([
      getActiveGameRules(),
      prisma.betMatch.findMany({ where: { matchId: { in: draftMatchIds } } }),
      prisma.participant.findMany({ select: { participantId: true, alias: true } })
    ]);
    const aliasById = new Map(participants.map((participant) => [participant.participantId, participant.alias]));
    const betsByMatch = new Map<string, typeof bets>();
    for (const bet of bets) {
      const list = betsByMatch.get(bet.matchId) ?? [];
      list.push(bet);
      betsByMatch.set(bet.matchId, list);
    }
    for (const match of draftMatches) {
      const matchBets = betsByMatch.get(match.matchId) ?? [];
      const rows: PreviewRow[] = matchBets.map((bet) => {
        const score = scoreMatch(
          {
            betId: bet.betId,
            participantId: bet.participantId,
            matchId: bet.matchId,
            fase: bet.fase,
            predHomeTeamId: bet.predHomeTeamId,
            predAwayTeamId: bet.predAwayTeamId,
            predHomeGoals: bet.predHomeGoals,
            predAwayGoals: bet.predAwayGoals,
            predQualifiedTeamId: bet.predQualifiedTeamId
          },
          {
            matchId: match.matchId,
            fase: match.fase,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            homeGoals: match.homeGoals,
            awayGoals: match.awayGoals,
            qualifiedTeamId: match.qualifiedTeamId,
            finished: true
          },
          rules
        );
        return {
          participantId: bet.participantId,
          alias: aliasById.get(bet.participantId) ?? bet.participantId,
          predHomeGoals: bet.predHomeGoals,
          predAwayGoals: bet.predAwayGoals,
          predQualifiedTeamId: bet.predQualifiedTeamId,
          pointsResult: score.pointsResult,
          pointsQualified: score.pointsQualified,
          pointsCruceExacto: score.pointsCruceExacto,
          pointsTotal: score.pointsTotal,
          spainMatch: score.spainMatch,
          multiplier: score.multiplier
        };
      });
      previewsByMatch.set(match.matchId, rows);
    }
  }

  const matchesByPhase = new Map<string, MatchRowData[]>();
  for (const match of matches) {
    const fase = match.fase ?? "OTROS";
    const list = matchesByPhase.get(fase) ?? [];
    list.push(match);
    matchesByPhase.set(fase, list);
  }
  const orderedPhases = [...matchesByPhase.keys()].sort((a, b) => {
    const ia = PHASE_ORDER.indexOf(a);
    const ib = PHASE_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return (
    <AdminShell>
      <div className="grid gap-4">
        <Card>
          <CardHeader className="items-center justify-between">
            <CardTitle>Meter resultados online</CardTitle>
            <ProgressBadge played={totalPlayed} total={matches.length} />
          </CardHeader>
          <CardContent>
            <form action={clearTestResultsAction} className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-sm font-semibold text-amber-950">Inicio de produccion</p>
              <p className="mb-3 text-sm text-amber-900">Limpia marcadores cargados durante pruebas y deja todos los partidos pendientes.</p>
              <Button name="intent" value="clear" variant="secondary">
                Limpiar resultados de prueba
              </Button>
            </form>
          </CardContent>
        </Card>

        {matches.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">No hay partidos cargados.</p>
            </CardContent>
          </Card>
        ) : null}

        {orderedPhases.map((fase) => {
          const list = matchesByPhase.get(fase)!;
          const phaseLabel = PHASE_LABELS[fase] ?? fase;

          if (fase === "GRUPOS") {
            const matchesByGroup = new Map<string, MatchRowData[]>();
            for (const match of list) {
              const grupo = match.grupo ?? "?";
              const groupList = matchesByGroup.get(grupo) ?? [];
              groupList.push(match);
              matchesByGroup.set(grupo, groupList);
            }
            const orderedGroups = [...matchesByGroup.keys()].sort();

            return (
              <Card key={fase}>
                <CardHeader>
                  <CardTitle>{phaseLabel}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {orderedGroups.map((grupo) => {
                    const groupMatches = matchesByGroup.get(grupo)!;
                    const played = groupMatches.filter((match) => match.status === "OFFICIAL").length;
                    const complete = played === groupMatches.length;
                    return (
                      <details key={grupo} open={!complete} className="rounded-md border border-slate-100">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 text-sm font-semibold">
                          <span>Grupo {grupo}</span>
                          <ProgressBadge played={played} total={groupMatches.length} />
                        </summary>
                        <div className="grid gap-2 p-3 pt-0">
                          {groupMatches.map((match) => (
                            <MatchRow key={match.matchId} match={match} showQualified={false} preview={previewsByMatch.get(match.matchId)} />
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </CardContent>
              </Card>
            );
          }

          const played = list.filter((match) => match.status === "OFFICIAL").length;
          return (
            <Card key={fase}>
              <CardHeader className="items-center justify-between">
                <CardTitle>{phaseLabel}</CardTitle>
                <ProgressBadge played={played} total={list.length} />
              </CardHeader>
              <CardContent className="grid gap-2">
                {list.map((match) => (
                  <MatchRow key={match.matchId} match={match} showQualified preview={previewsByMatch.get(match.matchId)} />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
