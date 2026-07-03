"use client";

import { useFormStatus } from "react-dom";
import { forceRecalculateAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="secondary" disabled={pending} aria-busy={pending}>
      {pending ? "Recalculando..." : "Forzar recalculo de clasificacion"}
    </Button>
  );
}

function ProgressBar() {
  const { pending } = useFormStatus();
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
      <div className={`h-full rounded-full bg-air-gold transition-all ${pending ? "w-1/2 animate-pulse" : "w-0"}`} />
    </div>
  );
}

export function RecalculateForm() {
  return (
    <form action={forceRecalculateAction} className="grid gap-3">
      <div className="flex items-center gap-4">
        <SubmitButton />
      </div>
      <ProgressBar />
    </form>
  );
}
