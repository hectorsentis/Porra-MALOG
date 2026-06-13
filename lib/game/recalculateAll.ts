import { PrismaClient } from "@prisma/client";
import { calculateRanking } from "./ranking";
import { scoreMatch } from "./scoreMatch";
import { scoreGroups } from "./scoreGroups";
import { computeGroupStandings } from "./groupStandings";
import { getActiveGameRules } from "./ruleConfig";
import { isOfficialMatchForScoring } from "./matchStatus";
import { getEstDayKey } from "@/lib/utils/timezone";
import type { GroupStandingInput } from "./types";

export { isOfficialMatchForScoring } from "./matchStatus";

export type RecalculateAllOptions = {
  trigger?: string;
  matchId?: string | null;
  eventLabel?: string | null;
  createdBy?: string | null;
};

export function phaseGroupOf(fase: string | null | undefined, jornadaId: string | null | undefined): string | null {
  if (!fase) return null;
  if (fase === "GRUPOS") return jornadaId ?? null;
  if (fase === "TERCER_PUESTO") return "SF";
  return fase;
}

export async function recalculateAll(prisma: PrismaClient, options: RecalculateAllOptions = {}) {
  const startedAt = new Date();
  const trigger = options.trigger ?? "manual";
  const eventMatch = options.matchId
    ? await prisma.match.findUnique({
        where: { matchId: options.matchId },
        select: { matchId: true, fase: true, jornadaId: true, matchNo: true, homeTeam: true, awayTeam: true }
      })
    : null;
  const eventLabel =
    options.eventLabel ??
    (eventMatch
      ? `Partido ${eventMatch.matchNo ?? eventMatch.matchId}: ${eventMatch.homeTeam ?? "Local"} - ${eventMatch.awayTeam ?? "Visitante"}`
      : "Recalculo general");
  const run = await prisma.recalculationRun.create({
    data: {
      status: "RUNNING",
      trigger,
      matchId: eventMatch?.matchId,
      phase: eventMatch?.fase,
      matchday: eventMatch?.jornadaId,
      createdBy: options.createdBy,
      startedAt
    }
  });

  const todayKeyEst = getEstDayKey(startedAt);
  const currentPhaseGroup = phaseGroupOf(eventMatch?.fase, eventMatch?.jornadaId);

  try {
    const [participants, bets, matches, previous, rules, teams, groupBets, lastPhaseSnapshot, lastDaySnapshot] = await Promise.all([
      prisma.participant.findMany(),
      prisma.betMatch.findMany(),
      prisma.match.findMany(),
      prisma.generalRanking.findMany(),
      getActiveGameRules(),
      prisma.team.findMany(),
      prisma.betGroupPosition.findMany(),
      prisma.rankingSnapshot.findFirst({
        where: { trigger: "phase-start" },
        orderBy: { createdAt: "desc" },
        include: { rows: true }
      }),
      prisma.rankingSnapshot.findFirst({
        where: { trigger: "day-start", dayKey: todayKeyEst },
        orderBy: { createdAt: "asc" },
        include: { rows: true }
      })
    ]);

    const matchById = new Map(matches.map((match) => [match.matchId, match]));
    const previousByParticipant = new Map(previous.map((row) => [row.participantId, row]));

    const scores = bets
      .map((bet) => {
        const match = matchById.get(bet.matchId);
        if (!match || !isOfficialMatchForScoring(match)) return null;
        return scoreMatch(
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
            qualifiedTeamId: match.overrideQualifiedTeamId ?? match.qualifiedTeamId,
            finished: match.finished
          },
          rules
        );
      })
      .filter((score): score is NonNullable<typeof score> => Boolean(score));

    const bump = (map: Map<string, number>, key: string, amount = 1) => map.set(key, (map.get(key) ?? 0) + amount);

    const pointsMatchesByParticipant = new Map<string, number>();
    const pointsKoByParticipant = new Map<string, number>();
    const exactScoresByParticipant = new Map<string, number>();
    const correctDiffByParticipant = new Map<string, number>();
    const correctSignsByParticipant = new Map<string, number>();
    const correctCrucesByParticipant = new Map<string, number>();
    for (const score of scores) {
      const isGroupPhase = (score.fase ?? "").toLocaleUpperCase("es-ES").includes("GRUPO");
      const target = isGroupPhase ? pointsMatchesByParticipant : pointsKoByParticipant;
      target.set(score.participantId, (target.get(score.participantId) ?? 0) + score.pointsTotal);
      if (score.exactOk) bump(exactScoresByParticipant, score.participantId);
      if (score.diffOk) bump(correctDiffByParticipant, score.participantId);
      if (score.signOk) bump(correctSignsByParticipant, score.participantId);
      if (score.cruceExactoOk) bump(correctCrucesByParticipant, score.participantId);
    }

    const teamsByGroup = teams.map((team) => ({ teamId: team.teamId, grupo: team.grupo, tieBreakerRank: team.tieBreakerRank, fifaRank: team.fifaRank }));
    const groupStandingsResult = computeGroupStandings(matches, teamsByGroup);
    const standingInputs: GroupStandingInput[] = groupStandingsResult.standings.map((row) => ({
      grupo: row.grupo,
      teamId: row.teamId,
      pos: row.pos,
      status: row.qualified ? "clasificado" : "out"
    }));
    const groupScores = scoreGroups(
      groupBets.map((bet) => ({
        groupBetId: bet.groupBetId,
        participantId: bet.participantId,
        grupo: bet.grupo,
        predPos: bet.predPos,
        predTeamId: bet.predTeamId,
        valid: bet.valid
      })),
      standingInputs,
      rules
    );

    const pointsGroupsByParticipant = new Map<string, number>();
    const correctGroupQualifiedByParticipant = new Map<string, number>();
    const correctGroupPositionsByParticipant = new Map<string, number>();
    for (const score of groupScores) {
      bump(pointsGroupsByParticipant, score.participantId, score.pointsTotal);
      if (score.qualifiedOk) bump(correctGroupQualifiedByParticipant, score.participantId);
      if (score.exactPositionOk) bump(correctGroupPositionsByParticipant, score.participantId);
    }

    const ranking = calculateRanking(
      participants.map((participant) => {
        const prev = previousByParticipant.get(participant.participantId);
        return {
          participantId: participant.participantId,
          alias: participant.alias,
          departamento: participant.departamento,
          rango: participant.rango,
          pointsMatches: pointsMatchesByParticipant.get(participant.participantId) ?? 0,
          pointsGroups: pointsGroupsByParticipant.get(participant.participantId) ?? 0,
          pointsEliminatorias: pointsKoByParticipant.get(participant.participantId) ?? 0,
          pointsBonus: prev?.pointsBonus ?? 0,
          previousPos: prev?.pos,
          previousPoints: prev?.pointsTotal
        };
      })
    );

    const phaseBaseline = currentPhaseGroup
      ? new Map(
          (lastPhaseSnapshot && lastPhaseSnapshot.phaseGroup === currentPhaseGroup ? lastPhaseSnapshot.rows : previous).map(
            (row) => [row.participantId, row.pos] as const
          )
        )
      : null;
    const dayBaseline = new Map((lastDaySnapshot ? lastDaySnapshot.rows : previous).map((row) => [row.participantId, row.pos] as const));

    const deltaPosPhaseByParticipant = new Map<string, number | null>();
    const deltaPosDayByParticipant = new Map<string, number | null>();
    for (const row of ranking) {
      const phaseFrom = phaseBaseline?.get(row.participantId);
      deltaPosPhaseByParticipant.set(row.participantId, phaseFrom != null ? phaseFrom - row.pos : null);
      const dayFrom = dayBaseline.get(row.participantId);
      deltaPosDayByParticipant.set(row.participantId, dayFrom != null ? dayFrom - row.pos : null);
    }

    const buildMarkerRows = (snapshotId: string, label: string) =>
      previous.map((row) => ({
        snapshotId,
        participantId: row.participantId,
        alias: row.alias,
        departamento: row.departamento,
        rango: row.rango,
        pos: row.pos,
        previousPos: null,
        deltaPos: row.deltaPos,
        deltaPoints: row.deltaPoints,
        pointsMatches: row.pointsMatches,
        pointsGroups: row.pointsGroups,
        pointsEliminatorias: row.pointsEliminatorias,
        pointsBonus: row.pointsBonus,
        pointsTotal: row.pointsTotal,
        pointsGainedThisRun: 0,
        eventLabel: label,
        phase: null,
        matchday: null,
        matchId: null
      }));

    await prisma.$transaction(async (tx) => {
      // Para J1, este marcador se creó tarde (cuando esta lógica se desplegó, M001 y M002
      // ya estaban recalculados), por lo que su `previous` reflejaba "tras M001+M002" en
      // vez de "tras M001". Se corrigió una sola vez a mano (UPDATE de RankingSnapshotRow +
      // GeneralRanking.deltaPosPhase) para que "Inicio de fase J1" represente el estado
      // tras M001. Para J2+ no hace falta corrección: `previous` ya será "fin de la fase
      // anterior" en el momento correcto.
      if (currentPhaseGroup && previous.length > 0 && (!lastPhaseSnapshot || lastPhaseSnapshot.phaseGroup !== currentPhaseGroup)) {
        const label = `Inicio de fase ${currentPhaseGroup}`;
        const phaseMarker = await tx.rankingSnapshot.create({
          data: {
            label,
            source: "engine",
            isLatest: false,
            trigger: "phase-start",
            phaseGroup: currentPhaseGroup,
            recalculationRunId: run.id
          }
        });
        await tx.rankingSnapshotRow.createMany({ data: buildMarkerRows(phaseMarker.id, label) });
      }

      if (!lastDaySnapshot && previous.length > 0) {
        const label = `Inicio del dia ${todayKeyEst}`;
        const dayMarker = await tx.rankingSnapshot.create({
          data: {
            label,
            source: "engine",
            isLatest: false,
            trigger: "day-start",
            dayKey: todayKeyEst,
            recalculationRunId: run.id
          }
        });
        await tx.rankingSnapshotRow.createMany({ data: buildMarkerRows(dayMarker.id, label) });
      }

      await tx.scoringMatch.deleteMany();
      await tx.scoringGroup.deleteMany();
      await tx.generalRanking.deleteMany();
      await tx.scoringMatch.createMany({
        data: scores.map((score) => ({
          betId: score.betId,
          participantId: score.participantId,
          matchId: score.matchId,
          fase: score.fase,
          exactOk: score.exactOk,
          diffOk: score.diffOk,
          signOk: score.signOk,
          qualifiedOk: score.qualifiedOk,
          cruceExactoOk: score.cruceExactoOk,
          spainMatch: score.spainMatch,
          multiplier: score.multiplier,
          pointsResult: score.pointsResult,
          pointsQualified: score.pointsQualified,
          pointsCruceExacto: score.pointsCruceExacto,
          pointsTotal: score.pointsTotal
        }))
      });
      await tx.scoringGroup.createMany({
        data: groupScores.map((score) => ({
          groupBetId: score.groupBetId,
          participantId: score.participantId,
          grupo: score.grupo,
          predPos: score.predPos,
          predTeamId: score.predTeamId,
          realPos: score.realPos,
          realStatus: score.realStatus,
          qualifiedOk: score.qualifiedOk,
          exactPositionOk: score.exactPositionOk,
          pointsQualified: score.pointsQualified,
          pointsPosition: score.pointsPosition,
          pointsTotal: score.pointsTotal
        }))
      });
      await tx.generalRanking.createMany({
        data: ranking.map((row) => ({
          pos: row.pos,
          participantId: row.participantId,
          alias: row.alias,
          departamento: row.departamento,
          rango: row.rango,
          pointsMatches: row.pointsMatches,
          pointsGroups: row.pointsGroups,
          pointsEliminatorias: row.pointsEliminatorias,
          pointsBonus: row.pointsBonus,
          pointsTotal: row.pointsTotal,
          exactScores: exactScoresByParticipant.get(row.participantId) ?? 0,
          correctDiff: correctDiffByParticipant.get(row.participantId) ?? 0,
          correctSigns: correctSignsByParticipant.get(row.participantId) ?? 0,
          correctGroupQualified: correctGroupQualifiedByParticipant.get(row.participantId) ?? 0,
          correctGroupPositions: correctGroupPositionsByParticipant.get(row.participantId) ?? 0,
          correctCruces: correctCrucesByParticipant.get(row.participantId) ?? 0,
          deltaPos: row.deltaPos,
          deltaPoints: row.deltaPoints,
          deltaPosPhase: deltaPosPhaseByParticipant.get(row.participantId) ?? null,
          deltaPosDay: deltaPosDayByParticipant.get(row.participantId) ?? null
        }))
      });
      await tx.rankingSnapshot.updateMany({ where: { isLatest: true }, data: { isLatest: false } });
      const snapshot = await tx.rankingSnapshot.create({
        data: {
          label: eventLabel,
          source: "engine",
          isLatest: true,
          eventLabel,
          matchId: eventMatch?.matchId,
          phase: eventMatch?.fase,
          matchday: eventMatch?.jornadaId,
          recalculationRunId: run.id
        }
      });
      const snapshotRows = ranking.map((row) => {
        const previousRow = previousByParticipant.get(row.participantId);
        const pointsGainedThisRun = previousRow == null ? row.pointsTotal : row.pointsTotal - previousRow.pointsTotal;
        return {
          snapshotId: snapshot.id,
          participantId: row.participantId,
          alias: row.alias,
          departamento: row.departamento,
          rango: row.rango,
          pos: row.pos,
          previousPos: previousRow?.pos,
          deltaPos: row.deltaPos,
          deltaPoints: row.deltaPoints,
          pointsMatches: row.pointsMatches,
          pointsGroups: row.pointsGroups,
          pointsEliminatorias: row.pointsEliminatorias,
          pointsBonus: row.pointsBonus,
          pointsTotal: row.pointsTotal,
          pointsGainedThisRun,
          eventLabel,
          phase: eventMatch?.fase,
          matchday: eventMatch?.jornadaId,
          matchId: eventMatch?.matchId
        };
      });
      await tx.rankingSnapshotRow.createMany({ data: snapshotRows });
      await tx.participantScoreSnapshot.createMany({ data: snapshotRows });
      await tx.recalculationRun.update({
        where: { id: run.id },
        data: { status: "SUCCESS", finishedAt: new Date(), affectedParticipants: ranking.length }
      });
    });

    return { runId: run.id, affectedParticipants: ranking.length, ranking };
  } catch (error) {
    await prisma.recalculationRun.update({
      where: { id: run.id },
      data: { status: "FAILED", finishedAt: new Date(), message: error instanceof Error ? error.message : String(error) }
    });
    throw error;
  }
}

