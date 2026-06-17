// Applies match results from the Excel workbook to the DB (force-update existing matches)
// and then runs recalculateAll() once to rebuild all scoring tables.
// Usage: npx tsx --tsconfig tsconfig.json scripts/apply-results.ts [path/to/file.xlsx]
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "@/lib/prisma";
import { parseExcelWorkbook } from "@/lib/import/excel";
import { recalculateAll } from "@/lib/game/recalculateAll";
import { MatchStatus } from "@prisma/client";

async function main() {
  const fileArg = process.argv.find((a) => a.endsWith(".xlsx"));
  const path = resolve(
    fileArg ??
      "data/input/Porra_mundial2026 _20260617.xlsx"
  );
  console.log(`\nLeyendo: ${path}\n`);

  const buffer = await readFile(path);
  const parsed = await parseExcelWorkbook(buffer, path);

  if (parsed.errors.length > 0) {
    console.error("Errores en el Excel:", parsed.errors);
    process.exit(1);
  }

  const matchesWithResult = parsed.matches.filter(
    (m) => m.homeGoals != null && m.awayGoals != null && m.finished
  );

  console.log(`Partidos con resultado en el Excel: ${matchesWithResult.length} / ${parsed.matches.length}\n`);

  let applied = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const m of matchesWithResult) {
    try {
      await prisma.match.update({
        where: { matchId: m.matchId },
        data: {
          homeGoals: m.homeGoals,
          awayGoals: m.awayGoals,
          homePens: m.homePens ?? null,
          awayPens: m.awayPens ?? null,
          finished: true,
          resultText: m.resultText ?? null,
          realSign: m.realSign ?? null,
          goalDiff: m.goalDiff ?? null,
          qualifiedTeamId: m.qualifiedTeamId ?? null,
          overrideQualifiedTeamId: m.overrideQualifiedTeamId ?? null,
          status: MatchStatus.OFFICIAL
        }
      });

      // Create MatchResult audit record (skip if already exists for this match as official)
      const existingOfficialResult = await prisma.matchResult.findFirst({
        where: { matchId: m.matchId, isOfficial: true }
      });
      if (!existingOfficialResult) {
        await prisma.matchResult.create({
          data: {
            matchId: m.matchId,
            status: MatchStatus.OFFICIAL,
            homeGoals: m.homeGoals,
            awayGoals: m.awayGoals,
            homePens: m.homePens ?? null,
            awayPens: m.awayPens ?? null,
            qualifiedTeamId: m.qualifiedTeamId ?? null,
            isActive: true,
            isOfficial: true,
            source: "apply-results-script",
            createdBy: "apply-results"
          }
        });
      }

      applied++;
    } catch (e) {
      const msg = `${m.matchId}: ${e instanceof Error ? e.message : String(e)}`;
      errors.push(msg);
      skipped++;
    }
  }

  console.log(`✓ Resultados aplicados: ${applied}`);
  if (errors.length > 0) {
    console.error(`✗ Errores (${errors.length}):`, errors.slice(0, 10));
  }

  console.log("\nEjecutando recalculateAll()…\n");
  const result = await recalculateAll(prisma, {
    trigger: "manual",
    eventLabel: `Recalculo post-import Excel ${new Date().toISOString().slice(0, 10)}`,
    createdBy: "apply-results"
  });

  console.log(`✓ Recálculo completado. Participantes afectados: ${result.affectedParticipants}`);
  console.log("\n--- Ranking top 10 ---");
  result.ranking.slice(0, 10).forEach((row) => {
    console.log(`  ${String(row.pos).padStart(2)}. ${row.alias.padEnd(25)} ${String(row.pointsTotal).padStart(4)} pts`);
  });

  await prisma.$disconnect();
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("\nERROR FATAL:", e);
  await prisma.$disconnect();
  process.exit(1);
});
