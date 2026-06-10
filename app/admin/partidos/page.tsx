import { saveMatchAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPartidosPage() {
  await requireAdmin();
  const [matches, teams] = await Promise.all([
    prisma.match.findMany({
      orderBy: [{ fecha: "asc" }, { matchNo: "asc" }],
      take: 120,
      select: {
        matchId: true,
        matchNo: true,
        fecha: true,
        jornadaId: true,
        fase: true,
        grupo: true,
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: true,
        awayTeam: true,
        status: true
      }
    }),
    prisma.team.findMany({ orderBy: [{ grupo: "asc" }, { seleccion: "asc" }], select: { teamId: true, seleccion: true } })
  ]);

  return (
    <AdminShell>
      <div className="grid gap-4">
        <Card>
          <CardHeader><CardTitle>Crear o editar partido</CardTitle></CardHeader>
          <CardContent>
            <form action={saveMatchAction} className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-1 text-sm">ID partido<input className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="matchId" required /></label>
              <label className="grid gap-1 text-sm">Numero<input className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="matchNo" type="number" /></label>
              <label className="grid gap-1 text-sm">Fecha<input className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="fecha" type="datetime-local" /></label>
              <label className="grid gap-1 text-sm">Jornada<input className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="jornadaId" /></label>
              <label className="grid gap-1 text-sm">Fase<input className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="fase" /></label>
              <label className="grid gap-1 text-sm">Grupo<input className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="grupo" /></label>
              <label className="grid gap-1 text-sm">Equipo local<select className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="homeTeamId">
                <option value="">Sin asignar</option>
                {teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.seleccion}</option>)}
              </select></label>
              <label className="grid gap-1 text-sm">Equipo visitante<select className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="awayTeamId">
                <option value="">Sin asignar</option>
                {teams.map((team) => <option key={team.teamId} value={team.teamId}>{team.seleccion}</option>)}
              </select></label>
              <label className="grid gap-1 text-sm">Nombre local<input className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="homeTeam" /></label>
              <label className="grid gap-1 text-sm">Nombre visitante<input className="h-10 rounded-md border border-slate-200 px-3 text-sm" name="awayTeam" /></label>
              <label className="flex h-10 items-center gap-2 text-sm"><input name="needsPens" type="checkbox" /> Puede requerir penaltis</label>
              <Button>Guardar partido</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Calendario operativo</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {matches.map((match) => (
              <div key={match.matchId} className="grid gap-2 rounded-md border border-slate-100 p-3 text-sm lg:grid-cols-[90px_1fr_120px_120px_110px]">
                <strong>{match.matchId}</strong>
                <span>{match.homeTeam ?? match.homeTeamId ?? "Local"} - {match.awayTeam ?? match.awayTeamId ?? "Visitante"}</span>
                <span>{match.fase ?? "Fase"}</span>
                <span>{match.jornadaId ?? "Jornada"}</span>
                <span>{match.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
