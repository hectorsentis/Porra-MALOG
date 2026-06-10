import { rollbackAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminRollbackPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <Card>
        <CardHeader><CardTitle>Rollback</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-600">Restaura la clasificacion desde el ultimo snapshot publicado correcto.</p>
          <form action={rollbackAction}>
            <Button variant="danger">Rollback a ultimo snapshot</Button>
          </form>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
