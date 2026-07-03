import { AdminShell } from "@/components/admin/AdminShell";
import { ImportPanel } from "@/components/admin/ImportPanel";
import { requireAdminForPath } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  await requireAdminForPath("/admin/import");
  return (
    <AdminShell>
      <ImportPanel />
    </AdminShell>
  );
}
