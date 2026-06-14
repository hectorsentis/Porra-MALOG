import { saveTournamentBonusAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { getTournamentBonusResult } from "@/lib/game/bonusResults";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type BonusConfig = { maximoGoleador: string | null };

function valueText(value: string | number | null | undefined) {
  return value == null || value === "" ? "-" : String(value);
}

function listText(value: string | string[] | number | null | undefined) {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-";
  return valueText(value);
}

export default async function AdminBonusPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const db = prisma as unknown as {
    tournamentBonusResult: { findUnique: (args: { where: { id: string } }) => Promise<BonusConfig | null> };
  };
  const [config, bonus] = await Promise.all([
    db.tournamentBonusResult.findUnique({ where: { id: "default" } }),
    getTournamentBonusResult(prisma)
  ]);

  return (
    <AdminShell>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>Bonus final</CardTitle></CardHeader>
          <CardContent>
            {params.saved ? <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">Bonus guardado.</p> : null}
            <form action={saveTournamentBonusAction} className="grid gap-3">
              <label className="grid gap-1 text-sm">
                Maximo goleador
                <input className="h-10 rounded-md border border-slate-200 px-3" name="maximoGoleador" defaultValue={config?.maximoGoleador ?? ""} />
                <span className="text-xs text-slate-500">Si hay empate, separa los nombres por comas.</span>
              </label>
              <Button>Guardar bonus</Button>
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
