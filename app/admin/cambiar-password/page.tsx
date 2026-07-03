import { changePasswordAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminChangePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin({ roles: ["AUDITOR"], allowPasswordChange: true });
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-air-page p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cambiar password</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={changePasswordAction} className="grid gap-3">
            <label className="grid gap-1 text-sm font-medium">
              Nuevo password
              <input className="h-10 rounded-md border border-slate-200 px-3" name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Confirmar password
              <input className="h-10 rounded-md border border-slate-200 px-3" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            {params.error ? <p className="text-sm text-air-down">El password debe coincidir y tener al menos 8 caracteres.</p> : null}
            <Button>Guardar password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
