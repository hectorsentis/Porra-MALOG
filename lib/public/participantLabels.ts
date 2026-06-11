/**
 * Several participants can share the same alias (and even the same department),
 * e.g. two "ElRichard" both in "ALA 45". Build display labels keyed by participantId
 * so their data is never confused, disambiguating duplicates with the department
 * and a running number.
 */
export function participantLabels(entries: Map<string, { alias: string; departamento: string | null }>) {
  const groups = new Map<string, string[]>();
  for (const [participantId, entry] of entries) {
    const ids = groups.get(entry.alias) ?? [];
    ids.push(participantId);
    groups.set(entry.alias, ids);
  }
  const labels = new Map<string, string>();
  for (const [alias, ids] of groups) {
    if (ids.length === 1) {
      labels.set(ids[0], alias);
      continue;
    }
    ids.forEach((participantId, index) => {
      const departamento = entries.get(participantId)?.departamento ?? "Sin departamento";
      labels.set(participantId, `${alias} (${departamento} #${index + 1})`);
    });
  }
  return labels;
}
