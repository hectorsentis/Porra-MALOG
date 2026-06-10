import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const nav = [
  ["/admin", "Panel"],
  ["/admin/import", "Import"],
  ["/admin/partidos", "Partidos"],
  ["/admin/resultados", "Resultados"],
  ["/admin/bote", "Bote"],
  ["/admin/reglas", "Reglas"],
  ["/admin/logs", "Logs"],
  ["/admin/rollback", "Rollback"]
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-air-page">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="font-bold text-primary">Admin PORRA MALOG</Link>
          <form action={logoutAction}><Button variant="secondary">Salir</Button></form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="grid content-start gap-1 rounded-lg border border-slate-200 bg-white p-2">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">{label}</Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
