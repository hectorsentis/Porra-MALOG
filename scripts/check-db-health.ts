import { prisma } from "@/lib/prisma";

type ActivityRow = {
  total: bigint;
  active: bigint;
  idle: bigint;
  waiting: bigint;
};

async function main() {
  const startedAt = Date.now();

  const result = await prisma.$transaction(async (tx) => {
    const connectionStartedAt = Date.now();
    await tx.$queryRaw`SELECT 1`;
    const connectionMs = Date.now() - connectionStartedAt;

    const activityStartedAt = Date.now();
    const [activity] = await tx.$queryRaw<ActivityRow[]>`
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE state = 'active')::bigint AS active,
        COUNT(*) FILTER (WHERE state = 'idle')::bigint AS idle,
        COUNT(*) FILTER (WHERE wait_event IS NOT NULL)::bigint AS waiting
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;
    const activityMs = Date.now() - activityStartedAt;

    const rankingStartedAt = Date.now();
    const rankingRows = await tx.generalRanking.count();
    const rankingMs = Date.now() - rankingStartedAt;

    return { connectionMs, activityMs, rankingMs, activity, rankingRows };
  }, { maxWait: 5_000, timeout: 5_000 });

  console.log("Database health: OK");
  console.log(`Connection check: ${result.connectionMs} ms`);
  console.log(`Activity check: ${result.activityMs} ms`);
  console.log(`Classification check: ${result.rankingMs} ms (${result.rankingRows} rows)`);
  console.log(
    `Connections: total=${Number(result.activity?.total ?? 0)}, active=${Number(result.activity?.active ?? 0)}, idle=${Number(result.activity?.idle ?? 0)}, waiting=${Number(result.activity?.waiting ?? 0)}`
  );
  console.log(`Total elapsed: ${Date.now() - startedAt} ms`);
}

main()
  .catch(() => {
    console.error("Database health: UNAVAILABLE (check pool and Supabase logs)");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
