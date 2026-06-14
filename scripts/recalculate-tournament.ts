import { prisma } from "@/lib/prisma";
import { recalculateTournamentEngine } from "@/lib/game/tournamentEngine";

async function main() {
  const result = await recalculateTournamentEngine(prisma);
  await prisma.adminLog.create({
    data: {
      action: "TOURNAMENT_RECALCULATED",
      message: `Fixture recalculado: ${result.standings.length} filas de grupo, ${result.thirdPlaces.length} terceros, ${result.slots.length} slots.`
    }
  });
  await prisma.$disconnect();
  console.log({
    standings: result.standings.length,
    thirdPlaces: result.thirdPlaces.length,
    slots: result.slots.length,
    groupStageComplete: result.groupStageComplete,
    qualifiedKey: result.qualifiedKey
  });
}

main().catch(async (error) => {
  await prisma.$disconnect();
  console.error(error);
  process.exit(1);
});
