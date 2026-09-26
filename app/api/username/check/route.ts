import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const username =
    searchParams.get("username")?.trim().toLowerCase() ?? "";

  if (!username) {
    return NextResponse.json(
      { available: false },
      { status: 400 },
    );
  }

  if (
    !/^[a-z0-9_]+$/.test(username) ||
    username.length < 3 ||
    username.length > 30
  ) {
    return NextResponse.json(
      { available: false },
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error(
      "Username availability check error:",
      error,
    );

    return NextResponse.json(
      { available: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    available: !data,
  });
}