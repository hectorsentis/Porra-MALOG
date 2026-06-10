import { notFound } from "next/navigation";
import { PageTitle } from "@/components/PageTitle";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicParticipant } from "@/lib/public/queries";

export const dynamic = "force-dynamic";

export default async function ParticipantePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getPublicParticipant(slug);
  if (!profile) notFound();
  return (
    <PublicShell>
      <PageTitle title={profile.alias} subtitle={`${profile.departamento ?? "Sin departamento"} · ${profile.rango ?? "Sin rango"}`} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent><p className="text-xs uppercase text-slate-500">Posicion</p><p className="text-3xl font-bold text-primary">#{profile.pos}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs uppercase text-slate-500">Puntos</p><p className="text-3xl font-bold">{profile.pointsTotal}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs uppercase text-slate-500">Apuestas</p><p className="text-3xl font-bold">{profile.betsCount}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs uppercase text-slate-500">Signos</p><p className="text-3xl font-bold">{profile.correctSigns}</p></CardContent></Card>
      </section>
    </PublicShell>
  );
}
