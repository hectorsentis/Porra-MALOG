import { clearTestResultsAction, saveResultAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminResultadosPage() {
  await requireAdmin();
  let matches: Array<{ matchId: string; matchNo: number | null; fase: string | null; jornadaId: string | null; homeTeam: string | null; awayTeam: string | null; homeGoals: number | null; awayGoals: number | null; qualifiedTeamId: string | null; status: string }> = [];
  try {
    matches = await prisma.match.findMany({
      orderBy: [{ fecha: "asc" }, { matchNo: "asc" }],
      select: { matchId: true, matchNo: true, fase: true, jornadaId: true, homeTeam: true, awayTeam: true, homeGoals: true, awayGoals: true, qualifiedTeamId: true, status: true }
    });
  } catch {
    matches = [];
  }
  return (
    <AdminShell>
      <Card>
        <CardHeader><CardTitle>Meter resultados online</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <form action={clearTestResultsAction} className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-sm font-semibold text-amber-950">Inicio de produccion</p>
            <p className="mb-3 text-sm text-amber-900">Limpia marcadores cargados durante pruebas y deja todos los partidos pendientes.</p>
            <Button name="intent" value="clear" variant="secondary">Limpiar resultados de prueba</Button>
          </form>
          {matches.map((match) => (
            <form key={match.matchId} action={saveResultAction} className="grid gap-2 rounded-md border border-slate-100 p-3 md:grid-cols-[1fr_80px_80px_140px_auto_auto] md:items-center">
              <input type="hidden" name="matchId" value={match.matchId} />
              <div>
                <p className="text-sm font-semibold">#{match.matchNo ?? "-"} {match.homeTeam ?? "Local"} - {match.awayTeam ?? "Visitante"}</p>
                <p className="text-xs text-slate-500">{match.fase ?? "Fase"} · {match.jornadaId ?? "Jornada"} · {match.status}</p>
              </div>
              <input aria-label="Goles local" className="h-10 rounded-md border border-slate-200 px-2" name="homeGoals" defaultValue={match.homeGoals ?? ""} type="number" min="0" />
              <input aria-label="Goles visitante" className="h-10 rounded-md border border-slate-200 px-2" name="awayGoals" defaultValue={match.awayGoals ?? ""} type="number" min="0" />
              <input aria-label="Equipo clasificado" className="h-10 rounded-md border border-slate-200 px-2" name="qualifiedTeamId" defaultValue={match.qualifiedTeamId ?? ""} />
              <Button name="intent" value="draft" variant="secondary">Borrador</Button>
              <Button name="intent" value="official">Oficial</Button>
            </form>
          ))}
          {matches.length === 0 ? <p className="text-sm text-slate-500">No hay partidos cargados.</p> : null}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
