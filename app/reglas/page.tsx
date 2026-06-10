import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultRules } from "@/lib/game/rules";

const sections = [
  {
    title: "Partidos",
    rows: [
      ["Resultado exacto", defaultRules.exactScore],
      ["Diferencia correcta", defaultRules.correctGoalDiff],
      ["Signo correcto", defaultRules.correctSign],
      ["Clasificado correcto", defaultRules.qualifiedTeam],
      ["Cruce exacto", defaultRules.exactCrossing],
      ["Multiplicador partidos de Espana", `x${defaultRules.spainMultiplier}`]
    ]
  },
  {
    title: "Clasificacion de grupos",
    rows: [
      ["Equipo clasificado", defaultRules.groupQualified],
      ["Posicion exacta", defaultRules.groupExactPosition]
    ]
  },
  {
    title: "Bonus final",
    rows: [
      ["Campeon", defaultRules.champion],
      ["Subcampeon", defaultRules.runnerUp],
      ["Semifinalista", defaultRules.semifinalist],
      ["Maximo goleador", defaultRules.topScorer],
      ["Seleccion mas goleadora", defaultRules.teamMostGoalsFor],
      ["Seleccion mas goleada", defaultRules.teamMostGoalsAgainst],
      ["Seleccion menos goleadora", defaultRules.teamLeastGoalsFor],
      ["Seleccion menos goleada", defaultRules.teamLeastGoalsAgainst],
      ["Equipo revelacion", defaultRules.revelation],
      ["Equipo decepcion", defaultRules.disappointment],
      ["Total goles torneo", defaultRules.totalGoals],
      ["Tolerancia total goles", `+/- ${defaultRules.totalGoalsTolerance}`]
    ]
  }
];

export default function ReglasPage() {
  return (
    <PublicShell>
      <PageTitle title="Reglas" subtitle="Puntuacion oficial aplicada al recalculo de la porra." />
      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader><CardTitle>{section.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                {section.rows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-md border border-slate-100 px-3 py-2">
                    <span>{label}</span>
                    <strong className="text-primary">{value}</strong>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PublicShell>
  );
}
