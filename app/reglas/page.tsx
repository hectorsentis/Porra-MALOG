import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultRules } from "@/lib/game/rules";

export default function ReglasPage() {
  return (
    <PublicShell>
      <PageTitle title="Reglas" subtitle="Motor de puntuacion migrado a TypeScript." />
      <Card>
        <CardHeader><CardTitle>Puntuacion base</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Resultado exacto: <strong>{defaultRules.exactScore}</strong></p>
          <p>Diferencia correcta: <strong>{defaultRules.correctGoalDiff}</strong></p>
          <p>Signo correcto: <strong>{defaultRules.correctSign}</strong></p>
          <p>Clasificado correcto: <strong>{defaultRules.qualifiedTeam}</strong></p>
          <p>Posicion exacta de grupo: <strong>{defaultRules.groupExactPosition}</strong></p>
          <p>Campeon: <strong>{defaultRules.champion}</strong></p>
        </CardContent>
      </Card>
    </PublicShell>
  );
}
