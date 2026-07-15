import { revalidateTag, unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const BONUS_OVERRIDE_CACHE_TAG = "bonus-override";

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

async function readTournamentBonusOverride() {
  const { data, error } = await supabaseAdmin()
    .from("tbl_tournament_bonus_results")
    .select(selectColumns)
    .eq("id", "default")
    .maybeSingle<TournamentBonusOverride>();

  if (error) throw error;
  return data;
}

export async function getTournamentBonusOverride() {
  return readTournamentBonusOverride();
}

export const getCachedTournamentBonusOverride = unstable_cache(
  readTournamentBonusOverride,
  [BONUS_OVERRIDE_CACHE_TAG],
  { revalidate: 300, tags: [BONUS_OVERRIDE_CACHE_TAG] }
);

export async function saveTournamentBonusOverride(data: Omit<TournamentBonusOverride, "id">) {
  const { error } = await supabaseAdmin()
    .from("tbl_tournament_bonus_results")
    .upsert({ id: "default", ...data, updatedAt: new Date().toISOString() }, { onConflict: "id" });

  if (error) throw error;
  try {
    revalidateTag(BONUS_OVERRIDE_CACHE_TAG);
  } catch {
    // Standalone scripts do not provide a Next.js cache context.
  }
}
