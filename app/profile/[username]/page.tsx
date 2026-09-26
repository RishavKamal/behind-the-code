import { notFound } from "next/navigation";

import { createClient } from "@/components/lib/supabase/server";
import PublicProfileClient from "./profile-client";

type PublicProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const profileUsername = decodeURIComponent(username ?? "")
    .trim()
    .toLowerCase();

  if (!profileUsername) {
    notFound();
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", profileUsername)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!profile) {
    notFound();
  }

  return <PublicProfileClient username={profileUsername} />;
}
