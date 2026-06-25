// Recalcula la clasificacion SIN crear snapshot.
// Guarda backup del estado previo en scripts/backup-ranking.json para poder restaurar.
//
// Usage: npx tsx --tsconfig tsconfig.json scripts/safe-recalculate.ts
import { prisma } from "@/lib/prisma";
import { recalculateAll } from "@/lib/game/recalculateAll";
import { writeFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const backupPath = resolve(__dirname, "backup-ranking.json");

  // 1. Backup estado actual
  console.log("Guardando backup del estado actual...");
  const [ranking, scoringMatches, scoringGroups, scoringBonus] = await Promise.all([
    prisma.generalRanking.findMany({ orderBy: { pos: "asc" }, include: { participant: { select: { alias: true } } } }),
    prisma.scoringMatch.findMany(),
    prisma.scoringGroup.findMany(),
    prisma.scoringBonus.findMany()
  ]);

  writeFileSync(backupPath, JSON.stringify({ ranking, scoringMatches, scoringGroups, scoringBonus }, null, 2));
  console.log(`Backup guardado en ${backupPath}`);
  console.log(`  - ${ranking.length} participantes en ranking`);
  console.log(`  - ${scoringMatches.length} scoring matches`);
  console.log(`  - ${scoringGroups.length} scoring groups`);
  console.log(`  - ${scoringBonus.length} scoring bonus\n`);

  // 2. Recalcular sin snapshot
  console.log("Ejecutando recalculo (sin snapshot)...");
  const result = await recalculateAll(prisma, {
    trigger: "manual",
    eventLabel: "Recalculo manual seguro (sin snapshot)",
    createdBy: "safe-recalculate-script",
    skipSnapshot: true
  });
  console.log(`Recalculo completado. ${result.affectedParticipants} participantes.\n`);

  // 3. Comparar antes/despues
  const newRanking = await prisma.generalRanking.findMany({
    orderBy: { pos: "asc" },
    include: { participant: { select: { alias: true } } }
  });

  const oldByParticipant = new Map(ranking.map((r) => [r.participantId, r]));
  let changes = 0;
  let pointChanges = 0;

  console.log("--- Comparacion antes/despues ---");
  console.log(`${"Pos".padStart(4)} ${"Alias".padEnd(26)} ${"Pts antes".padStart(10)} ${"Pts ahora".padStart(10)} ${"Diff".padStart(6)} ${"Pos antes".padStart(10)}`);
  console.log("-".repeat(72));

  for (const row of newRanking) {
    const old = oldByParticipant.get(row.participantId);
    const oldPts = old?.pointsTotal ?? 0;
    const oldPos = old?.pos ?? "—";
    const diff = row.pointsTotal - oldPts;
    const changed = diff !== 0 || (old && old.pos !== row.pos);
    if (changed) changes++;
    if (diff !== 0) pointChanges++;

    console.log(
      `${String(row.pos).padStart(4)} ${(row.participant?.alias ?? row.participantId).padEnd(26)} ${String(oldPts).padStart(10)} ${String(row.pointsTotal).padStart(10)} ${(diff > 0 ? `+${diff}` : String(diff)).padStart(6)} ${String(oldPos).padStart(10)}${changed ? "  <<<" : ""}`
    );
  }

  console.log("-".repeat(72));
  console.log(`\n${changes} participantes con cambios, ${pointChanges} con cambio de puntos.`);
  console.log(`\nSi algo va mal, restaura con: npx tsx --tsconfig tsconfig.json scripts/restore-ranking.ts`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERROR:", e);
  await prisma.$disconnect();
  process.exit(1);
});
