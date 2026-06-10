import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition",
        variant === "primary" && "bg-primary text-white hover:bg-blue-900",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
        variant === "danger" && "bg-air-down text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}
