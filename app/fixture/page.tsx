import Link from "next/link";
import { CountryLabel } from "@/components/CountryLabel";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFixtureOverview, type FixtureGroup } from "@/lib/public/fixture";

export const dynamic = "force-dynamic";

const tabs = [
  ["grupos", "Grupos"],
  ["terceros", "Mejores terceros"],
  ["cuadro", "Cuadro"],
  ["bonus", "Bonus"]
];

function tabHref(tab: string) {
  return `/fixture?tab=${tab}`;
}

function statusClass(status: string) {
  if (status === "CLASSIFIED" || status === "THIRD_CLASSIFIED") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (status === "OUT") return "border-red-300 bg-red-50 text-red-700";
  return "border-slate-200 text-slate-500";
}

function phaseLabel(fase: string | null) {
  const value = (fase ?? "").toLocaleUpperCase("es-ES");
  if (value.includes("R32")) return "1/16";
  if (value.includes("R16")) return "1/8";
  if (value.includes("QF")) return "1/4";
  if (value.includes("SF")) return "Semifinal";
  if (value.includes("TERCER")) return "3er puesto";
  if (value.includes("FINAL")) return "Final";
  return fase ?? "Eliminatoria";
}

function phaseOrder(fase: string | null) {
  const value = (fase ?? "").toLocaleUpperCase("es-ES");
  if (value.includes("R32")) return 1;
  if (value.includes("R16")) return 2;
  if (value.includes("QF")) return 3;
  if (value.includes("SF")) return 4;
  if (value.includes("TERCER")) return 5;
  if (value.includes("FINAL")) return 6;
  return 99;
}

function groupBracket(matches: Awaited<ReturnType<typeof getFixtureOverview>>["bracket"]) {
  const groups = new Map<string, typeof matches>();
  for (const match of matches) {
    const label = phaseLabel(match.fase);
    const list = groups.get(label) ?? [];
    list.push(match);
    groups.set(label, list);
  }
  return [...groups.entries()]
    .map(([label, rows]) => ({ label, rows }))
    .sort((a, b) => phaseOrder(a.rows[0]?.fase ?? null) - phaseOrder(b.rows[0]?.fase ?? null));
}

function GroupTable({ group }: { group: FixtureGroup }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grupo {group.grupo}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Pos</th>
              <th className="px-3 py-2">Equipo</th>
              <th className="px-3 py-2">PJ</th>
              <th className="px-3 py-2">PG</th>
              <th className="px-3 py-2">PE</th>
              <th className="px-3 py-2">PP</th>
              <th className="px-3 py-2">GF</th>
              <th className="px-3 py-2">GC</th>
              <th className="px-3 py-2">DG</th>
              <th className="px-3 py-2">Pts</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row) => (
              <tr key={row.teamId} className="border-t border-slate-100">
                <td className="px-3 py-2 font-bold text-primary">{row.pos}</td>
                <td className="px-3 py-2 font-semibold"><CountryLabel value={row.team} /></td>
                <td className="px-3 py-2">{row.pj}</td>
                <td className="px-3 py-2">{row.pg}</td>
                <td className="px-3 py-2">{row.pe}</td>
                <td className="px-3 py-2">{row.pp}</td>
                <td className="px-3 py-2">{row.gf}</td>
                <td className="px-3 py-2">{row.gc}</td>
                <td className="px-3 py-2">{row.dg}</td>
                <td className="px-3 py-2 font-bold">{row.pts}</td>
                <td className="px-3 py-2"><Badge className={statusClass(row.status)}>{row.statusLabel}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function BonusTeams({ values, country = true }: { values: string[]; country?: boolean }) {
  if (values.length === 0) return <strong>-</strong>;
  return (
    <strong>
      {values.map((value, index) => (
        <span key={`${value}-${index}`}>
          {index > 0 ? ", " : ""}
          {country ? <CountryLabel value={value} /> : value}
        </span>
      ))}
    </strong>
  );
}

export default async function FixturePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const activeTab = rawTab && tabs.some(([key]) => key === rawTab) ? rawTab : "grupos";
  const fixture = await getFixtureOverview();
  const bracketGroups = groupBracket(fixture.bracket);

  return (
    <PublicShell>
      <PageTitle title="Fixture" subtitle="Clasificacion real del torneo, mejores terceros y cuadro de eliminatorias." />
      <nav className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <Link key={key} href={tabHref(key)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${activeTab === key ? "border-primary bg-primary text-[#FFFFFF]" : "border-slate-200 bg-white text-slate-700"}`}>
            {label}
          </Link>
        ))}
      </nav>

      {activeTab === "grupos" ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {fixture.groups.map((group) => <GroupTable key={group.grupo} group={group} />)}
          {fixture.groups.length === 0 ? <Card><CardContent><p className="text-sm text-slate-600">El fixture se calculara al publicar resultados oficiales.</p></CardContent></Card> : null}
        </section>
      ) : null}

      {activeTab === "terceros" ? (
        <Card>
          <CardHeader>
            <CardTitle>Mejores terceros</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Grupo</th>
                  <th className="px-3 py-2">Equipo</th>
                  <th className="px-3 py-2">Pts</th>
                  <th className="px-3 py-2">DG</th>
                  <th className="px-3 py-2">GF</th>
                  <th className="px-3 py-2">Slot</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {fixture.thirds.map((row) => (
                  <tr key={row.grupo} className={`border-t border-slate-100 ${row.qualified3rd ? "" : "bg-red-50/70"}`}>
                    <td className="px-3 py-2 font-bold text-primary">{row.rank3rd ?? "-"}</td>
                    <td className="px-3 py-2">{row.grupo}</td>
                    <td className="px-3 py-2 font-semibold"><CountryLabel value={row.team} /></td>
                    <td className="px-3 py-2">{row.pts}</td>
                    <td className="px-3 py-2">{row.dg}</td>
                    <td className="px-3 py-2">{row.gf}</td>
                    <td className="px-3 py-2">{row.thirdSlot ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Badge className={row.qualified3rd ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}>
                        {row.qualified3rd ? "Clasificado" : "No clasificado"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "cuadro" ? (
        <section className="grid gap-5">
          {bracketGroups.map((group) => (
            <section key={group.label} className="grid gap-3">
              <h2 className="font-display text-xl font-bold text-primary">{group.label}</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {group.rows.map((match) => (
                  <Card key={match.matchId}>
                    <CardContent className="grid gap-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="border-slate-200 text-slate-600">{phaseLabel(match.fase)}</Badge>
                        <span className="text-xs font-semibold uppercase text-slate-500">#{match.matchNo ?? match.matchId}</span>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold"><CountryLabel value={match.homeTeam} /></span>
                          <span className="text-xs text-slate-500">{match.homeSlot ?? ""}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold"><CountryLabel value={match.awayTeam} /></span>
                          <span className="text-xs text-slate-500">{match.awaySlot ?? ""}</span>
                        </div>
                      </div>
                      <div className="rounded-md bg-slate-50 p-2 text-sm">
                        <p className="text-xs uppercase text-slate-500">Marcador</p>
                        <p className="font-bold">{match.resultText ?? "-"}</p>
                      </div>
                      {match.status === "OFFICIAL" ? (
                        <p className="text-xs font-semibold text-emerald-700">Pasa: <CountryLabel value={match.qualifiedTeam} /></p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : null}

      {activeTab === "bonus" ? (
        <Card>
          <CardHeader>
            <CardTitle>Bonus finales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <p>Estado: <strong>{fixture.bonus.bonusLocked ? "Puntuable" : "Pendiente de final"}</strong></p>
            <p>Campeon: <strong><CountryLabel value={fixture.bonus.campeonLabel} /></strong></p>
            <p>Subcampeon: <strong><CountryLabel value={fixture.bonus.subcampeonLabel} /></strong></p>
            <p>Semifinalistas: <BonusTeams values={fixture.bonus.semifinalistasLabels} /></p>
            <p>Maximo goleador: <BonusTeams values={fixture.bonus.maximoGoleadorLabels} country={false} /></p>
            <p>Seleccion mas goleadora: <BonusTeams values={fixture.bonus.seleccionMasGoleadoraLabels} /></p>
            <p>Seleccion mas goleada: <BonusTeams values={fixture.bonus.seleccionMasGoleadaLabels} /></p>
            <p>Seleccion menos goleadora: <BonusTeams values={fixture.bonus.seleccionMenosGoleadoraLabels} /></p>
            <p>Seleccion menos goleada: <BonusTeams values={fixture.bonus.seleccionMenosGoleadaLabels} /></p>
            <p>Equipo revelacion: <BonusTeams values={fixture.bonus.equipoRevelacionLabels} /></p>
            <p>Equipo decepcion: <BonusTeams values={fixture.bonus.equipoDecepcionLabels} /></p>
            <p>Total goles: <strong>{fixture.bonus.totalGolesTorneo ?? "-"}</strong></p>
          </CardContent>
        </Card>
      ) : null}
    </PublicShell>
  );
}
