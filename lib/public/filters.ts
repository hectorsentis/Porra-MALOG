import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCountry } from "@/lib/countries";

export type PublicFilters = {
  alias?: string;
  departamento?: string;
  rango?: string;
  fase?: string;
  jornada?: string;
  grupo?: string;
  equipo?: string;
  estado?: string;
  fecha?: string;
  partido?: string;
  resultado?: string;
  tab?: string;
};

export type PublicFilterOptions = {
  alias: string[];
  departamento: string[];
  rango: string[];
  fase: string[];
  jornada: string[];
  grupo: string[];
  equipo: string[];
};

export function parsePublicFilters(searchParams: Record<string, string | string[] | undefined>): PublicFilters {
  const read = (key: keyof PublicFilters) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return {
    alias: read("alias") || undefined,
    departamento: read("departamento") || undefined,
    rango: read("rango") || undefined,
    fase: read("fase") || undefined,
    jornada: read("jornada") || undefined,
    grupo: read("grupo") || undefined,
    equipo: read("equipo") || undefined,
    estado: read("estado") || undefined,
    fecha: read("fecha") || undefined,
    partido: read("partido") || undefined,
    resultado: read("resultado") || undefined,
    tab: read("tab") || "resumen"
  };
}

export function activeFilterEntries(filters: PublicFilters) {
  return Object.entries(filters).filter(([key, value]) => key !== "tab" && value);
}

export function filterUrl(filters: PublicFilters, removeKey?: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (!value || key === removeKey) continue;
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "?";
}

function clean(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "es-ES"));
}

export async function getPublicFilterOptions(): Promise<PublicFilterOptions> {
  noStore();
  const [rankings, matches, teams] = await Promise.all([
    prisma.generalRanking.findMany({
      select: { alias: true, departamento: true, rango: true },
      orderBy: { alias: "asc" }
    }),
    prisma.match.findMany({
      select: { fase: true, jornadaId: true, grupo: true },
      orderBy: [{ fase: "asc" }, { jornadaId: "asc" }]
    }),
    prisma.team.findMany({
      select: { teamId: true, seleccion: true },
      orderBy: { seleccion: "asc" }
    })
  ]);

  return {
    alias: clean(rankings.map((row) => row.alias)),
    departamento: clean(rankings.map((row) => row.departamento)),
    rango: clean(rankings.map((row) => row.rango)),
    fase: clean(matches.map((row) => row.fase)),
    jornada: clean(matches.map((row) => row.jornadaId)),
    grupo: clean(matches.map((row) => row.grupo)),
    equipo: clean(teams.map((team) => formatCountry(team.teamId, team.seleccion)))
  };
}


