import { Fragment, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { CountryLabel } from "@/components/CountryLabel";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhaseBadge } from "@/components/ui/phase-badge";
import { getPublicParticipant } from "@/lib/public/queries";
import { getPublicParticipantBets, type ParticipantMatchBet } from "@/lib/public/participantBets";

export const dynamic = "force-dynamic";

const bonusLabels: Array<[keyof NonNullable<Awaited<ReturnType<typeof getPublicParticipantBets>>["bonus"]>, string]> = [
  ["campeon", "Campeon del Mundial"],
  ["subcampeon", "Subcampeon"],
  ["semifinalistas", "Semifinalistas"],
  ["maximoGoleador", "Maximo goleador"],
  ["seleccionMasGoleadora", "Seleccion mas goleadora"],
  ["seleccionMasGoleada", "Seleccion mas goleada (en contra)"],
  ["seleccionMenosGoleadora", "Seleccion menos goleadora"],
  ["seleccionMenosGoleada", "Seleccion menos goleada (en contra)"],
  ["equipoRevelacion", "Equipo revelacion"],
  ["equipoDecepcion", "Equipo decepcion"],
  ["totalGolesTorneo", "Total goles del torneo (pronostico)"]
];

function signClass(sign: string) {
  if (sign === "1") return "border-air-light text-air-light";
  if (sign === "2") return "border-[var(--ea-gold-light)] text-[var(--ea-gold-light)]";
  if (sign === "X") return "border-air-gold text-air-gold";
  return "text-slate-500";
}

function statusClass(status: string) {
  if (status === "OFFICIAL") return "border-air-up text-air-up";
  if (status === "DRAFT") return "border-air-gold text-air-gold";
  if (status === "VOID") return "border-air-down text-air-down";
  return "text-slate-500";
}

function MatchPointsCell({ bet }: { bet: ParticipantMatchBet }) {
  if (bet.status !== "OFFICIAL" || !bet.score) {
    return <span className="text-sm text-slate-500">Pendiente</span>;
  }
  const { score } = bet;
  const tags: string[] = [];
  if (score.exactOk) tags.push("Exacto");
  else if (score.diffOk) tags.push("Diferencia");
  else if (score.signOk) tags.push("Signo");
  if (score.qualifiedOk) tags.push("Clasificado");
  if (score.cruceExactoOk) tags.push("Cruce exacto");
  if (score.spainMatch && score.multiplier > 1) tags.push(`x${score.multiplier} Espana`);
  return (
    <div>
      <p className="text-lg font-bold">{score.pointsTotal}</p>
      {tags.length ? <p className="text-xs text-air-up">{tags.join(" - ")}</p> : null}
    </div>
  );
}

export default async function ParticipantePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicParticipant(slug);
  if (!profile) notFound();
  const { matches, groups, bonus } = await getPublicParticipantBets(profile.participantId);

  const sections: Array<{ fase: string; rows: ParticipantMatchBet[] }> = [];
  for (const bet of matches) {
    const fase = bet.fase ?? "Sin fase";
    const last = sections[sections.length - 1];
    if (last && last.fase === fase) last.rows.push(bet);
    else sections.push({ fase, rows: [bet] });
  }

  return (
    <PublicShell>
      <PageTitle title={profile.alias} subtitle={`${profile.departamento ?? "Sin departamento"} - ${profile.rango ?? "Sin rango"}`} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs uppercase text-slate-500">Posicion</p>
            <p className="text-3xl font-bold text-primary">#{profile.pos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs uppercase text-slate-500">Puntos</p>
            <p className="text-3xl font-bold">{profile.pointsTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs uppercase text-slate-500">Apuestas</p>
            <p className="text-3xl font-bold">{profile.betsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs uppercase text-slate-500">Signos</p>
            <p className="text-3xl font-bold">{profile.correctSigns}</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs uppercase text-slate-500">Puntos partidos</p>
            <p className="text-2xl font-bold">{profile.pointsMatches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs uppercase text-slate-500">Puntos grupos</p>
            <p className="text-2xl font-bold">{profile.pointsGroups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs uppercase text-slate-500">Puntos eliminatorias</p>
            <p className="text-2xl font-bold">{profile.pointsEliminatorias}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs uppercase text-slate-500">Puntos bonus</p>
            <p className="text-2xl font-bold">{profile.pointsBonus}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-4">
        <CardHeader><CardTitle>Apuestas a partidos ({matches.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Partido</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Mi pronostico</th>
                <th className="px-3 py-2">Resultado</th>
                <th className="px-3 py-2">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <Fragment key={`fase-${section.fase}`}>
                  <tr className="border-t border-slate-100 bg-slate-50">
                    <td colSpan={5} className="px-3 py-2"><PhaseBadge fase={section.fase} /></td>
                  </tr>
                  {section.rows.map((bet) => (
                    <tr key={bet.matchId} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <p className="font-semibold"><CountryLabel value={bet.homeTeam} /> - <CountryLabel value={bet.awayTeam} /></p>
                        <p className="text-xs text-slate-500">
                          {bet.fecha ? new Date(bet.fecha).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" }) : "Fecha por confirmar"} {bet.hora ?? ""}
                          {bet.jornadaId ? ` - ${bet.jornadaId}` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2"><Badge className={statusClass(bet.status)}>{bet.statusLabel}</Badge></td>
                      <td className="px-3 py-2">
                        <p className="font-bold">{bet.prediction}</p>
                        <Badge className={signClass(bet.predSign)}>{bet.predSign}</Badge>
                        {bet.predQualifiedTeamId ? <p className="mt-1 text-xs text-slate-500">Clasifica: <CountryLabel value={bet.predQualifiedTeamId} /></p> : null}
                      </td>
                      <td className="px-3 py-2">
                        {bet.resultText ? (
                          <>
                            <p className="font-bold">{bet.resultText}</p>
                            <Badge className={signClass(bet.realSign)}>{bet.realSign}</Badge>
                            {bet.qualifiedTeamId ? <p className="mt-1 text-xs text-slate-500">Clasifica: <CountryLabel value={bet.qualifiedTeamId} /></p> : null}
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2"><MatchPointsCell bet={bet} /></td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              {matches.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-slate-500">Este participante no tiene apuestas registradas a partidos.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {groups.length ? (
        <Card className="mt-4">
          <CardHeader><CardTitle>Apuestas de clasificacion de grupos ({groups.length})</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Grupo</th>
                  <th className="px-3 py-2">Posicion</th>
                  <th className="px-3 py-2">Equipo pronosticado</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={`${group.grupo}-${group.predPos}`} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold">{group.grupo}</td>
                    <td className="px-3 py-2">{group.predPos}</td>
                    <td className="px-3 py-2">{group.predTeamId ? <CountryLabel value={group.predTeamId} /> : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {bonus ? (
        <Card className="mt-4">
          <CardHeader><CardTitle>Apuestas especiales (bonus)</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {bonusLabels.map(([key, label]) => {
              const value = bonus[key];
              const isCountry = key !== "maximoGoleador" && key !== "totalGolesTorneo";
              let content: ReactNode;
              if (Array.isArray(value)) {
                content = value.length
                  ? value.map((item, index) => (
                      <span key={`${key}-${index}`}>
                        {index > 0 ? ", " : ""}
                        {isCountry ? <CountryLabel value={item} /> : item}
                      </span>
                    ))
                  : "-";
              } else if (value == null) {
                content = "-";
              } else {
                content = isCountry ? <CountryLabel value={String(value)} /> : value;
              }
              return (
                <div key={key} className="rounded-md border border-slate-100 p-3">
                  <p className="text-xs uppercase text-slate-500">{label}</p>
                  <p className="text-lg font-bold">{content}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </PublicShell>
  );
}
