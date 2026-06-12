"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ParticipantEvolutionChart, seriesColor, type ChartRow } from "./StatisticsCharts";

export function ParticipantEvolutionPanel({
  data,
  series,
  selectedAlias
}: {
  data: ChartRow[];
  series: string[];
  selectedAlias: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggleAlias = (alias: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("alias") === alias) {
      params.delete("alias");
    } else {
      params.set("alias", alias);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <>
      <ParticipantEvolutionChart data={data} series={series} selectedSeries={selectedAlias} />
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {series.map((alias, index) => {
          const isSelected = selectedAlias === alias;
          return (
            <button
              key={alias}
              type="button"
              onClick={() => toggleAlias(alias)}
              title={isSelected ? "Quitar filtro" : `Filtrar por ${alias}`}
              className={`inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors ${
                isSelected ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: seriesColor(index, series.length) }}
              />
              {alias}
            </button>
          );
        })}
      </div>
    </>
  );
}
