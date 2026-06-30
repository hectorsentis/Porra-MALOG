import { prisma } from "@/lib/prisma";

async function main() {
  const participant = await prisma.participant.findFirst({ where: { alias: { contains: "ElRichard", mode: "insensitive" } } });
  if (!participant) { console.log("Participant not found"); return; }
  console.log("Participant:", participant.participantId, participant.alias);

  const bets = await prisma.betMatch.findMany({
    where: { participantId: participant.participantId, fase: "R32" },
    include: { match: { select: { matchId: true, homeTeam: true, awayTeam: true, homeTeamId: true, awayTeamId: true, status: true, fase: true, qualifiedTeamId: true, overrideQualifiedTeamId: true } } }
  });

  console.log(`\nR32 bets for ${participant.alias}:`);
  for (const bet of bets) {
    console.log(`  ${bet.matchId} (${bet.match.homeTeam} vs ${bet.match.awayTeam}, status=${bet.match.status}): predHome=${bet.predHomeTeamId}, predAway=${bet.predAwayTeamId}, predQualified=${bet.predQualifiedTeamId}`);
  }

  const scoring = await prisma.scoringMatch.findMany({
    where: { participantId: participant.participantId, fase: "R32" }
  });
  console.log(`\nScoringMatch R32 for ${participant.alias}:`);
  for (const s of scoring) {
    console.log(`  ${s.matchId}: qualifiedOk=${s.qualifiedOk}, cruceExactoOk=${s.cruceExactoOk}, pointsQualified=${s.pointsQualified}, pointsCruceExacto=${s.pointsCruceExacto}, pointsTotal=${s.pointsTotal}`);
  }

  const m073 = await prisma.match.findUnique({ where: { matchId: "M073" } });
  console.log("\nM073:", JSON.stringify({ status: m073?.status, finished: m073?.finished, qualifiedTeamId: m073?.qualifiedTeamId, overrideQualifiedTeamId: m073?.overrideQualifiedTeamId, fase: m073?.fase }));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERROR:", e);
  await prisma.$disconnect();
  process.exit(1);
});
