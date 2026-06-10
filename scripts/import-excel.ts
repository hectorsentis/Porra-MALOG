import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { importExcelWorkbook } from "@/lib/import/excel";

async function existingPath(candidates: string[]) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  return candidates[0];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const fileArg = process.argv.find((arg) => arg.endsWith(".xlsx"));
  const path = resolve(
    fileArg ??
      (await existingPath([
        "data/input/Porra_mundial2026.xlsx",
        "data/input/Porra_mundial2026_test.xlsx"
      ]))
  );
  if (!fileArg && path.endsWith("Porra_mundial2026_test.xlsx")) {
    console.warn("Aviso: no se encontro data/input/Porra_mundial2026.xlsx; se usa Porra_mundial2026_test.xlsx.");
  }
  const buffer = await readFile(path);
  const result = await importExcelWorkbook(buffer, path, dryRun);

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
