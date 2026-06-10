import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { importExcelWorkbook } from "@/lib/import/excel";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const fileArg = process.argv.find((arg) => arg.endsWith(".xlsx"));
  const path = resolve(fileArg ?? "data/input/Porra_mundial2026.xlsx");
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
