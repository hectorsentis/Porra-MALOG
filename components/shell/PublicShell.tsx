import Link from "next/link";
import { BarChart3, CalendarClock, Gauge, MessageSquareText, Trophy, Users } from "lucide-react";
import { OfficialBrandLogo } from "@/components/shell/OfficialBrandLogo";
import { Badge } from "@/components/ui/badge";

const nav = [
  ["/", "Dashboard"],
  ["/clasificacion", "Clasificacion"],
  ["/chat", "Chat"],
  ["/evolucion", "Evolucion"],
  ["/apuestas", "Apuestas"],
  ["/partidos", "Partidos"],
  ["/fixture", "Fixture"],
  ["/departamentos", "Departamentos"],
  ["/simulador", "Simulador"],
  ["/participantes", "Participantes"],
  ["/estadisticas", "Estadisticas"],
  ["/bote", "Bote"],
  ["/reglas", "Reglas"]
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-air-page">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-air-dark text-[#FFFFFF]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            aria-label="Ir al inicio de PORRA MUNDIAL 2026 MALOG"
            className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-air-gold focus-visible:ring-offset-2 focus-visible:ring-offset-air-dark sm:gap-3"
          >
            <OfficialBrandLogo priority />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold uppercase tracking-wide text-[#FFFFFF] sm:text-base">PORRA MUNDIAL 2026 MALOG</p>
              <p className="hidden truncate text-xs text-blue-100 sm:block">Ejército del Aire y del Espacio · seguimiento oficial</p>
            </div>
          </Link>
          <Badge className="hidden border-air-gold bg-[var(--bg-elevated)] text-air-gold sm:inline-flex">
            <CalendarClock className="mr-1 h-3.5 w-3.5" /> En vivo
          </Badge>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-24 pt-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-4">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 grid gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-card">
            {nav.map(([href, label], index) => {
              const Icon = href === "/chat" ? MessageSquareText : [Gauge, Trophy, BarChart3, Users][index % 4];
              return (
                <Link key={href} href={href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-air-gold">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex gap-1 overflow-x-auto border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] lg:hidden" aria-label="Menu publico movil">
        {nav.map(([href, label]) => (
          <Link key={href} href={href} className="flex min-w-[104px] shrink-0 items-center justify-center rounded-md px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}



