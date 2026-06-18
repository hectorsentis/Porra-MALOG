// Replays every match result in chronological order, calling recalculateAll() after each one.
// Each call creates a full snapshot of the ranking at that moment, rebuilding the entire
// scoring history from scratch.
//
// Usage: npx tsx --tsconfig tsconfig.json scripts/replay-results.ts
import { prisma } from "@/lib/prisma";
import { recalculateAll } from "@/lib/game/recalculateAll";
import { MatchStatus } from "@prisma/client";

async function main() {
  // 1. Load all matches that have results, in kick-off order
  const matches = await prisma.match.findMany({
    where: { status: MatchStatus.OFFICIAL, finished: true, homeGoals: { not: null }, awayGoals: { not: null } },
    orderBy: [{ kickoffTime: "asc" }, { fecha: "asc" }, { matchNo: "asc" }]
  });

  if (matches.length === 0) {
    console.error("No hay partidos OFFICIAL con resultado. Ejecuta apply-results.ts primero.");
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`\n${matches.length} partidos con resultado encontrados.\n`);

  // 2. Wipe scoring tables and all snapshot history so we start from zero
  console.log("Limpiando tablas de scoring e historial de snapshots...");
  await prisma.$transaction([
    prisma.scoringMatch.deleteMany(),
    prisma.scoringGroup.deleteMany(),
    prisma.scoringBonus.deleteMany(),
    prisma.generalRanking.deleteMany(),
    // deleting RankingSnapshot cascades to RankingSnapshotRow + ParticipantScoreSnapshot
    prisma.rankingSnapshot.deleteMany()
  ]);
  console.log("✓ Tablas limpiadas.\n");

  // 3. Temporarily set all to DRAFT so scoring reflects only played matches at each step
  await prisma.match.updateMany({
    where: { matchId: { in: matches.map((m) => m.matchId) } },
    data: { status: MatchStatus.DRAFT }
  });
  console.log(`${matches.length} partidos → DRAFT (temporal para replay)\n`);

  // 4. Replay match by match
  let errors = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const label = `M${String(m.matchNo ?? i + 1).padStart(3, "0")}: ${m.homeTeam ?? "Local"} ${m.homeGoals}-${m.awayGoals} ${m.awayTeam ?? "Visitante"}`;

    // Restore this match to OFFICIAL so the engine scores it
    await prisma.match.update({
      where: { matchId: m.matchId },
      data: { status: MatchStatus.OFFICIAL }
    });

    try {
      const result = await recalculateAll(prisma, {
        trigger: "match-result",
        matchId: m.matchId,
        eventLabel: label,
        createdBy: "replay-script"
      });

      const leader = result.ranking[0];
      console.log(
        `[${String(i + 1).padStart(2)}/${matches.length}] ${label}` +
        ` | líder: ${leader?.alias ?? "-"} (${leader?.pointsTotal ?? 0} pts)`
      );
    } catch (e) {
      errors++;
      console.error(`[${i + 1}/${matches.length}] ERROR en ${m.matchId}: ${e instanceof Error ? e.message : String(e)}`);
      // Keep going — match is already OFFICIAL so it won't be lost
    }
  }

  // 5. Summary
  const [snapshotCount, scoringMatchCount, rankingCount] = await Promise.all([
    prisma.rankingSnapshot.count(),
    prisma.scoringMatch.count(),
    prisma.generalRanking.count()
  ]);
  const latestSnapshot = await prisma.rankingSnapshot.findFirst({ where: { isLatest: true } });

  console.log("\n=== Resultado final ===");
  console.log(`  Snapshots creados : ${snapshotCount}`);
  console.log(`  ScoringMatch filas: ${scoringMatchCount}`);
  console.log(`  Ranking (participantes): ${rankingCount}`);
  console.log(`  Snapshot actual   : "${latestSnapshot?.label ?? "(ninguno)"}"`);
  if (errors > 0) console.error(`  Errores: ${errors}`);
  else console.log("  Sin errores ✓");

  console.log("\n--- Clasificación final (top 10) ---");
  const top10 = await prisma.generalRanking.findMany({
    orderBy: { pos: "asc" },
    take: 10,
    include: { participant: { select: { alias: true } } }
  });
  top10.forEach((row) =>
    console.log(`  ${String(row.pos).padStart(2)}. ${(row.participant?.alias ?? row.participantId).padEnd(26)} ${String(row.pointsTotal).padStart(4)} pts`)
  );

  await prisma.$disconnect();
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("\nERROR FATAL:", e);
  await prisma.$disconnect();
  process.exit(1);
});
