"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import type { ClassificationOverviewRow } from "@/lib/public/clasificacion";
import { Badge } from "@/components/ui/badge";
import { DeltaBadge } from "@/components/clasificacion/DeltaBadge";

function LastMatchBadge({ lastMatch }: { lastMatch: ClassificationOverviewRow["lastMatch"] }) {
  if (!lastMatch) return <span className="text-slate-400">—</span>;
  const className = lastMatch.tipo === "Exacto" ? "text-air-up" : lastMatch.tipo === "Ganador" ? "text-air-light" : "text-air-down";
  const title = `${lastMatch.label}${lastMatch.resultado ? ` (${lastMatch.resultado})` : ""}${lastMatch.apostado ? ` · Apostado: ${lastMatch.apostado}` : ""}`;
  return (
    <Badge className={className} title={title}>
      {lastMatch.tipo}
    </Badge>
  );
}

export function ClassificationTable({
  rows,
  delta = "both",
  topDayGainerAlias = null,
  topPhaseGainerAlias = null
}: {
  rows: ClassificationOverviewRow[];
  delta?: "both" | "phase" | "day";
  topDayGainerAlias?: string | null;
  topPhaseGainerAlias?: string | null;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const columns = useMemo<ColumnDef<ClassificationOverviewRow>[]>(() => {
    const all: ColumnDef<ClassificationOverviewRow>[] = [
      { accessorKey: "pos", header: "Pos" },
      {
        id: "deltaPosPhase",
        accessorKey: "deltaPosPhase",
        header: "Δ fase",
        cell: ({ row }) => <DeltaBadge value={row.original.deltaPosPhase} />
      },
      {
        id: "deltaPosDay",
        accessorKey: "deltaPosDay",
        header: "Δ dia",
        cell: ({ row }) => <DeltaBadge value={row.original.deltaPosDay} />
      },
      {
        accessorKey: "alias",
        header: "Alias",
        cell: ({ row }) => <Link className="font-semibold text-primary" href={`/participantes/${row.original.slug}`}>{row.original.alias}</Link>
      },
      { accessorKey: "departamento", header: "Dept" },
      { accessorKey: "pointsTotal", header: "Pts totales" },
      { accessorKey: "pointsToday", header: "Pts último día" },
      { accessorKey: "exactScores", header: "Exactos" },
      { accessorKey: "ganadores", header: "Ganadores" },
      { accessorKey: "fallos", header: "Fallos" },
      {
        accessorKey: "pctAcierto",
        header: "% acierto",
        cell: ({ row }) => `${Math.round(row.original.pctAcierto * 100)}%`
      },
      { accessorKey: "pointsMatches", header: "Pts grupos" },
      { accessorKey: "pointsEliminatorias", header: "Pts elim." },
      {
        id: "lastMatch",
        header: "Ultimo partido",
        cell: ({ row }) => <LastMatchBadge lastMatch={row.original.lastMatch} />
      },
      {
        id: "lastMatchPoints",
        header: "Pts ultimo partido",
        cell: ({ row }) => row.original.lastMatch?.points ?? "–"
      },
      {
        accessorKey: "racha",
        header: "Racha",
        cell: ({ row }) => (row.original.racha > 0 ? `🔥 ${row.original.racha}` : "–")
      }
    ];
    return all.filter((column) => {
      if (column.id === "deltaPosPhase") return delta === "both" || delta === "phase";
      if (column.id === "deltaPosDay") return delta === "both" || delta === "day";
      return true;
    });
  }, [delta]);
  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    <div className="space-y-3">
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Buscar
        <input
          className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-normal normal-case tracking-normal text-slate-900"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
        />
      </label>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[1220px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isTopGainer = row.original.alias === topDayGainerAlias || row.original.alias === topPhaseGainerAlias;
              return (
                <tr key={row.id} className={`border-t border-slate-100 ${isTopGainer ? "bg-emerald-50" : ""}`}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
