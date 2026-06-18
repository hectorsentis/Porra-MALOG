/**
 * Fix masivo: corrige Fecha y Kickoff_Time en tbl_matches leyendo del Excel.
 *
 * Uso:
 *   npx tsx scripts/fix-fechas.ts              # dry-run (muestra sin tocar DB)
 *   npx tsx scripts/fix-fechas.ts --apply      # aplica los cambios en Supabase
 */
import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE!;
const EXCEL_PATH = resolve(__dirname, "../data/input/Porra_mundial2026.xlsx");
const MADRID_TZ = "Europe/Madrid";
const apply = process.argv.includes("--apply");

// ── Helpers (inlined from lib/utils/timezone.ts to avoid ts-node alias issues) ──

function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUtc - date.getTime()) / 60_000;
}

function getMatchKickoffUtc(fecha: Date, hora: string): Date {
  const [hourStr, minuteStr] = hora.split(":");
  const hour = Number(hourStr) || 0;
  const minute = Number(minuteStr) || 0;
  const naiveUtc = Date.UTC(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate(),
    hour,
    minute
  );
  const offsetMinutes = getTimeZoneOffsetMinutes(MADRID_TZ, new Date(naiveUtc));
  return new Date(naiveUtc - offsetMinutes * 60_000);
}

// ── Excel reading ───────────────────────────────────────────────────────────

function textVal(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value).trim() || null;
}

function normalizeHora(value: string | null): string | null {
  if (!value) return null;
  const m = value.match(/(\d{1,2}):(\d{2})/);
  if (!m) return value;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function parseDisplayFecha(display: string): Date | null {
  const parts = display.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!parts) return null;
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  let year = Number(parts[3]);
  if (year < 100) year += 2000;
  return new Date(Date.UTC(year, month, day));
}

type MatchFix = {
  matchId: string;
  matchNo: number | null;
  oldFecha: string | null;
  newFecha: string;
  hora: string;
  oldKickoff: string | null;
  newKickoff: string;
  changed: boolean;
};

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE in env");
    process.exit(1);
  }

  // 1. Read Excel formatted values
  const buf = readFileSync(EXCEL_PATH);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true, bookFiles: true });
  const sheet = wb.Sheets["04_MATCHES"];
  if (!sheet) { console.error("Sheet 04_MATCHES not found"); process.exit(1); }

  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null });
  const fmtMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: null });

  let headerRow = -1;
  let idxMatchId = -1, idxMatchNo = -1, idxFecha = -1, idxHora = -1;
  for (let r = 0; r < Math.min(rawMatrix.length, 20); r++) {
    const cols = rawMatrix[r].map((v) => textVal(v) ?? "");
    const mi = cols.indexOf("Match_ID");
    const fi = cols.indexOf("Fecha");
    const hi = cols.indexOf("Hora");
    if (mi !== -1 && fi !== -1 && hi !== -1) {
      headerRow = r;
      idxMatchId = mi;
      idxMatchNo = cols.indexOf("Match_No");
      idxFecha = fi;
      idxHora = hi;
      break;
    }
  }
  if (headerRow === -1) { console.error("Header row not found in 04_MATCHES"); process.exit(1); }

  const excelMatches = new Map<string, { fecha: Date; hora: string; matchNo: number | null }>();
  for (let r = headerRow + 1; r < rawMatrix.length; r++) {
    const matchId = textVal(rawMatrix[r]?.[idxMatchId]);
    if (!matchId) continue;
    const fmtFecha = String(fmtMatrix[r]?.[idxFecha] ?? "");
    const fmtHora = String(fmtMatrix[r]?.[idxHora] ?? "");
    const fecha = parseDisplayFecha(fmtFecha);
    const hora = normalizeHora(fmtHora);
    if (!fecha || !hora) {
      console.warn(`  SKIP ${matchId}: can't parse fecha="${fmtFecha}" hora="${fmtHora}"`);
      continue;
    }
    const rawMatchNo = rawMatrix[r]?.[idxMatchNo];
    const matchNo = typeof rawMatchNo === "number" ? rawMatchNo : null;
    excelMatches.set(matchId, { fecha, hora, matchNo });
  }
  console.log(`Excel: ${excelMatches.size} matches parsed\n`);

  // 2. Read current DB values
  const dbUrl = `${SUPABASE_URL}/rest/v1/tbl_matches?select=Match_ID,Match_No,Fecha,Hora,Kickoff_Time&order=Match_No.asc&limit=200`;
  const dbRes = await fetch(dbUrl, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!dbRes.ok) { console.error("DB fetch failed:", dbRes.status, await dbRes.text()); process.exit(1); }
  const dbRows: Array<{ Match_ID: string; Match_No: number; Fecha: string | null; Hora: string | null; Kickoff_Time: string | null }> = await dbRes.json();
  console.log(`DB: ${dbRows.length} matches\n`);

  // 3. Compute fixes
  const fixes: MatchFix[] = [];
  for (const row of dbRows) {
    const excel = excelMatches.get(row.Match_ID);
    if (!excel) continue;
    const newFecha = excel.fecha;
    const newKickoff = getMatchKickoffUtc(newFecha, excel.hora);
    const newFechaIso = newFecha.toISOString();
    const newKickoffIso = newKickoff.toISOString();
    const oldFecha = row.Fecha ? new Date(row.Fecha).toISOString() : null;
    const oldKickoff = row.Kickoff_Time ? new Date(row.Kickoff_Time).toISOString() : null;
    const fechaChanged = oldFecha !== newFechaIso;
    const kickoffChanged = oldKickoff !== newKickoffIso;
    fixes.push({
      matchId: row.Match_ID,
      matchNo: row.Match_No,
      oldFecha,
      newFecha: newFechaIso,
      hora: excel.hora,
      oldKickoff,
      newKickoff: newKickoffIso,
      changed: fechaChanged || kickoffChanged,
    });
  }

  const changed = fixes.filter((f) => f.changed);
  console.log(`Matches to fix: ${changed.length} / ${fixes.length}\n`);

  // Show diff
  for (const f of changed) {
    console.log(`${f.matchId} (M${f.matchNo}):`);
    if (f.oldFecha !== f.newFecha) console.log(`  fecha:   ${f.oldFecha} → ${f.newFecha}`);
    if (f.oldKickoff !== f.newKickoff) console.log(`  kickoff: ${f.oldKickoff} → ${f.newKickoff}  (hora ${f.hora} Madrid)`);
  }

  if (!apply) {
    console.log("\nDry-run. Usa --apply para grabar.");
    return;
  }

  // 4. Apply fixes via Supabase REST
  let updated = 0;
  for (const f of changed) {
    const patchUrl = `${SUPABASE_URL}/rest/v1/tbl_matches?Match_ID=eq.${f.matchId}`;
    const res = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ Fecha: f.newFecha, Kickoff_Time: f.newKickoff }),
    });
    if (!res.ok) {
      console.error(`  ERROR ${f.matchId}: ${res.status} ${await res.text()}`);
    } else {
      updated++;
    }
  }
  console.log(`\nUpdated: ${updated} / ${changed.length}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
