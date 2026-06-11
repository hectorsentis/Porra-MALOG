import * as XLSX from "xlsx";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const participantSchema = z.object({
  participantId: z.string().min(1),
  timestamp: z.date().nullable(),
  email: z.string().nullable(),
  fullName: z.string().nullable(),
  alias: z.string().min(1),
  departamento: z.string().nullable(),
  rango: z.string().nullable(),
  estado: z.string().nullable(),
  pagado: z.string().nullable(),
  source: z.string().nullable(),
  pay: z.string().nullable(),
  templateSent: z.string().nullable(),
  resultReceived: z.string().nullable(),
  slug: z.string().min(1)
});

const teamSchema = z.object({
  teamId: z.string().min(1),
  pais: z.string().nullable(),
  seleccion: z.string().min(1),
  grupo: z.string().nullable(),
  ordenGrupo: z.number().int().nullable(),
  confederacion: z.string().nullable(),
  tieBreakerRank: z.number().int().nullable(),
  fifaRank: z.number().int().nullable(),
  comentarios: z.string().nullable(),
  flag: z.string().nullable()
});

const matchSchema = z.object({
  matchId: z.string().min(1),
  matchNo: z.number().int().nullable(),
  fecha: z.date().nullable(),
  hora: z.string().nullable(),
  jornadaId: z.string().nullable(),
  fase: z.string().nullable(),
  grupo: z.string().nullable(),
  homeSlot: z.string().nullable(),
  awaySlot: z.string().nullable(),
  homeTeamIdManual: z.string().nullable(),
  awayTeamIdManual: z.string().nullable(),
  homeTeamId: z.string().nullable(),
  awayTeamId: z.string().nullable(),
  homeTeam: z.string().nullable(),
  awayTeam: z.string().nullable(),
  homeGoals: z.number().int().nullable(),
  awayGoals: z.number().int().nullable(),
  homePens: z.number().int().nullable(),
  awayPens: z.number().int().nullable(),
  finished: z.boolean(),
  resultText: z.string().nullable(),
  realSign: z.string().nullable(),
  goalDiff: z.number().int().nullable(),
  winnerTeamId: z.string().nullable(),
  qualifiedTeamId: z.string().nullable(),
  overrideQualifiedTeamId: z.string().nullable(),
  needsPens: z.boolean(),
  statusCheck: z.string().nullable(),
  bettingDeadline: z.date().nullable(),
  notas: z.string().nullable()
});

const classificationSchema = z.object({
  pos: z.number().int(),
  participantId: z.string().min(1),
  alias: z.string().min(1),
  departamento: z.string().nullable(),
  rango: z.string().nullable(),
  pointsMatches: z.number().int(),
  pointsGroups: z.number().int(),
  pointsEliminatorias: z.number().int(),
  pointsBonus: z.number().int(),
  pointsTotal: z.number().int(),
  exactScores: z.number().int(),
  correctDiff: z.number().int(),
  correctSigns: z.number().int(),
  correctGroupQualified: z.number().int(),
  correctGroupPositions: z.number().int(),
  correctCruces: z.number().int(),
  pointsTotalFecha: z.number().int(),
  posFecha: z.number().int().nullable(),
  deltaPos: z.number().int(),
  deltaPoints: z.number().int()
});

export type ExcelImportPreview = {
  filename: string;
  dryRun: boolean;
  counts: Record<string, number>;
  warnings: string[];
  errors: string[];
  sampleParticipants: Array<{
    participantId: string;
    alias: string;
    departamento: string | null;
    rango: string | null;
    slug: string;
  }>;
};

type ParsedWorkbook = {
  participants: z.infer<typeof participantSchema>[];
  teams: z.infer<typeof teamSchema>[];
  matches: z.infer<typeof matchSchema>[];
  betMatches: Record<string, unknown>[];
  groupBets: Record<string, unknown>[];
  bonusBets: Record<string, unknown>[];
  classifications: z.infer<typeof classificationSchema>[];
  warnings: string[];
  errors: string[];
};

function toPreview(parsed: ParsedWorkbook & ExcelImportPreview, dryRun: boolean): ExcelImportPreview {
  return {
    filename: parsed.filename,
    dryRun,
    counts: parsed.counts,
    warnings: parsed.warnings,
    errors: parsed.errors,
    sampleParticipants: parsed.sampleParticipants
  };
}

function text(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text.trim() || null;
  const result = String(value).trim();
  return result || null;
}

function number(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  const parsed = Number(text(value)?.replace(",", "."));
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function date(value: unknown): Date | null {
  if (value instanceof Date) return value;
  const raw = text(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function bool(value: unknown): boolean {
  const raw = text(value)?.toLowerCase();
  return ["true", "1", "yes", "si", "sí", "x", "finished", "finalizado"].includes(raw ?? "");
}

/**
 * Normalizes a time-of-day string to "HH:MM". Excel stores time-only cells as
 * datetimes anchored at 1899-12-30, and the raw serial value can carry sub-minute
 * floating point drift that doesn't match what Excel actually displays for the cell.
 */
function normalizeHora(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return value;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/**
 * Reads the "Hora" column of 04_MATCHES using Excel's own display formatting
 * (raw: false), keyed by Match_ID, so the imported value matches what's shown
 * in the spreadsheet instead of the raw 1899-12-30-anchored serial value.
 */
function matchHoraDisplayMap(workbook: XLSX.WorkBook): Map<string, string> {
  const result = new Map<string, string>();
  const sheet = workbook.Sheets["04_MATCHES"];
  if (!sheet) return result;
  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null });
  const formattedMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: null });

  let matchIdIndex = -1;
  let horaIndex = -1;
  let headerRowNumber = -1;
  for (let rowNumber = 0; rowNumber < Math.min(rawMatrix.length, 20); rowNumber += 1) {
    const candidates = rawMatrix[rowNumber].map((value) => text(value) ?? "");
    const mIndex = candidates.indexOf("Match_ID");
    const hIndex = candidates.indexOf("Hora");
    if (mIndex !== -1 && hIndex !== -1) {
      headerRowNumber = rowNumber;
      matchIdIndex = mIndex;
      horaIndex = hIndex;
      break;
    }
  }
  if (headerRowNumber === -1) return result;

  for (let rowNumber = headerRowNumber + 1; rowNumber < rawMatrix.length; rowNumber += 1) {
    const matchId = text(rawMatrix[rowNumber]?.[matchIdIndex]);
    const formattedHora = formattedMatrix[rowNumber]?.[horaIndex];
    if (matchId && formattedHora != null) result.set(matchId, String(formattedHora));
  }
  return result;
}

type TableInfo = { sheetName: string; ref: string };

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : null;
}

function fileText(workbook: XLSX.WorkBook, path: string): string | null {
  const file = (workbook as unknown as { files?: Record<string, { content?: Buffer | string }> }).files?.[path];
  if (!file?.content) return null;
  return Buffer.isBuffer(file.content) ? file.content.toString("utf-8") : String(file.content);
}

/**
 * Several sheets (e.g. 02_PARTICIPANTES) place multiple Excel Tables side by
 * side, sharing column names like "Alias" or "Pagado" between an unrelated
 * tracking table and the real data table. Reading by sheet name + header row
 * conflates them, so we resolve each named Table's sheet and cell range
 * (its "ref", e.g. "A1:M48") from the workbook's table/relationship XML and
 * read only that range.
 */
function loadTableMap(workbook: XLSX.WorkBook): Map<string, TableInfo> {
  const tableMap = new Map<string, TableInfo>();
  const workbookXml = fileText(workbook, "xl/workbook.xml") ?? "";
  const workbookRelsXml = fileText(workbook, "xl/_rels/workbook.xml.rels") ?? "";

  const sheetNameToRid = new Map<string, string>();
  for (const match of workbookXml.matchAll(/<sheet\b[^>]*\/>/g)) {
    const name = attr(match[0], "name");
    const rid = attr(match[0], "r:id");
    if (name && rid) sheetNameToRid.set(name, rid);
  }

  const ridToTarget = new Map<string, string>();
  for (const match of workbookRelsXml.matchAll(/<Relationship\b[^>]*\/>/g)) {
    const id = attr(match[0], "Id");
    const target = attr(match[0], "Target");
    if (id && target) ridToTarget.set(id, target);
  }

  for (const [sheetName, rid] of sheetNameToRid) {
    const target = ridToTarget.get(rid);
    if (!target) continue;
    const sheetFileName = target.split("/").pop()!;
    const sheetRelsXml = fileText(workbook, `xl/worksheets/_rels/${sheetFileName}.rels`) ?? "";
    for (const match of sheetRelsXml.matchAll(/<Relationship\b[^>]*\/>/g)) {
      const relTarget = attr(match[0], "Target");
      if (!relTarget?.includes("/tables/")) continue;
      const tableXml = fileText(workbook, `xl/${relTarget.replace(/^\.\.\//, "")}`);
      const tableTag = tableXml?.match(/<table\b[^>]*>/)?.[0];
      if (!tableTag) continue;
      const tableName = attr(tableTag, "name");
      const ref = attr(tableTag, "ref");
      if (tableName && ref) tableMap.set(tableName, { sheetName, ref });
    }
  }
  return tableMap;
}

function rowsByTable(workbook: XLSX.WorkBook, tableMap: Map<string, TableInfo>, tableName: string): Record<string, unknown>[] {
  const info = tableMap.get(tableName);
  if (!info) return [];
  const sheet = workbook.Sheets[info.sheetName];
  if (!sheet) return [];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null, range: info.ref });
  if (matrix.length === 0) return [];
  const headers = matrix[0].map((value) => text(value) ?? "");

  const rows: Record<string, unknown>[] = [];
  for (let rowNumber = 1; rowNumber < matrix.length; rowNumber += 1) {
    const values = matrix[rowNumber];
    const record: Record<string, unknown> = {};
    let hasValue = false;
    headers.forEach((header, index) => {
      if (!header) return;
      const value = values[index];
      if (text(value) != null || value instanceof Date || typeof value === "number") hasValue = true;
      record[header] = value;
    });
    if (hasValue) rows.push(record);
  }
  return rows;
}

function requiredMissing(rows: Record<string, unknown>[], required: string[]): string[] {
  if (rows.length === 0) return [`No rows found for required columns: ${required.join(", ")}`];
  return required.filter((column) => !(column in rows[0])).map((column) => `Missing column: ${column}`);
}

function duplicateWarnings(rows: Record<string, unknown>[], column: string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const value = text(row[column]);
    if (!value) continue;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].map((value) => `Duplicate ${column}: ${value}`);
}

function ensureUniqueSlugs<T extends { slug: string; participantId: string }>(rows: T[]): void {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const base = row.slug || slugify(row.participantId);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    row.slug = count === 0 ? base : `${base}-${row.participantId.toLowerCase()}`;
  }
}

export async function parseExcelWorkbook(input: Buffer, filename: string): Promise<ParsedWorkbook & ExcelImportPreview> {
  const workbook = XLSX.read(input, { type: "buffer", cellDates: true, bookFiles: true });
  const tableMap = loadTableMap(workbook);

  const participantRows = rowsByTable(workbook, tableMap, "tbl_participantes");
  const teamRows = rowsByTable(workbook, tableMap, "tbl_teams");
  const matchRows = rowsByTable(workbook, tableMap, "tbl_matches");
  const betMatchRows = rowsByTable(workbook, tableMap, "tbl_bets_matches");
  const groupBetRows = rowsByTable(workbook, tableMap, "tbl_bets_group_positions");
  const bonusBetRows = rowsByTable(workbook, tableMap, "tbl_bets_bonus");
  const classificationRows = rowsByTable(workbook, tableMap, "tbl_clasificacion_general");

  const warnings = [
    ...requiredMissing(participantRows, ["Participant_ID", "Alias"]),
    ...requiredMissing(teamRows, ["Team_ID", "Seleccion"]),
    ...requiredMissing(matchRows, ["Match_ID"]),
    ...duplicateWarnings(participantRows, "Alias"),
    ...duplicateWarnings(participantRows, "Participant_ID")
  ];
  const errors: string[] = [];
  const teamIds = new Set(teamRows.map((row) => text(row.Team_ID)).filter(Boolean));

  const participants = participantRows
    .map((row) => ({
      participantId: text(row.Participant_ID) ?? "",
      timestamp: date(row.Timestamp),
      email: text(row.Email),
      fullName: text(row.Nombre),
      alias: text(row.Alias) ?? "",
      departamento: text(row.Departamento),
      rango: text(row.Rango),
      estado: text(row.Estado),
      pagado: text(row.Pagado),
      source: text(row.Source),
      pay: text(row.PAY),
      templateSent: text(row["ENVIADO PLANTILLA"]),
      resultReceived: text(row["Resultado recibido"]),
      slug: slugify(text(row.Alias) ?? text(row.Participant_ID) ?? "")
    }))
    .filter((row) => row.participantId || row.alias)
    .map((row, index) => {
      if (row.participantId && !row.alias) {
        warnings.push(`Participant row ${index + 1}: missing Alias in tbl_participantes; classification alias will be used if available`);
        return row;
      }
      const parsed = participantSchema.safeParse(row);
      if (!parsed.success) errors.push(`Participant row ${index + 1}: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
      return row;
    })
    .filter((row) => row.participantId && row.alias);

  const teams = teamRows
    .map((row) => ({
      teamId: text(row.Team_ID) ?? "",
      pais: text(row.Pais),
      seleccion: text(row.Seleccion) ?? "",
      grupo: text(row.Grupo),
      ordenGrupo: number(row.Orden_Grupo),
      confederacion: text(row.Confederacion),
      tieBreakerRank: number(row.TieBreaker_Rank),
      fifaRank: number(row.FIFA_Rank),
      comentarios: text(row.Comentarios),
      flag: text(row.Flag)
    }))
    .map((row, index) => {
      const parsed = teamSchema.safeParse(row);
      if (!parsed.success) warnings.push(`Team row ${index + 1}: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
      return row;
    })
    .filter((row) => row.teamId && row.seleccion);

  const matches = matchRows
    .map((row) => {
      const homeTeamId = text(row.Home_Team_ID);
      const awayTeamId = text(row.Away_Team_ID);
      if (homeTeamId && !teamIds.has(homeTeamId)) warnings.push(`Unknown home team ${homeTeamId} in match ${text(row.Match_ID)}`);
      if (awayTeamId && !teamIds.has(awayTeamId)) warnings.push(`Unknown away team ${awayTeamId} in match ${text(row.Match_ID)}`);
      return {
        matchId: text(row.Match_ID) ?? "",
        matchNo: number(row.Match_No),
        fecha: date(row.Fecha),
        hora: text(row.Hora),
        jornadaId: text(row.Jornada_ID),
        fase: text(row.Fase),
        grupo: text(row.Grupo),
        homeSlot: text(row.Home_Slot),
        awaySlot: text(row.Away_Slot),
        homeTeamIdManual: text(row.Home_Team_ID_Manual),
        awayTeamIdManual: text(row.Away_Team_ID_Manual),
        homeTeamId,
        awayTeamId,
        homeTeam: text(row.Home_Team),
        awayTeam: text(row.Away_Team),
        homeGoals: number(row.Home_Goals),
        awayGoals: number(row.Away_Goals),
        homePens: number(row.Home_Pens),
        awayPens: number(row.Away_Pens),
        finished: bool(row.Finished),
        resultText: text(row.Result_Text),
        realSign: text(row.Signo_Real),
        goalDiff: number(row.Goal_Diff),
        winnerTeamId: text(row.Winner_Team_ID),
        qualifiedTeamId: text(row.Qualified_Team_ID),
        overrideQualifiedTeamId: text(row.Override_Qualified_Team_ID),
        needsPens: bool(row.Needs_Pens),
        statusCheck: text(row.Status_Check),
        bettingDeadline: date(row.Deadline_Apuestas),
        notas: text(row.Notas)
      };
    })
    .map((row, index) => {
      const parsed = matchSchema.safeParse(row);
      if (!parsed.success) warnings.push(`Match row ${index + 1}: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
      return row;
    })
    .filter((row) => row.matchId);

  const classifications = classificationRows
    .map((row) => ({
      pos: number(row.Pos) ?? 0,
      participantId: text(row.Participant_ID) ?? "",
      alias: text(row.Alias) ?? "",
      departamento: text(row.Departamento),
      rango: text(row.Rango),
      pointsMatches: number(row.Points_Matches) ?? 0,
      pointsGroups: number(row.Points_Groups) ?? 0,
      pointsEliminatorias: number(row.Points_Eliminatorias) ?? 0,
      pointsBonus: number(row.Points_Bonus) ?? 0,
      pointsTotal: number(row.Points_Total) ?? 0,
      exactScores: number(row.Exact_Scores) ?? 0,
      correctDiff: number(row.Correct_Diff) ?? 0,
      correctSigns: number(row.Correct_Signs) ?? 0,
      correctGroupQualified: number(row.Correct_Group_Qualified) ?? 0,
      correctGroupPositions: number(row.Correct_Group_Positions) ?? 0,
      correctCruces: number(row.Correct_Cruces) ?? 0,
      pointsTotalFecha: number(row.Points_Total_Fecha) ?? 0,
      posFecha: number(row.Pos_Fecha),
      deltaPos: number(row.Delta_Pos) ?? 0,
      deltaPoints: number(row.Delta_Points) ?? 0
    }))
    .filter((row) => row.participantId && row.alias && row.pos > 0)
    .map((row, index) => {
      const parsed = classificationSchema.safeParse(row);
      if (!parsed.success) warnings.push(`Classification row ${index + 1}: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
      return row;
    });

  const horaByMatchId = matchHoraDisplayMap(workbook);
  for (const match of matches) {
    match.hora = normalizeHora(horaByMatchId.get(match.matchId) ?? match.hora);
  }

  const participantIdsParsed = new Set(participants.map((participant) => participant.participantId));
  for (const classification of classifications) {
    if (!participantIdsParsed.has(classification.participantId)) {
      participants.push({
        participantId: classification.participantId,
        timestamp: null,
        email: null,
        fullName: null,
        alias: classification.alias,
        departamento: classification.departamento,
        rango: classification.rango,
        estado: "SUPPLEMENTAL_FROM_CLASSIFICATION",
        pagado: null,
        source: "tbl_clasificacion_general",
        pay: null,
        templateSent: null,
        resultReceived: null,
        slug: slugify(classification.alias)
      });
      participantIdsParsed.add(classification.participantId);
    }
  }

  const finalAliasWarnings = duplicateWarnings(
    participants.map((participant) => ({ Alias: participant.alias })),
    "Alias"
  ).map((warning) => `${warning}; public profile slug is disambiguated`);
  warnings.push(...finalAliasWarnings);
  ensureUniqueSlugs(participants);

  for (const row of betMatchRows) {
    if (number(row.Pred_Home_Goals) == null || number(row.Pred_Away_Goals) == null) {
      warnings.push(`Incomplete match bet for participant ${text(row.Participant_ID) ?? "unknown"} match ${text(row.Match_ID) ?? "unknown"}`);
    }
  }

  return {
    filename,
    dryRun: true,
    participants,
    teams,
    matches,
    betMatches: betMatchRows,
    groupBets: groupBetRows,
    bonusBets: bonusBetRows,
    classifications,
    counts: {
      participants: participants.length,
      teams: teams.length,
      matches: matches.length,
      betMatches: betMatchRows.length,
      groupBets: groupBetRows.length,
      bonusBets: bonusBetRows.length,
      classifications: classifications.length
    },
    warnings,
    errors,
    sampleParticipants: participants.slice(0, 5).map(({ participantId, alias, departamento, rango, slug }) => ({
      participantId,
      alias,
      departamento,
      rango,
      slug
    }))
  };
}

export async function importExcelWorkbook(input: Buffer, filename: string, dryRun: boolean): Promise<ExcelImportPreview> {
  const parsed = await parseExcelWorkbook(input, filename);
  if (dryRun || parsed.errors.length > 0) {
    return toPreview(parsed, dryRun);
  }

  const run = await prisma.importRun.create({
    data: {
      filename,
      status: "PENDING",
      dryRun,
      rowsRead: Object.values(parsed.counts).reduce((sum, value) => sum + value, 0),
      warnings: parsed.warnings,
      errors: parsed.errors
    }
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.scoringMatch.deleteMany();
      await tx.scoringGroup.deleteMany();
      await tx.scoringBonus.deleteMany();
      await tx.generalRanking.deleteMany();
      await tx.betMatch.deleteMany();
      await tx.betGroupPosition.deleteMany();
      await tx.betBonus.deleteMany();
      // Free up every slug behind a temporary placeholder first, since the new
      // slugs can be reassigned between participants (e.g. alias corrections)
      // and `slug` is unique — upserting in array order could otherwise collide
      // with another participant's not-yet-updated current slug.
      for (const participant of parsed.participants) {
        await tx.participant.updateMany({
          where: { participantId: participant.participantId },
          data: { slug: `__import_${participant.participantId}` }
        });
      }
      for (const participant of parsed.participants) {
        const { participantId, ...participantData } = participant;
        await tx.participant.upsert({
          where: { participantId },
          update: participantData,
          create: participant
        });
      }
      for (const team of parsed.teams) {
        const { teamId, ...teamData } = team;
        await tx.team.upsert({
          where: { teamId },
          update: teamData,
          create: team
        });
      }
      for (const match of parsed.matches) {
        const matchData = {
          matchNo: match.matchNo,
          fecha: match.fecha,
          hora: match.hora,
          jornadaId: match.jornadaId,
          fase: match.fase,
          grupo: match.grupo,
          homeSlot: match.homeSlot,
          awaySlot: match.awaySlot,
          homeTeamIdManual: match.homeTeamIdManual,
          awayTeamIdManual: match.awayTeamIdManual,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          needsPens: match.needsPens,
          statusCheck: match.statusCheck,
          bettingDeadline: match.bettingDeadline,
          notas: match.notas
        };
        await tx.match.upsert({
          where: { matchId: match.matchId },
          update: matchData,
          create: match
        });
      }
      const participantIds = new Set(parsed.participants.map((participant) => participant.participantId));
      const matchIds = new Set(parsed.matches.map((match) => match.matchId));
      const betMatches = parsed.betMatches
        .map((row) => ({
          sourceName: text(row["Source.Name"]),
          email: text(row.Email),
          matchId: text(row.Match_ID) ?? "",
          predHomeTeamId: text(row.Pred_Home_Team_ID),
          predAwayTeamId: text(row.Pred_Away_Team_ID),
          predHomeGoals: number(row.Pred_Home_Goals),
          predAwayGoals: number(row.Pred_Away_Goals),
          predQualifiedTeamId: text(row.Pred_Qualified_Team_ID),
          betId: text(row["Bet.ID"]),
          participantId: text(row.Participant_ID) ?? "",
          fase: text(row.FASE),
          predSign: text(row.Pred_Sign),
          predGoalDiff: number(row.Pred_Goal_Diff)
        }))
        .filter((row) => participantIds.has(row.participantId) && matchIds.has(row.matchId));
      const groupBets = parsed.groupBets
        .map((row) => ({
          sourceName: text(row["Source.Name"]),
          email: text(row.Email),
          grupo: text(row.Grupo) ?? "",
          predPos: number(row.Pred_Pos) ?? 0,
          predTeamId: text(row.Pred_Team_ID),
          groupBetId: text(row.Group_Bet_ID),
          participantId: text(row.Participant_ID) ?? "",
          valid: bool(row.Valid)
        }))
        .filter((row) => row.grupo && row.predPos > 0 && participantIds.has(row.participantId));
      const bonusBets = parsed.bonusBets
        .map((row) => ({
          participantId: text(row.Participant_ID) ?? "",
          alias: text(row.Alias),
          email: text(row.Email),
          timestamp: date(row.Timestamp),
          campeon: text(row.Campeon),
          subcampeon: text(row.Subcampeon),
          semifinalista1: text(row.Semifinalista_1),
          semifinalista2: text(row.Semifinalista_2),
          semifinalista3: text(row.Semifinalista_3),
          semifinalista4: text(row.Semifinalista_4),
          maximoGoleador: text(row.Maximo_Goleador),
          seleccionMasGoleadora: text(row.Seleccion_Mas_Goleadora),
          seleccionMasGoleada: text(row.Seleccion_Mas_Goleada),
          seleccionMenosGoleadora: text(row.Seleccion_Menos_Goleadora),
          seleccionMenosGoleada: text(row.Seleccion_Menos_Goleada),
          equipoRevelacion: text(row.Equipo_Revelacion),
          equipoDecepcion: text(row.Equipo_Decepcion),
          totalGolesTorneo: number(row.Total_Goles_Torneo),
          valid: bool(row.Valid),
          source: text(row.Source)
        }))
        .filter((row) => participantIds.has(row.participantId));
      if (betMatches.length > 0) await tx.betMatch.createMany({ data: betMatches, skipDuplicates: true });
      if (groupBets.length > 0) await tx.betGroupPosition.createMany({ data: groupBets, skipDuplicates: true });
      if (bonusBets.length > 0) await tx.betBonus.createMany({ data: bonusBets, skipDuplicates: true });
      if (parsed.classifications.length > 0) {
        await tx.generalRanking.createMany({ data: parsed.classifications, skipDuplicates: true });
        await tx.rankingSnapshot.updateMany({ where: { isLatest: true }, data: { isLatest: false } });
        const snapshot = await tx.rankingSnapshot.create({
          data: {
            label: "Importacion inicial",
            source: "excel",
            isLatest: true,
            eventLabel: "Importacion inicial"
          }
        });
        const snapshotRows = parsed.classifications.map((row) => ({
          snapshotId: snapshot.id,
          participantId: row.participantId,
          alias: row.alias,
          departamento: row.departamento,
          rango: row.rango,
          pos: row.pos,
          previousPos: row.posFecha,
          deltaPos: row.deltaPos,
          deltaPoints: row.deltaPoints,
          pointsMatches: row.pointsMatches,
          pointsGroups: row.pointsGroups,
          pointsEliminatorias: row.pointsEliminatorias,
          pointsBonus: row.pointsBonus,
          pointsTotal: row.pointsTotal,
          pointsGainedThisRun: row.pointsTotal - row.pointsTotalFecha,
          eventLabel: "Importacion inicial"
        }));
        await tx.rankingSnapshotRow.createMany({ data: snapshotRows });
        await tx.participantScoreSnapshot.createMany({ data: snapshotRows });
      }
      await tx.importRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCESS",
          finishedAt: new Date(),
          rowsImported:
            parsed.participants.length +
            parsed.teams.length +
            parsed.matches.length +
            betMatches.length +
            groupBets.length +
            bonusBets.length +
            parsed.classifications.length
        }
      });
    }, { maxWait: 15000, timeout: 60000 });
  } catch (error) {
    await prisma.importRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errors: [...parsed.errors, error instanceof Error ? error.message : String(error)]
      }
    });
    throw error;
  }

  return toPreview(parsed, false);
}
