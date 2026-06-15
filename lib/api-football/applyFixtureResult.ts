import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { API_FOOTBALL_FINISHED_STATUSES } from "./constants";
import type { ApiFootballLiveFixture } from "./client";

export type SyncWithMatch = {
  id: string;
  matchId: string;
  apiMatchId: number;
  lastHomeGoals: number | null;
  lastAwayGoals: number | null;
  lastStatus: string | null;
  match: {
    matchId: string;
    matchNo: number | null;
    fase: string | null;
    jornadaId: string | null;
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeGoals: number | null;
    awayGoals: number | null;
    homePens: number | null;
    awayPens: number | null;
    status: MatchStatus;
  };
};

export function qualifiedFromFixture(match: { homeTeamId: string | null; awayTeamId: string | null }, fixture: ApiFootballLiveFixture) {
  if (fixture.homeWinner === true) return match.homeTeamId;
  if (fixture.awayWinner === true) return match.awayTeamId;
  if (fixture.homeGoals != null && fixture.awayGoals != null && fixture.homeGoals !== fixture.awayGoals) {
    return fixture.homeGoals > fixture.awayGoals ? match.homeTeamId : match.awayTeamId;
  }
  if (fixture.homePens != null && fixture.awayPens != null && fixture.homePens !== fixture.awayPens) {
    return fixture.homePens > fixture.awayPens ? match.homeTeamId : match.awayTeamId;
  }
  return null;
}

export async function applyFixtureResult(
  sync: SyncWithMatch,
  fixture: ApiFootballLiveFixture,
  now: Date,
  createdBy: string
): Promise<{ changed: boolean; isFinished: boolean }> {
  const isFinished = fixture.status != null && API_FOOTBALL_FINISHED_STATUSES.has(fixture.status);
  const changed =
    fixture.homeGoals !== sync.lastHomeGoals ||
    fixture.awayGoals !== sync.lastAwayGoals ||
    fixture.status !== sync.lastStatus ||
    fixture.homeGoals !== sync.match.homeGoals ||
    fixture.awayGoals !== sync.match.awayGoals;

  if (!changed) {
    await prisma.apiFootballSync.update({
      where: { id: sync.id },
      data: { lastPolledAt: now, lastStatus: fixture.status, lastError: null }
    });
    return { changed: false, isFinished };
  }

  const qualifiedTeamId = isFinished ? qualifiedFromFixture(sync.match, fixture) : null;
  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { matchId: sync.matchId },
      data: {
        homeGoals: fixture.homeGoals,
        awayGoals: fixture.awayGoals,
        homePens: fixture.homePens,
        awayPens: fixture.awayPens,
        qualifiedTeamId,
        status: isFinished ? MatchStatus.OFFICIAL : MatchStatus.DRAFT,
        finished: isFinished,
        resultText: fixture.homeGoals == null || fixture.awayGoals == null ? null : `${fixture.homeGoals}-${fixture.awayGoals}`,
        goalDiff: fixture.homeGoals == null || fixture.awayGoals == null ? null : fixture.homeGoals - fixture.awayGoals
      }
    });
    await tx.apiFootballSync.update({
      where: { id: sync.id },
      data: {
        isPollingActive: !isFinished,
        lastPolledAt: now,
        lastStatus: fixture.status,
        lastHomeGoals: fixture.homeGoals,
        lastAwayGoals: fixture.awayGoals,
        lastError: null
      }
    });
    await tx.matchResultEvent.create({
      data: {
        matchId: sync.matchId,
        eventType: isFinished ? "API_FOOTBALL_OFFICIAL" : "API_FOOTBALL_LIVE_UPDATE",
        previousStatus: sync.match.status,
        nextStatus: isFinished ? MatchStatus.OFFICIAL : MatchStatus.DRAFT,
        previousHomeGoals: sync.match.homeGoals,
        previousAwayGoals: sync.match.awayGoals,
        nextHomeGoals: fixture.homeGoals,
        nextAwayGoals: fixture.awayGoals,
        qualifiedTeamId,
        phase: sync.match.fase,
        matchday: sync.match.jornadaId,
        createdBy
      }
    });
  });

  return { changed: true, isFinished };
}
