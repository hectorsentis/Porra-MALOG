import { loginAction } from "./actions";
import { verifyAdminSession } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-air-page p-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Admin PORRA MALOG</CardTitle></CardHeader>
          <CardContent>
            <form action={loginAction} className="grid gap-3">
              <input className="h-10 rounded-md border border-slate-200 px-3" name="username" placeholder="Usuario" autoComplete="username" />
              <input className="h-10 rounded-md border border-slate-200 px-3" name="password" placeholder="Password" type="password" autoComplete="current-password" />
              {params.error ? <p className="text-sm text-air-down">Credenciales no validas.</p> : null}
              <Button>Entrar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  let stats = { participants: 0, matches: 0, imports: 0 };
  try {
    const [participants, matches, imports] = await Promise.all([
      prisma.participant.count(),
      prisma.match.count(),
      prisma.importRun.count()
    ]);
    stats = { participants, matches, imports };
  } catch {
    // Admin remains accessible even before DATABASE_URL is configured.
  }

  return (
    <AdminShell>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent><p className="text-xs uppercase text-slate-500">Participantes</p><p className="text-3xl font-bold">{stats.participants}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs uppercase text-slate-500">Partidos</p><p className="text-3xl font-bold">{stats.matches}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs uppercase text-slate-500">Imports</p><p className="text-3xl font-bold">{stats.imports}</p></CardContent></Card>
      </div>
    </AdminShell>
  );
}
