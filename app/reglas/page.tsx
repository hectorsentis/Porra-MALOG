import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRuleSections } from "@/lib/game/ruleConfig";

export const dynamic = "force-dynamic";

export default async function ReglasPage() {
  const sections = await getRuleSections();
  return (
    <PublicShell>
      <PageTitle title="Reglas" subtitle="Puntuacion oficial aplicada al recalculo de la porra." />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader><CardTitle>{section.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                {section.rules.map((rule) => (
                  <div key={rule.key} className="rounded-md border border-slate-100 px-3 py-2">
                    <div className="flex items-center justify-between gap-4">
                      <span>{rule.label}</span>
                      <strong className="text-primary">{rule.key === "SPAIN_MULTIPLIER" ? `x${rule.value}` : rule.value}</strong>
                    </div>
                    {rule.description ? <p className="mt-1 text-xs text-slate-500">{rule.description}</p> : null}
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
