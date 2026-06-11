import { prisma } from "@/lib/prisma";

async function main() {
  const all = await prisma.participant.findMany({ select: { participantId: true, alias: true, departamento: true, rango: true, slug: true } });
  const byAlias = new Map<string, typeof all>();
  for (const p of all) {
    const list = byAlias.get(p.alias) ?? [];
    list.push(p);
    byAlias.set(p.alias, list);
  }
  for (const [alias, list] of byAlias) {
    if (list.length > 1) {
      console.log("ALIAS:", alias);
      for (const p of list) console.log("  ", p.participantId, p.slug, "|", p.departamento, "|", p.rango);
    }
  }

  // Check a specific match where both bet, e.g. find a match where both ElRichard participants have bets
  const richards = all.filter((p) => p.alias === "ElRichard");
  if (richards.length === 2) {
    const [a, b] = richards;
    const betsA = await prisma.betMatch.findMany({ where: { participantId: a.participantId }, select: { matchId: true, predHomeGoals: true, predAwayGoals: true } });
    const betsB = await prisma.betMatch.findMany({ where: { participantId: b.participantId }, select: { matchId: true, predHomeGoals: true, predAwayGoals: true } });
    const bMap = new Map(betsB.map((x) => [x.matchId, x]));
    let diffCount = 0;
    for (const bet of betsA) {
      const other = bMap.get(bet.matchId);
      if (other && (other.predHomeGoals !== bet.predHomeGoals || other.predAwayGoals !== bet.predAwayGoals)) {
        diffCount++;
        if (diffCount <= 5) console.log("DIFF on", bet.matchId, ":", a.participantId, bet.predHomeGoals, "-", bet.predAwayGoals, "vs", b.participantId, other.predHomeGoals, "-", other.predAwayGoals);
      }
    }
    console.log("total matches with different predictions:", diffCount, "/", betsA.length);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
