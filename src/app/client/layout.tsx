import { redirect } from "next/navigation";

import { ClientHeader } from "@/components/client-portal/client-header";
import { createClient } from "@/lib/supabase/server";
import { listMyNotifications } from "@/lib/notifications/queries";

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { notifications }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
    listMyNotifications(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ClientHeader
        user={{
          fullName: profile?.full_name ?? null,
          email: user.email ?? "",
          avatarUrl: profile?.avatar_url ?? null,
        }}
        notifications={notifications}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
