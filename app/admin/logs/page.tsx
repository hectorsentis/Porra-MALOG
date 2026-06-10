import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  await requireAdmin();
  let logs: Array<{ id: string; action: string; message: string; createdAt: Date }> = [];
  try {
    logs = await prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  } catch {
    logs = [];
  }
  return (
    <AdminShell>
      <Card>
        <CardHeader><CardTitle>Logs operativos</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
          {logs.map((log) => (
            <div key={log.id} className="rounded-md border border-slate-100 p-3 text-sm">
              <p className="font-semibold">{log.action}</p>
              <p>{log.message}</p>
              <p className="text-xs text-slate-500">{log.createdAt.toLocaleString("es-ES")}</p>
            </div>
          ))}
          {logs.length === 0 ? <p className="text-sm text-slate-500">Sin logs o base no configurada.</p> : null}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
