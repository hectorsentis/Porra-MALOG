// Simulates the scoring pipeline from recalculateAll without writing
// Usage: npx tsx --tsconfig tsconfig.json scripts/diagnose-recalc.ts
import { prisma } from "@/lib/prisma";
import { isOfficialMatchForScoring } from "@/lib/game/matchStatus";
import { scoreMatch } from "@/lib/game/scoreMatch";
import { getActiveGameRules } from "@/lib/game/ruleConfig";

async function main() {
  const [bets, matches, rules] = await Promise.all([
    prisma.betMatch.findMany(),
    prisma.match.findMany(),
    getActiveGameRules()
  ]);

  const matchById = new Map(matches.map((m) => [m.matchId, m]));

  const scorable = matches.filter((m) => isOfficialMatchForScoring(m));
  console.log(`Total matches: ${matches.length}`);
  console.log(`Scorable matches: ${scorable.length}`);
  console.log(`Scorable by fase:`);
  const byFase = new Map<string, number>();
  for (const m of scorable) {
    byFase.set(m.fase ?? "null", (byFase.get(m.fase ?? "null") ?? 0) + 1);
  }
  for (const [fase, count] of byFase) console.log(`  ${fase}: ${count}`);

  console.log(`\nTotal bets: ${bets.length}`);
  const betsByFase = new Map<string, number>();
  for (const b of bets) betsByFase.set(b.fase ?? "null", (betsByFase.get(b.fase ?? "null") ?? 0) + 1);
  console.log(`Bets by fase:`);
  for (const [fase, count] of betsByFase) console.log(`  ${fase}: ${count}`);

  let scored = 0;
  let skippedNoMatch = 0;
  let skippedNotScorable = 0;
  const scoredByFase = new Map<string, number>();

  for (const bet of bets) {
    const match = matchById.get(bet.matchId);
    if (!match) { skippedNoMatch++; continue; }
    if (!isOfficialMatchForScoring(match)) { skippedNotScorable++; continue; }

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
    scored++;
    const fase = score.fase ?? "null";
    scoredByFase.set(fase, (scoredByFase.get(fase) ?? 0) + 1);
  }

  console.log(`\nScoring results:`);
  console.log(`  Scored: ${scored}`);
  console.log(`  Skipped (no match): ${skippedNoMatch}`);
  console.log(`  Skipped (not scorable): ${skippedNotScorable}`);
  console.log(`Scored by fase:`);
  for (const [fase, count] of scoredByFase) console.log(`  ${fase}: ${count}`);

  const currentScoring = await prisma.scoringMatch.count();
  console.log(`\nCurrent ScoringMatch in DB: ${currentScoring}`);
  console.log(`Difference: ${scored - currentScoring} missing`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERROR:", e);
  await prisma.$disconnect();
  process.exit(1);
});
