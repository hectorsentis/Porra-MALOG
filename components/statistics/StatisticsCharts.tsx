"use client";

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

const colors = ["#1E3A8A", "#3B82F6", "#D4AF37", "#16A34A", "#DC2626"];

type ChartRow = Record<string, string | number | null | undefined>;

export function DistributionChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="alias" tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="pointsTotal" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PointCompositionChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ left: 8, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="alias" tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="partidos" stackId="points" fill="#1E3A8A" />
        <Bar dataKey="grupos" stackId="points" fill="#3B82F6" />
        <Bar dataKey="eliminatorias" stackId="points" fill="#D4AF37" />
        <Bar dataKey="bonus" stackId="points" fill="#16A34A" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RankingDensityChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="alias" tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="gapPrevious" fill="#3B82F6" />
        <Line dataKey="gapLeader" stroke="#D4AF37" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function AccuracyChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="alias" tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="exactScores" fill="#1E3A8A" />
        <Bar dataKey="correctSigns" fill="#3B82F6" />
        <Bar dataKey="correctDiff" fill="#D4AF37" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EvolutionLineChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="eventLabel" tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip />
        <Line dataKey="pointsTotal" stroke="#1E3A8A" strokeWidth={2} dot={false} />
        <Line dataKey="pos" stroke="#D4AF37" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data, nameKey = "name", valueKey = "value" }: { data: ChartRow[]; nameKey?: string; valueKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={valueKey} fill="#1E3A8A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RarityScatterChart({ data }: { data: ChartRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="rarity" name="Rareza" />
        <YAxis dataKey="points" name="Puntos" />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={data} fill="#D4AF37" />
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
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
