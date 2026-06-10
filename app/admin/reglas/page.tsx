import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultRules } from "@/lib/game/rules";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminReglasPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <Card>
        <CardHeader><CardTitle>Reglas activas</CardTitle></CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-md bg-[var(--bg-input)] p-3 text-xs text-[var(--text-primary)] font-mono">{JSON.stringify(defaultRules, null, 2)}</pre>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
