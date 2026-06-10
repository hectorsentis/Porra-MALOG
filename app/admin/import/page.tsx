import { AdminShell } from "@/components/admin/AdminShell";
import { ImportPanel } from "@/components/admin/ImportPanel";
import { requireAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <ImportPanel />
    </AdminShell>
  );
}
