import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { OfficialBrandLogo } from "@/components/shell/OfficialBrandLogo";
import { Button } from "@/components/ui/button";

const nav = [
  ["/admin", "Panel"],
  ["/admin/import", "Import"],
  ["/admin/partidos", "Partidos"],
  ["/admin/resultados", "Resultados"],
  ["/admin/bonus", "Bonus"],
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
          <Link
            href="/admin"
            aria-label="Ir al panel de administración de PORRA MUNDIAL 2026 MALOG"
            className="flex min-w-0 items-center gap-3 rounded-md font-display font-bold uppercase tracking-wide text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-air-gold"
          >
            <OfficialBrandLogo className="h-11 w-24 sm:h-12 sm:w-32" />
            <span className="hidden truncate sm:inline">Admin PORRA MALOG</span>
          </Link>
          <form action={logoutAction}><Button variant="secondary">Salir</Button></form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="grid content-start gap-1 rounded-lg border border-slate-200 bg-white p-2">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-air-gold">{label}</Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}



