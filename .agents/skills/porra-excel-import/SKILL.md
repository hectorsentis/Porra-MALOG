---
name: porra-excel-import
description: Use this skill when implementing or modifying Excel import, Excel validation, xlsx/ExcelJS parsing, upload preview, ImportRun logs, or automatic import scripts for the PORRA MALOG web app.
---

# PORRA Excel Import Skill

Use this skill for all Excel ingestion work.

## Goal

The Excel official file is the operational source of truth for initial data and manual uploads.

The app must support:

1. Manual admin upload.
2. CLI import.
3. Optional GitHub Actions import.
4. Safe validation.
5. No duplicate data.
6. Import logs.
7. Rollback.

## Required files

Expected implementation files:

- lib/import/excelReader.ts
- lib/import/validators.ts
- lib/import/importRunner.ts
- lib/import/normalizers.ts
- lib/import/preview.ts
- scripts/import-excel.ts
- app/admin/import/page.tsx
- components/import/ImportUploader.tsx
- components/import/ImportPreview.tsx

## Commands

Create or maintain:

```bash
npm run import:excel
npm run import:excel:dry-run