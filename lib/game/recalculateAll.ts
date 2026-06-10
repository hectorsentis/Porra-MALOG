import { PrismaClient } from "@prisma/client";
import { calculateRanking } from "./ranking";
import { scoreMatch } from "./scoreMatch";

export function isOfficialMatchForScoring(match: {
  status?: string | null;
  finished?: boolean | null;
  homeGoals?: number | null;
  awayGoals?: number | null;
}) {
  return match.status === "OFFICIAL" && match.finished === true && match.homeGoals != null && match.awayGoals != null;
}

export type RecalculateAllOptions = {
  trigger?: string;
  matchId?: string | null;
  eventLabel?: string | null;
  createdBy?: string | null;
};

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

  try {
    const [participants, bets, matches, previous] = await Promise.all([
      prisma.participant.findMany(),
      prisma.betMatch.findMany(),
      prisma.match.findMany(),
      prisma.classification.findMany()
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
          }
        );
      })
      .filter((score): score is NonNullable<typeof score> => Boolean(score));

    const pointsMatchesByParticipant = new Map<string, number>();
    const pointsKoByParticipant = new Map<string, number>();
    for (const score of scores) {
      const isGroupPhase = (score.fase ?? "").toLocaleUpperCase("es-ES").includes("GRUPO");
      const target = isGroupPhase ? pointsMatchesByParticipant : pointsKoByParticipant;
      target.set(score.participantId, (target.get(score.participantId) ?? 0) + score.pointsTotal);
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
          pointsGroups: prev?.pointsGroups ?? 0,
          pointsEliminatorias: pointsKoByParticipant.get(participant.participantId) ?? 0,
          pointsBonus: prev?.pointsBonus ?? 0,
          previousPos: prev?.pos,
          previousPoints: prev?.pointsTotal
        };
      })
    );

    await prisma.$transaction(async (tx) => {
      await tx.scoringMatch.deleteMany();
      await tx.classification.deleteMany();
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
      await tx.classification.createMany({
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
          deltaPos: row.deltaPos,
          deltaPoints: row.deltaPoints
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
          matchday: eventMatch?.jornadaId
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
