import { saveBoteAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(value: unknown) {
  return String(value ?? "0");
}

export default async function AdminBotePage() {
  await requireAdmin();
  const [config, totalParticipants, includedParticipants, pendingParticipants] = await Promise.all([
    prisma.boteConfig.findUnique({ where: { id: "default" } }),
    prisma.participant.count(),
    prisma.participant.count({ where: { OR: [{ pay: { equals: "SI", mode: "insensitive" } }, { pagado: { not: null } }] } }),
    prisma.participant.count({ where: { NOT: { OR: [{ pay: { equals: "SI", mode: "insensitive" } }, { pagado: { not: null } }] } } })
  ]);

  const total = Number(config?.totalAmount ?? 0);
  const prizeSum = Number(config?.firstPrize ?? 0) + Number(config?.secondPrize ?? 0) + Number(config?.thirdPrize ?? 0) + Number(config?.consolationPrize ?? 0);

  return (
    <AdminShell>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Gestion privada del bote</CardTitle></CardHeader>
          <CardContent>
            <form action={saveBoteAction} className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm">Bote total<input className="h-10 rounded-md border border-slate-200 px-3" name="totalAmount" defaultValue={money(config?.totalAmount)} type="number" step="0.01" /></label>
              <label className="grid gap-1 text-sm">1er premio<input className="h-10 rounded-md border border-slate-200 px-3" name="firstPrize" defaultValue={money(config?.firstPrize)} type="number" step="0.01" /></label>
              <label className="grid gap-1 text-sm">2o premio<input className="h-10 rounded-md border border-slate-200 px-3" name="secondPrize" defaultValue={money(config?.secondPrize)} type="number" step="0.01" /></label>
              <label className="grid gap-1 text-sm">3er premio<input className="h-10 rounded-md border border-slate-200 px-3" name="thirdPrize" defaultValue={money(config?.thirdPrize)} type="number" step="0.01" /></label>
              <label className="grid gap-1 text-sm">Premio consolacion<input className="h-10 rounded-md border border-slate-200 px-3" name="consolationPrize" defaultValue={money(config?.consolationPrize)} type="number" step="0.01" /></label>
              <label className="grid gap-1 text-sm">Moneda<input className="h-10 rounded-md border border-slate-200 px-3" name="currency" defaultValue={config?.currency ?? "EUR"} /></label>
              <label className="grid gap-1 text-sm md:col-span-3">Notas privadas<textarea className="min-h-20 rounded-md border border-slate-200 px-3 py-2" name="notes" defaultValue={config?.notes ?? ""} /></label>
              <label className="grid gap-1 text-sm md:col-span-3">Reglas publicas<textarea className="min-h-24 rounded-md border border-slate-200 px-3 py-2" name="rules" defaultValue={config?.rules ?? "Reparto del bote entre primer, segundo, tercer clasificado y premio de consolacion."} /></label>
              <Button>Guardar bote</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Estado privado</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <p>Total configurado: <strong>{total.toFixed(2)} {config?.currency ?? "EUR"}</strong></p>
            <p>Suma premios: <strong>{prizeSum.toFixed(2)} {config?.currency ?? "EUR"}</strong></p>
            <p>Diferencia: <strong>{(total - prizeSum).toFixed(2)} {config?.currency ?? "EUR"}</strong></p>
            <p>Participantes totales: <strong>{totalParticipants}</strong></p>
            <p>Incluidos en control interno: <strong>{includedParticipants}</strong></p>
            <p>Pendientes de revisar: <strong>{pendingParticipants}</strong></p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}