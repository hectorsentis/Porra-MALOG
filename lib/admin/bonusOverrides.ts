import { supabaseAdmin } from "@/lib/supabase/admin";

export type TournamentBonusOverride = {
  id: string;
  campeon: string | null;
  subcampeon: string | null;
  semifinalistas: string | null;
  maximoGoleador: string | null;
  seleccionMasGoleadora: string | null;
  seleccionMasGoleada: string | null;
  seleccionMenosGoleadora: string | null;
  seleccionMenosGoleada: string | null;
  equipoRevelacion: string | null;
  equipoDecepcion: string | null;
  totalGolesTorneo: number | null;
  bonusLockedOverride: boolean | null;
  updatedBy: string | null;
};

const selectColumns = [
  "id",
  "campeon",
  "subcampeon",
  "semifinalistas",
  "maximoGoleador",
  "seleccionMasGoleadora",
  "seleccionMasGoleada",
  "seleccionMenosGoleadora",
  "seleccionMenosGoleada",
  "equipoRevelacion",
  "equipoDecepcion",
  "totalGolesTorneo",
  "bonusLockedOverride",
  "updatedBy"
].join(",");

export async function getTournamentBonusOverride() {
  const { data, error } = await supabaseAdmin()
    .from("tbl_tournament_bonus_results")
    .select(selectColumns)
    .eq("id", "default")
    .maybeSingle<TournamentBonusOverride>();

  if (error) throw error;
  return data;
}

export async function saveTournamentBonusOverride(data: Omit<TournamentBonusOverride, "id">) {
  const { error } = await supabaseAdmin()
    .from("tbl_tournament_bonus_results")
    .upsert({ id: "default", ...data, updatedAt: new Date().toISOString() }, { onConflict: "id" });

  if (error) throw error;
}
