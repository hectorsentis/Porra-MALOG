// Diagnose why M073 has no ScoringMatch records
// Usage: npx tsx --tsconfig tsconfig.json scripts/diagnose-scoring.ts
import { prisma } from "@/lib/prisma";
import { isOfficialMatchForScoring } from "@/lib/game/matchStatus";
import { scoreMatch } from "@/lib/game/scoreMatch";
import { getActiveGameRules } from "@/lib/game/ruleConfig";

async function main() {
  const match = await prisma.match.findUnique({ where: { matchId: "M073" } });
  if (!match) { console.log("M073 not found"); return; }

  console.log("=== Match M073 ===");
  console.log(`status=${match.status}, finished=${match.finished}, homeGoals=${match.homeGoals}, awayGoals=${match.awayGoals}`);
  console.log(`homeTeamId=${match.homeTeamId}, awayTeamId=${match.awayTeamId}, qualifiedTeamId=${match.qualifiedTeamId}`);
  console.log(`overrideQualifiedTeamId=${match.overrideQualifiedTeamId}`);
  console.log(`fase=${match.fase}`);
  console.log(`isOfficialForScoring=${isOfficialMatchForScoring(match)}`);

  const bets = await prisma.betMatch.findMany({ where: { matchId: "M073" }, take: 3 });
  console.log(`\n=== ${bets.length} sample bets ===`);
  const rules = await getActiveGameRules();

  for (const bet of bets) {
    console.log(`\nBet: participant=${bet.participantId}, fase=${bet.fase}`);
    console.log(`  predHome=${bet.predHomeTeamId}, predAway=${bet.predAwayTeamId}, predQualified=${bet.predQualifiedTeamId}`);

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
        qualifiedTeamId: match.overrideQualifiedTeamId ?? match.qualifiedTeamId,
        finished: match.finished
      },
      rules
    );
    console.log(`  Score: qualifiedOk=${score.qualifiedOk}, cruceExactoOk=${score.cruceExactoOk}, pointsTotal=${score.pointsTotal}`);
  }

  const scoringCount = await prisma.scoringMatch.count({ where: { matchId: "M073" } });
  const totalScoring = await prisma.scoringMatch.count();
  console.log(`\nScoringMatch for M073: ${scoringCount}`);
  console.log(`Total ScoringMatch records: ${totalScoring}`);

  // Check if M073 bets' matchIds actually match
  const allBets = await prisma.betMatch.findMany({ where: { matchId: "M073" } });
  console.log(`\nBetMatch records for M073: ${allBets.length}`);

  // Check all scoring by fase
  const scoringByFase = await prisma.scoringMatch.groupBy({ by: ["fase"], _count: { _all: true } });
  console.log("\nScoring records by fase:");
  for (const row of scoringByFase) {
    console.log(`  ${row.fase}: ${row._count._all}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERROR:", e);
  await prisma.$disconnect();
  process.exit(1);
});
