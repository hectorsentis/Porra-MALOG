"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PublicDashboardData } from "@/lib/public/dto";

const colors = ["#1E3A8A", "#3B82F6", "#D4AF37", "#16A34A"];

export function TopTenChart({ ranking }: { ranking: PublicDashboardData["ranking"] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={ranking.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis dataKey="alias" type="category" width={90} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="pointsTotal" fill="#1E3A8A" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CompositionChart({ composition }: { composition: PublicDashboardData["composition"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={composition} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84}>
          {composition.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DepartmentChart({ data }: { data: PublicDashboardData["departmentAverages"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="departamento" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Line dataKey="averagePoints" stroke="#D4AF37" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
