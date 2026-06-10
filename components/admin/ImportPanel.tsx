"use client";

import { useActionState } from "react";
import { excelImportAction, type ImportActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ImportActionState = {};

export function ImportPanel() {
  const [state, action, pending] = useActionState(excelImportAction, initialState);
  return (
    <Card>
      <CardHeader><CardTitle>Subir Excel oficial</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="grid gap-3">
          <input className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" name="file" type="file" accept=".xlsx" required />
          <div className="flex gap-2">
            <Button name="intent" value="preview" variant="secondary" disabled={pending}>Preview</Button>
            <Button name="intent" value="import" disabled={pending}>Importar</Button>
          </div>
        </form>
        {state.error ? <p className="mt-3 rounded-md border border-air-down bg-[var(--color-danger)]/20 p-3 text-sm text-air-down">{state.error}</p> : null}
        {state.preview ? (
          <div className="mt-4 grid gap-3">
            <p className="text-sm font-semibold">{state.preview.dryRun ? "Preview sin persistir" : "Import completado"}</p>
            <pre className="max-h-72 overflow-auto rounded-md bg-[var(--bg-input)] p-3 text-xs text-[var(--text-primary)] font-mono">{JSON.stringify(state.preview.counts, null, 2)}</pre>
            {state.preview.warnings.length ? <pre className="max-h-48 overflow-auto rounded-md border border-air-gold bg-[var(--color-warning)]/20 p-3 text-xs text-air-gold font-mono">{state.preview.warnings.join("\n")}</pre> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
