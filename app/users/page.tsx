import { createAdminClient } from "@/lib/supabase";
import { getUsersList, getAcquisitionBreakdown } from "@/lib/queries/users";
import { AcquisitionPanel } from "@/components/users/acquisition-panel";
import { UsersTable } from "@/components/users/users-table";
import { Header } from "@/components/layout/header";

export const revalidate = 60;

export default async function UsersPage() {
  const supabase = createAdminClient();
  const [{ users, total }, acquisition] = await Promise.all([
    getUsersList(supabase, { page: 0, pageSize: 50 }),
    getAcquisitionBreakdown(supabase),
  ]);

  return (
    <>
      <Header title="Users" />
      <div className="flex-1 overflow-auto">
        <AcquisitionPanel data={acquisition} />
        <UsersTable initialUsers={users} initialTotal={total} />
      </div>
    </>
  );
}
