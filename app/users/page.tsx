import { createAdminClient } from "@/lib/supabase";
import { getUsersList } from "@/lib/queries/users";
import { UsersTable } from "@/components/users/users-table";
import { Header } from "@/components/layout/header";

export const revalidate = 60;

export default async function UsersPage() {
  const supabase = createAdminClient();
  const { users, total } = await getUsersList(supabase, { page: 0, pageSize: 50 });

  return (
    <>
      <Header title="Users" />
      <div className="flex-1 overflow-auto">
        <UsersTable initialUsers={users} initialTotal={total} />
      </div>
    </>
  );
}
