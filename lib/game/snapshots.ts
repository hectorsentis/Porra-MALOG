import type { RankingRow } from "./types";

export type SnapshotDraft = {
  label: string;
  source: string;
  rows: RankingRow[];
};

export function createSnapshotDraft(rows: RankingRow[], label = "Recalculo online", source = "engine"): SnapshotDraft {
  return {
    label,
    source,
    rows: rows.map((row) => ({ ...row }))
  };
}
