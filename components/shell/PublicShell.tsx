import Image from "next/image";
import Link from "next/link";
import { BarChart3, CalendarClock, Gauge, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const nav = [
  ["/", "Dashboard"],
  ["/clasificacion", "Clasificacion"],
  ["/evolucion", "Evolucion"],
  ["/apuestas", "Apuestas"],
  ["/partidos", "Partidos"],
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
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-air-dark text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white p-1 shadow-sm"><Image src="/assets/Rokiski azul.svg" alt="Logo PORRA MUNDIAL 2026 MALOG" width={32} height={32} className="h-full w-full object-contain" priority /></span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold">PORRA MUNDIAL 2026 MALOG</p>
              <p className="text-xs text-blue-100">Ejercito del Aire - seguimiento oficial</p>
            </div>
          </Link>
          <Badge className="hidden border-air-gold bg-slate-900 text-air-gold sm:inline-flex">
            <CalendarClock className="mr-1 h-3.5 w-3.5" /> En vivo
          </Badge>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 grid gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
            {nav.map(([href, label], index) => {
              const Icon = [Gauge, Trophy, BarChart3, Users][index % 4];
              return (
                <Link key={href} href={href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
        {nav.slice(0, 5).map(([href, label]) => (
          <Link key={href} href={href} className="truncate px-2 py-3 text-center text-xs font-medium text-slate-700">
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}


