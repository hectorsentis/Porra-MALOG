export type PublicFilters = {
  alias?: string;
  departamento?: string;
  rango?: string;
  fase?: string;
  jornada?: string;
  grupo?: string;
  equipo?: string;
  tab?: string;
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
