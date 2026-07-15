import { afterEach, describe, expect, it, vi } from "vitest";

describe("database pool safety", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/prisma");
    vi.resetModules();
  });

  it("runs the statistics queries without overlapping database access", async () => {
    let activeQueries = 0;
    let peakQueries = 0;

    const guardedQuery = <T>(result: T) => vi.fn(async () => {
      activeQueries += 1;
      peakQueries = Math.max(peakQueries, activeQueries);
      if (activeQueries > 1) throw new Error("overlapping database query");
      await new Promise((resolve) => setTimeout(resolve, 2));
      activeQueries -= 1;
      return result;
    });

    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        generalRanking: { findMany: guardedQuery([]) },
        participantScoreSnapshot: { findMany: guardedQuery([]) },
        betBonus: { findMany: guardedQuery([]) },
        scoringMatch: { findMany: guardedQuery([]) },
        betMatch: { findMany: guardedQuery([]) },
        boteConfig: { findUnique: guardedQuery(null) }
      }
    }));

    const { getAdvancedStatistics } = await import("@/lib/public/statistics");
    await expect(getAdvancedStatistics({})).resolves.toBeDefined();
    expect(peakQueries).toBe(1);
  });
});
