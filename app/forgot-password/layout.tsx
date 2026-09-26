import { redirect } from "next/navigation";

import { createClient } from "@/components/lib/supabase/server";

export default async function ForgotPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return children;
}
