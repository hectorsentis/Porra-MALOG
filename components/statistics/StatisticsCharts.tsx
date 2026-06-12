"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const colors = ["#1565C0", "#C8A84B", "#4CAF50", "#EF5350", "#42A5F5"];
const axisColor = "#8892A4";
const gridColor = "#243356";
const axisTick = { fill: axisColor, fontSize: 11 };
const tooltipContentStyle = {
  background: "#121A2E",
  border: "1px solid #243356",
  borderRadius: 8,
  color: "#E8ECF4",
  fontFamily: "var(--font-body)"
};
const tooltipLabelStyle = { color: "#C8A84B" };
const tooltipItemStyle = { color: "#E8ECF4" };

const labelMap: Record<string, string> = {
  pointsTotal: "Puntos",
  gapPrevious: "Distancia anterior",
  gapLeader: "Distancia lider",
  exactScores: "Exactos",
  correctSigns: "Signos",
  correctDiff: "Diferencias",
  pointsGainedThisRun: "Puntos evento",
  deltaPos: "Movimiento",
  pointsStd: "Dispersion puntos",
  averageMovement: "Movimiento medio",
  partidos: "Partidos",
  grupos: "Grupos",
  eliminatorias: "Eliminatorias",
  bonus: "Bonus",
  value: "Total",
  rarity: "Rareza",
  points: "Puntos",
  pos: "Posicion"
};
function tooltipLabel(name: unknown) {
  const key = String(name);
  return labelMap[key] ?? key;
}
const tooltipFormatter = (value: unknown, name: unknown): [ReactNode, string] => [value as ReactNode, tooltipLabel(name)];

type ChartRow = Record<string, string | number | null | undefined>;

export function DistributionChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="alias" tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "rgba(200, 168, 75, 0.08)" }} />
        <Bar dataKey="pointsTotal" fill={colors[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PointCompositionChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ left: 8, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="alias" tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "rgba(200, 168, 75, 0.08)" }} />
        <Bar dataKey="partidos" stackId="points" fill={colors[0]} />
        <Bar dataKey="grupos" stackId="points" fill={colors[4]} />
        <Bar dataKey="eliminatorias" stackId="points" fill={colors[1]} />
        <Bar dataKey="bonus" stackId="points" fill={colors[2]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RankingDensityChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="alias" tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "rgba(200, 168, 75, 0.08)" }} />
        <Bar dataKey="gapPrevious" fill={colors[4]} />
        <Line dataKey="gapLeader" stroke={colors[1]} strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function AccuracyChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="alias" tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "rgba(200, 168, 75, 0.08)" }} />
        <Bar dataKey="exactScores" fill={colors[0]} />
        <Bar dataKey="correctSigns" fill={colors[4]} />
        <Bar dataKey="correctDiff" fill={colors[1]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EvolutionLineChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="eventLabel" tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ stroke: gridColor }} />
        <Line dataKey="pointsTotal" stroke={colors[0]} strokeWidth={2} dot={false} />
        <Line dataKey="pos" stroke={colors[1]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function seriesColor(index: number, total: number) {
  if (index < colors.length) return colors[index];
  const hue = (index * 360) / Math.max(total, 1);
  return `hsl(${Math.round(hue % 360)}, 65%, 55%)`;
}

export function ParticipantEvolutionChart({ data, series }: { data: ChartRow[]; series: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={420}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="day" tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ stroke: gridColor }} />
        {series.map((name, index) => (
          <Line key={name} type="monotone" dataKey={name} stroke={seriesColor(index, series.length)} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data, nameKey = "name", valueKey = "value" }: { data: ChartRow[]; nameKey?: string; valueKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey={nameKey} tick={axisTick} />
        <YAxis tick={axisTick} />
        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "rgba(200, 168, 75, 0.08)" }} />
        <Bar dataKey={valueKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RarityScatterChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="rarity" name="Rareza" tick={axisTick} />
        <YAxis dataKey="points" name="Puntos" tick={axisTick} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={tooltipFormatter} contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
        <Scatter data={data} fill={colors[1]} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function PrizePieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={tooltipFormatter} contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
