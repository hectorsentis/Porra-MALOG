import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";
import { fetchApiFootballScheduledFixtures } from "./client";
import { recordApiFootballCall } from "./budget";

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleUpperCase("es-ES")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function sameTeam(apiName: string | null, localName: string) {
  const left = normalize(apiName);
  const right = normalize(localName);
  return Boolean(left && right && (left === right || left.includes(right) || right.includes(left)));
}

function isKnockout(fase: string | null) {
  const value = (fase ?? "").toLocaleUpperCase("es-ES");
  return !value.includes("GRUPO") && (value.includes("R") || value.includes("FINAL") || value.includes("OCT") || value.includes("CUART") || value.includes("SEMI"));
}

export async function linkResolvedKnockoutMatchesWithApiFootball() {
  const api = await fetchApiFootballScheduledFixtures();
  await recordApiFootballCall({ endpoint: api.endpoint, statusCode: api.statusCode });

  const matches = await prisma.match.findMany({
    where: {
      apiFootballSync: null,
      homeTeamId: { not: null },
      awayTeamId: { not: null }
    },
    select: {
      matchId: true,
      fase: true,
      homeTeamId: true,
      awayTeamId: true,
      homeTeam: true,
      awayTeam: true
    }
  });

  let linked = 0;
  const skipped: string[] = [];
  for (const match of matches.filter((row) => isKnockout(row.fase))) {
    const home = formatCountry(match.homeTeamId, match.homeTeam ?? match.homeTeamId ?? "");
    const away = formatCountry(match.awayTeamId, match.awayTeam ?? match.awayTeamId ?? "");
    const fixture = api.fixtures.find((item) =>
      (sameTeam(item.homeName, home) && sameTeam(item.awayName, away)) ||
      (sameTeam(item.homeName, away) && sameTeam(item.awayName, home))
    );
    if (!fixture) {
      skipped.push(match.matchId);
      continue;
    }
    await prisma.apiFootballSync.create({
      data: { matchId: match.matchId, apiMatchId: fixture.apiMatchId, isPollingActive: false }
    });
    linked += 1;
  }

  return { linked, skipped };
}
