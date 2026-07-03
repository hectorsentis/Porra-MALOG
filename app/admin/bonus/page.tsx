import { saveTournamentBonusAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminForPath } from "@/lib/admin/auth";
import { getTournamentBonusOverride } from "@/lib/admin/bonusOverrides";
import { getTournamentBonusResult } from "@/lib/game/bonusResults";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function valueText(value: string | number | null | undefined) {
  return value == null || value === "" ? "-" : String(value);
}

function listText(value: string | string[] | number | null | undefined) {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-";
  return valueText(value);
}

export default async function AdminBonusPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdminForPath("/admin/bonus");
  const params = await searchParams;
  const [config, bonus] = await Promise.all([
    getTournamentBonusOverride().catch(() => null),
    getTournamentBonusResult(prisma)
  ]);

  return (
    <AdminShell>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Bonus final</CardTitle></CardHeader>
          <CardContent>
            {params.saved ? <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">Bonus guardado.</p> : null}
            {params.error ? <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">Revisa los valores del bonus.</p> : null}
            <form action={saveTournamentBonusAction} className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Campeon
                <input className="h-10 rounded-md border border-slate-200 px-3" name="campeon" defaultValue={config?.campeon ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                Subcampeon
                <input className="h-10 rounded-md border border-slate-200 px-3" name="subcampeon" defaultValue={config?.subcampeon ?? ""} />
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                Semifinalistas
                <input className="h-10 rounded-md border border-slate-200 px-3" name="semifinalistas" defaultValue={config?.semifinalistas ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                Maximo goleador
                <input className="h-10 rounded-md border border-slate-200 px-3" name="maximoGoleador" defaultValue={config?.maximoGoleador ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                Total goles torneo
                <input className="h-10 rounded-md border border-slate-200 px-3" name="totalGolesTorneo" defaultValue={config?.totalGolesTorneo ?? ""} type="number" min="0" />
              </label>
              <label className="grid gap-1 text-sm">
                Seleccion mas goleadora
                <input className="h-10 rounded-md border border-slate-200 px-3" name="seleccionMasGoleadora" defaultValue={config?.seleccionMasGoleadora ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                Seleccion mas goleada
                <input className="h-10 rounded-md border border-slate-200 px-3" name="seleccionMasGoleada" defaultValue={config?.seleccionMasGoleada ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                Seleccion menos goleadora
                <input className="h-10 rounded-md border border-slate-200 px-3" name="seleccionMenosGoleadora" defaultValue={config?.seleccionMenosGoleadora ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                Seleccion menos goleada
                <input className="h-10 rounded-md border border-slate-200 px-3" name="seleccionMenosGoleada" defaultValue={config?.seleccionMenosGoleada ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                Equipo revelacion
                <input className="h-10 rounded-md border border-slate-200 px-3" name="equipoRevelacion" defaultValue={config?.equipoRevelacion ?? ""} />
              </label>
              <label className="grid gap-1 text-sm">
                Equipo decepcion
                <input className="h-10 rounded-md border border-slate-200 px-3" name="equipoDecepcion" defaultValue={config?.equipoDecepcion ?? ""} />
              </label>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input name="bonusLockedOverride" type="checkbox" defaultChecked={config?.bonusLockedOverride === true} />
                Forzar bonus puntuable
              </label>
              <div className="md:col-span-2">
                <Button>Guardar bonus</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Calculado por el motor</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>Estado: <strong>{bonus.bonusLocked ? "Puntuable" : "Pendiente de final"}</strong></p>
            <p>Campeon: <strong>{valueText(bonus.campeon)}</strong></p>
            <p>Subcampeon: <strong>{valueText(bonus.subcampeon)}</strong></p>
            <p>Semifinalistas: <strong>{bonus.semifinalistas?.map(valueText).join(", ") || "-"}</strong></p>
            <p>Maximo goleador: <strong>{listText(bonus.maximoGoleador)}</strong></p>
            <p>Seleccion mas goleadora: <strong>{listText(bonus.seleccionMasGoleadora)}</strong></p>
            <p>Seleccion mas goleada: <strong>{listText(bonus.seleccionMasGoleada)}</strong></p>
            <p>Seleccion menos goleadora: <strong>{listText(bonus.seleccionMenosGoleadora)}</strong></p>
            <p>Seleccion menos goleada: <strong>{listText(bonus.seleccionMenosGoleada)}</strong></p>
            <p>Equipo revelacion: <strong>{listText(bonus.equipoRevelacion)}</strong></p>
            <p>Equipo decepcion: <strong>{listText(bonus.equipoDecepcion)}</strong></p>
            <p>Total goles: <strong>{valueText(bonus.totalGolesTorneo)}</strong></p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
