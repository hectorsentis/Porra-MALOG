// Diagnostic: check R32 matches and their scoring state
// Usage: npx tsx --tsconfig tsconfig.json scripts/diagnose-ko.ts
import { prisma } from "@/lib/prisma";

async function main() {
  const koMatches = await prisma.match.findMany({
    where: { fase: { not: "GRUPOS" } },
    orderBy: { matchNo: "asc" },
    select: {
      matchId: true, matchNo: true, fase: true, status: true, finished: true,
      homeTeam: true, awayTeam: true, homeTeamId: true, awayTeamId: true,
      homeGoals: true, awayGoals: true, qualifiedTeamId: true,
      homeSlot: true, awaySlot: true
    }
  });

  console.log(`\n=== ${koMatches.length} partidos de eliminatorias ===\n`);
  console.log(`${"Match".padEnd(8)} ${"Fase".padEnd(12)} ${"Status".padEnd(10)} ${"Fin".padEnd(5)} ${"Home".padEnd(18)} ${"Away".padEnd(18)} ${"Score".padEnd(6)} ${"Qualif".padEnd(6)} ${"Slots".padEnd(20)}`);
  console.log("-".repeat(115));

  for (const m of koMatches) {
    const score = m.homeGoals != null && m.awayGoals != null ? `${m.homeGoals}-${m.awayGoals}` : "null";
    console.log(
      `${(m.matchId ?? "").padEnd(8)} ${(m.fase ?? "").padEnd(12)} ${m.status.padEnd(10)} ${String(m.finished).padEnd(5)} ` +
      `${(m.homeTeam ?? m.homeTeamId ?? "-").padEnd(18)} ${(m.awayTeam ?? m.awayTeamId ?? "-").padEnd(18)} ` +
      `${score.padEnd(6)} ${(m.qualifiedTeamId ?? "-").padEnd(6)} ${(m.homeSlot ?? "").padEnd(9)} ${m.awaySlot ?? ""}`
    );
  }

  // Check bets for official KO matches
  const officialKo = koMatches.filter((m) => m.status === "OFFICIAL");
  if (officialKo.length > 0) {
    console.log(`\n=== Bets y scoring para ${officialKo.length} partidos KO oficiales ===\n`);
    for (const m of officialKo) {
      const betsCount = await prisma.betMatch.count({ where: { matchId: m.matchId } });
      const scoringCount = await prisma.scoringMatch.count({ where: { matchId: m.matchId } });
      const sampleBet = await prisma.betMatch.findFirst({
        where: { matchId: m.matchId },
        select: { participantId: true, predQualifiedTeamId: true, predHomeTeamId: true, predAwayTeamId: true, fase: true }
      });
      console.log(`${m.matchId}: ${m.homeTeam} vs ${m.awayTeam} (${m.status}, finished=${m.finished}, goals=${m.homeGoals}-${m.awayGoals}, qualified=${m.qualifiedTeamId})`);
      console.log(`  Bets: ${betsCount}, ScoringMatch: ${scoringCount}`);
      if (sampleBet) {
        console.log(`  Sample bet: fase=${sampleBet.fase}, predQualified=${sampleBet.predQualifiedTeamId}, predHome=${sampleBet.predHomeTeamId}, predAway=${sampleBet.predAwayTeamId}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERROR:", e);
  await prisma.$disconnect();
  process.exit(1);
});
