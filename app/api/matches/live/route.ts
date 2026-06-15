import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";
import { ensureLiveMatchesActive } from "@/lib/live/ensure-active";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureLiveMatchesActive();
  const matches = await prisma.match.findMany({
    where: { status: "DRAFT" },
    orderBy: [{ kickoffTime: "asc" }, { fecha: "asc" }, { matchNo: "asc" }],
    select: {
      matchId: true,
      matchNo: true,
      fecha: true,
      kickoffTime: true,
      hora: true,
      homeTeamId: true,
      awayTeamId: true,
      homeTeam: true,
      awayTeam: true,
      homeGoals: true,
      awayGoals: true,
      resultText: true
    }
  });

  return NextResponse.json({
    matches: matches.map((match) => ({
      matchId: match.matchId,
      matchNo: match.matchNo,
      fecha: (match.kickoffTime ?? match.fecha)?.toISOString() ?? null,
      hora: match.hora,
      homeTeam: formatCountry(match.homeTeamId, match.homeTeam ?? "Local"),
      awayTeam: formatCountry(match.awayTeamId, match.awayTeam ?? "Visitante"),
      resultText: match.resultText ?? (match.homeGoals != null && match.awayGoals != null ? `${match.homeGoals}-${match.awayGoals}` : null)
    }))
  });
}
