"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import type { PublicClassificationRow } from "@/lib/public/dto";
import { Badge } from "@/components/ui/badge";

export function ClassificationTable({ rows }: { rows: PublicClassificationRow[] }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const columns = useMemo<ColumnDef<PublicClassificationRow>[]>(
    () => [
      { accessorKey: "pos", header: "Pos" },
      {
        accessorKey: "alias",
        header: "Alias",
        cell: ({ row }) => <Link className="font-semibold text-primary" href={`/participantes/${row.original.slug}`}>{row.original.alias}</Link>
      },
      { accessorKey: "departamento", header: "Departamento" },
      { accessorKey: "rango", header: "Rango" },
      { accessorKey: "pointsTotal", header: "Total" },
      { accessorKey: "pointsMatches", header: "Partidos" },
      { accessorKey: "pointsGroups", header: "Grupos" },
      { accessorKey: "pointsBonus", header: "Bonus" },
      {
        accessorKey: "deltaPos",
        header: "Delta",
        cell: ({ row }) => (
          <Badge className={row.original.deltaPos > 0 ? "text-air-up" : row.original.deltaPos < 0 ? "text-air-down" : "text-slate-500"}>
            {row.original.deltaPos > 0 ? "+" : ""}
            {row.original.deltaPos}
          </Badge>
        )
      }
    ],
    []
  );
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
      <input
        className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
        placeholder="Buscar por alias, departamento o rango"
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
      />
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[820px] text-sm">
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
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
