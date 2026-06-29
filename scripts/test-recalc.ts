import { prisma } from "@/lib/prisma";
import { recalculateAll } from "@/lib/game/recalculateAll";

async function main() {
  const before = await prisma.scoringMatch.count();
  console.log("ScoringMatch before:", before);

  await recalculateAll(prisma, { trigger: "manual", eventLabel: "Diagnostic run", createdBy: "diag", skipSnapshot: true });

  const after = await prisma.scoringMatch.count();
  console.log("ScoringMatch after:", after);

  const byFase = await prisma.scoringMatch.groupBy({ by: ["fase"], _count: { _all: true } });
  console.log("By fase:");
  for (const row of byFase) console.log(`  ${row.fase}: ${row._count._all}`);

  const m073 = await prisma.scoringMatch.count({ where: { matchId: "M073" } });
  console.log("M073 scoring count:", m073);

  if (m073 > 0) {
    const sample = await prisma.scoringMatch.findFirst({ where: { matchId: "M073" } });
    console.log("M073 sample:", JSON.stringify(sample, null, 2));
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERROR:", e);
  await prisma.$disconnect();
  process.exit(1);
});
