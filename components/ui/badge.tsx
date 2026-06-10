import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md border border-slate-200 bg-air-page px-2 py-1 text-xs font-medium", className)}
      {...props}
    />
  );
}
