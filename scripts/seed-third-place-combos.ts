import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

type TableInfo = { sheetName: string; ref: string };
type ThirdComboCreate = {
  option: number;
  qualifiedKey: string;
  opp1A: string | null;
  opp1B: string | null;
  opp1D: string | null;
  opp1E: string | null;
  opp1G: string | null;
  opp1I: string | null;
  opp1K: string | null;
  opp1L: string | null;
};
type ThirdComboDelegate = {
  deleteMany: () => Promise<unknown>;
  createMany: (args: { data: ThirdComboCreate[] }) => Promise<unknown>;
};

function text(value: unknown): string | null {
  if (value == null) return null;
  const result = String(value).trim();
  return result || null;
}

function number(value: unknown): number | null {
  const parsed = Number(text(value));
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : null;
}

function fileText(workbook: XLSX.WorkBook, path: string): string | null {
  const file = (workbook as unknown as { files?: Record<string, { content?: Buffer | string }> }).files?.[path];
  if (!file?.content) return null;
  return Buffer.isBuffer(file.content) ? file.content.toString("utf-8") : String(file.content);
}

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
  if (!info) throw new Error(`No se encuentra la tabla ${tableName}`);
  const sheet = workbook.Sheets[info.sheetName];
  if (!sheet) throw new Error(`No se encuentra la hoja ${info.sheetName}`);
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null, range: info.ref });
  const headers = matrix[0].map((value) => text(value) ?? "");
  return matrix.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

async function main() {
  const workbookPath = process.argv[2] ?? "data/input/Porra_mundial2026.xlsx";
  const workbook = XLSX.readFile(workbookPath, { cellDates: true, bookFiles: true });
  const rows = rowsByTable(workbook, loadTableMap(workbook), "tbl_third_combo_mapping")
    .map((row) => ({
      option: number(row.Option) ?? 0,
      qualifiedKey: text(row.Qualified_Key) ?? "",
      opp1A: text(row.Opp_1A),
      opp1B: text(row.Opp_1B),
      opp1D: text(row.Opp_1D),
      opp1E: text(row.Opp_1E),
      opp1G: text(row.Opp_1G),
      opp1I: text(row.Opp_1I),
      opp1K: text(row.Opp_1K),
      opp1L: text(row.Opp_1L)
    }))
    .filter((row) => row.option > 0 && row.qualifiedKey);

  if (rows.length !== 495) throw new Error(`La tabla de terceros debe tener 495 combinaciones; tiene ${rows.length}`);

  await prisma.$transaction(async (tx) => {
    const delegate = (tx as unknown as { thirdPlaceComboMapping: ThirdComboDelegate }).thirdPlaceComboMapping;
    await delegate.deleteMany();
    await delegate.createMany({ data: rows });
  });

  await prisma.adminLog.create({
    data: {
      action: "THIRD_COMBOS_SEEDED",
      message: `Tabla de mejores terceros sincronizada: ${rows.length} combinaciones.`
    }
  });
  await prisma.$disconnect();
}

main().catch(async (error) => {
  await prisma.$disconnect();
  console.error(error);
  process.exit(1);
});
