// Verifies post-migration DB integrity: counts, rankings, snapshots, and active host.
// Usage: npx tsx --tsconfig tsconfig.json scripts/verify-db.ts
import { prisma } from "@/lib/prisma";

const EXPECTED = {
  participants: 47,
  matches: 104,
  teams: 48,
  countries: 48,
  betMatches: { min: 4680, label: "≥4680 bet_matches" },
  betGroups: { min: 2160, label: "≥2160 bet_groups" },
  betBonus: 47,
  generalRanking: 47
};

function pass(msg: string) { console.log(`  ✓ ${msg}`); }
function fail(msg: string) { console.error(`  ✗ ${msg}`); }
function check(label: string, actual: number, expected: number) {
  actual === expected
    ? pass(`${label}: ${actual}`)
    : fail(`${label}: expected ${expected}, got ${actual}`);
}

async function main() {
  console.log("\n=== Verificación post-migración Supabase ===\n");

  // 1. Host activo
  const dbUrl = process.env.DATABASE_URL ?? "";
  const hostMatch = dbUrl.match(/@([^:\/]+)/);
  const host = hostMatch?.[1] ?? "(no detectado)";
  const isSupabase = host.includes("supabase.com");
  isSupabase
    ? pass(`Host: ${host} (Supabase ✓)`)
    : fail(`Host: ${host} — NO es Supabase, revisar DATABASE_URL`);

  // 2. Conteos de tablas
  console.log("\n--- Conteos de tablas ---");
  const [
    participantCount,
    matchCount,
    teamCount,
    countryCount,
    betMatchCount,
    betGroupCount,
    betBonusCount,
    rankingCount
  ] = await Promise.all([
    prisma.participant.count(),
    prisma.match.count(),
    prisma.team.count(),
    prisma.country.count(),
    prisma.betMatch.count(),
    prisma.betGroupPosition.count(),
    prisma.betBonus.count(),
    prisma.generalRanking.count()
  ]);

  check("Participantes", participantCount, EXPECTED.participants);
  check("Partidos", matchCount, EXPECTED.matches);
  check("Equipos", teamCount, EXPECTED.teams);
  check("Países", countryCount, EXPECTED.countries);
  betMatchCount >= EXPECTED.betMatches.min
    ? pass(`Bet matches: ${betMatchCount} (${EXPECTED.betMatches.label})`)
    : fail(`Bet matches: ${betMatchCount} < ${EXPECTED.betMatches.min}`);
  betGroupCount >= EXPECTED.betGroups.min
    ? pass(`Bet grupos: ${betGroupCount} (${EXPECTED.betGroups.label})`)
    : fail(`Bet grupos: ${betGroupCount} < ${EXPECTED.betGroups.min}`);
  check("Bet bonus", betBonusCount, EXPECTED.betBonus);
  check("Clasificación general (ranking)", rankingCount, EXPECTED.generalRanking);

  // 3. Resultados aplicados
  console.log("\n--- Resultados aplicados ---");
  const officialMatches = await prisma.match.count({ where: { status: "OFFICIAL", finished: true } });
  officialMatches > 0
    ? pass(`Partidos OFFICIAL con resultado: ${officialMatches}`)
    : fail(`No hay partidos OFFICIAL — apply-results no funcionó`);

  // 4. Scoring tables populated
  console.log("\n--- Tablas de scoring ---");
  const [scoringMatchCount, scoringGroupCount] = await Promise.all([
    prisma.scoringMatch.count(),
    prisma.scoringGroup.count()
  ]);
  scoringMatchCount > 0
    ? pass(`ScoringMatch filas: ${scoringMatchCount}`)
    : fail(`ScoringMatch vacía — recalculateAll no creó scores de partidos`);
  scoringGroupCount > 0
    ? pass(`ScoringGroup filas: ${scoringGroupCount}`)
    : fail(`ScoringGroup vacía — recalculateAll no creó scores de grupos`);

  // 5. Snapshot con isLatest=true
  console.log("\n--- Snapshots ---");
  const latestSnapshot = await prisma.rankingSnapshot.findFirst({ where: { isLatest: true } });
  latestSnapshot
    ? pass(`Snapshot isLatest=true: "${latestSnapshot.label}" (${latestSnapshot.createdAt.toISOString().slice(0, 10)})`)
    : fail(`No existe snapshot con isLatest=true — recalculateAll falló o no se ejecutó`);

  // 6. Top 10 ranking actual
  console.log("\n--- Ranking actual (top 10) ---");
  const top10 = await prisma.generalRanking.findMany({
    orderBy: { pos: "asc" },
    take: 10,
    include: { participant: { select: { alias: true } } }
  });
  top10.forEach((row) => {
    console.log(`  ${String(row.pos).padStart(2)}. ${(row.participant?.alias ?? row.participantId).padEnd(25)} ${String(row.pointsTotal).padStart(4)} pts`);
  });

  // 7. RecalculationRun más reciente
  console.log("\n--- Último recálculo ---");
  const lastRun = await prisma.recalculationRun.findFirst({
    orderBy: { startedAt: "desc" }
  });
  if (lastRun) {
    const ok = lastRun.status === "SUCCESS";
    ok
      ? pass(`RecalculationRun ${lastRun.id}: ${lastRun.status} (${lastRun.affectedParticipants} participantes, ${lastRun.finishedAt?.toISOString().slice(0, 19)})`)
      : fail(`RecalculationRun ${lastRun.id}: ${lastRun.status} — ${lastRun.message}`);
  } else {
    fail("No existe ningún RecalculationRun");
  }

  console.log("\n=== Fin verificación ===\n");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\nERROR:", e);
  await prisma.$disconnect();
  process.exit(1);
});
