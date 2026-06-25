// Restaura el ranking y scoring desde el backup generado por safe-recalculate.ts.
//
// Usage: npx tsx --tsconfig tsconfig.json scripts/restore-ranking.ts
import { prisma } from "@/lib/prisma";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

async function main() {
  const backupPath = resolve(__dirname, "backup-ranking.json");

  if (!existsSync(backupPath)) {
    console.error(`No se encontro backup en ${backupPath}`);
    console.error("Ejecuta primero: npx tsx --tsconfig tsconfig.json scripts/safe-recalculate.ts");
    process.exit(1);
  }

  const backup = JSON.parse(readFileSync(backupPath, "utf-8"));
  console.log(`Restaurando desde backup: ${backupPath}`);
  console.log(`  - ${backup.ranking.length} ranking rows`);
  console.log(`  - ${backup.scoringMatches.length} scoring matches`);
  console.log(`  - ${backup.scoringGroups.length} scoring groups`);
  console.log(`  - ${backup.scoringBonus.length} scoring bonus\n`);

  await prisma.$transaction(async (tx) => {
    await tx.scoringMatch.deleteMany();
    await tx.scoringGroup.deleteMany();
    await tx.scoringBonus.deleteMany();
    await tx.generalRanking.deleteMany();

    if (backup.scoringMatches.length > 0) {
      const scoringData = backup.scoringMatches.map((r: Record<string, unknown>) => {
        const { id: _id, date: _date, ...rest } = r;
        return rest;
      });
      await tx.scoringMatch.createMany({ data: scoringData });
    }

    if (backup.scoringGroups.length > 0) {
      const groupData = backup.scoringGroups.map((r: Record<string, unknown>) => {
        const { id: _id, date: _date, ...rest } = r;
        return rest;
      });
      await tx.scoringGroup.createMany({ data: groupData });
    }

    if (backup.scoringBonus.length > 0) {
      const bonusData = backup.scoringBonus.map((r: Record<string, unknown>) => {
        const { id: _id, ...rest } = r;
        return rest;
      });
      await tx.scoringBonus.createMany({ data: bonusData });
    }

    const rankingData = backup.ranking.map((r: Record<string, unknown>) => {
      const { id: _id, updatedAt: _updated, participant: _p, ...rest } = r;
      return rest;
    });
    await tx.generalRanking.createMany({
      data: rankingData as unknown as NonNullable<Parameters<typeof tx.generalRanking.createMany>[0]>["data"]
    });
  });

  console.log("Restauracion completada.");

  const top10 = await prisma.generalRanking.findMany({
    orderBy: { pos: "asc" },
    take: 10,
    include: { participant: { select: { alias: true } } }
  });
  console.log("\n--- Top 10 restaurado ---");
  top10.forEach((row) =>
    console.log(`  ${String(row.pos).padStart(2)}. ${(row.participant?.alias ?? row.participantId).padEnd(26)} ${String(row.pointsTotal).padStart(4)} pts`)
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERROR:", e);
  await prisma.$disconnect();
  process.exit(1);
});
