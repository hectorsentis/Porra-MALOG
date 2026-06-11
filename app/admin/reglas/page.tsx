import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { getRuleRows } from "@/lib/game/ruleConfig";
import { saveRulesAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminReglasPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const rules = await getRuleRows();
  const grouped = rules.reduce<Map<string, typeof rules>>((map, rule) => {
    const items = map.get(rule.category) ?? [];
    items.push(rule);
    map.set(rule.category, items);
    return map;
  }, new Map());

  return (
    <AdminShell>
      <Card>
        <CardHeader>
          <CardTitle>Reglas activas</CardTitle>
          {params.saved ? <p className="text-sm font-semibold text-green-700">Reglas guardadas.</p> : null}
        </CardHeader>
        <CardContent>
          <form action={saveRulesAction} className="grid gap-5">
            {[...grouped.entries()].map(([category, rows]) => (
              <section key={category} className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-3 py-2 font-display text-sm font-bold uppercase tracking-wide text-slate-900">{category}</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Regla</th><th className="px-3 py-2">Concepto Excel</th><th className="px-3 py-2">Puntos</th><th className="px-3 py-2">Activa</th><th className="px-3 py-2">Comentario</th></tr></thead>
                    <tbody>
                      {rows.map((rule) => (
                        <tr key={rule.key} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-semibold text-slate-900">{rule.label}</td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-500"><input type="hidden" name="ruleKey" value={rule.key} />{rule.key}</td>
                          <td className="px-3 py-2"><input className="h-9 w-24 rounded-md border border-slate-200 px-2" name={`value:${rule.key}`} type="number" defaultValue={rule.value} /></td>
                          <td className="px-3 py-2"><input className="h-4 w-4" name={`active:${rule.key}`} type="checkbox" defaultChecked={rule.active} /></td>
                          <td className="px-3 py-2"><input className="h-9 w-full rounded-md border border-slate-200 px-2" name={`description:${rule.key}`} defaultValue={rule.description ?? ""} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
            <div className="flex justify-end">
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">Guardar reglas</button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
