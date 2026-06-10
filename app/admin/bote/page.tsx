import { saveBoteAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminBotePage() {
  await requireAdmin();
  const [config, totalParticipants, includedParticipants, pendingParticipants] = await Promise.all([
    prisma.boteConfig.findUnique({ where: { id: "default" } }),
    prisma.participant.count(),
    prisma.participant.count({ where: { OR: [{ pay: { equals: "SI", mode: "insensitive" } }, { pagado: { not: null } }] } }),
    prisma.participant.count({ where: { NOT: { OR: [{ pay: { equals: "SI", mode: "insensitive" } }, { pagado: { not: null } }] } } })
  ]);

  const amount = Number(config?.amountPerParticipant ?? 5);
  const adjustment = Number(config?.manualAdjustment ?? 0);
  const total = includedParticipants * amount + adjustment;

  return (
    <AdminShell>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Gestion privada del bote</CardTitle></CardHeader>
          <CardContent>
            <form action={saveBoteAction} className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm">Importe por participante<input className="h-10 rounded-md border border-slate-200 px-3" name="amountPerParticipant" defaultValue={String(config?.amountPerParticipant ?? "5")} type="number" step="0.01" /></label>
              <label className="grid gap-1 text-sm">Ajuste manual<input className="h-10 rounded-md border border-slate-200 px-3" name="manualAdjustment" defaultValue={String(config?.manualAdjustment ?? "0")} type="number" step="0.01" /></label>
              <label className="grid gap-1 text-sm">Primer premio %<input className="h-10 rounded-md border border-slate-200 px-3" name="firstPrizePct" defaultValue={config?.firstPrizePct ?? 60} type="number" /></label>
              <label className="grid gap-1 text-sm">Segundo premio %<input className="h-10 rounded-md border border-slate-200 px-3" name="secondPrizePct" defaultValue={config?.secondPrizePct ?? 30} type="number" /></label>
              <label className="grid gap-1 text-sm">Tercer premio %<input className="h-10 rounded-md border border-slate-200 px-3" name="thirdPrizePct" defaultValue={config?.thirdPrizePct ?? 10} type="number" /></label>
              <label className="grid gap-1 text-sm">Premio consolacion<input className="h-10 rounded-md border border-slate-200 px-3" name="specialPrizeLabel" defaultValue={config?.specialPrizeLabel ?? ""} /></label>
              <label className="grid gap-1 text-sm">Importe consolacion<input className="h-10 rounded-md border border-slate-200 px-3" name="specialPrizeAmount" defaultValue={String(config?.specialPrizeAmount ?? "0")} type="number" step="0.01" /></label>
              <label className="grid gap-1 text-sm md:col-span-3">Reglas<textarea className="min-h-24 rounded-md border border-slate-200 px-3 py-2" name="rules" defaultValue={config?.rules ?? "Reparto del bote entre primer, segundo y tercer clasificado."} /></label>
              <Button>Guardar bote</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Estado privado</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <p>Total estimado: <strong>{total.toFixed(2)} EUR</strong></p>
            <p>Participantes totales: <strong>{totalParticipants}</strong></p>
            <p>Incluidos en bote: <strong>{includedParticipants}</strong></p>
            <p>Pendientes de revisar: <strong>{pendingParticipants}</strong></p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
