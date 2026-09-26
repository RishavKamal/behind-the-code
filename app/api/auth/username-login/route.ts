import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = body.username?.trim().toLowerCase();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required." },
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
      console.error("Username lookup error:", error);

      return NextResponse.json(
        { error: "Unable to process login." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(data.id);

    if (userError || !userData.user?.email) {
      return NextResponse.json(
        { error: "Unable to process login." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      email: userData.user.email,
    });
  } catch (error) {
    console.error("Username login error:", error);

    return NextResponse.json(
      { error: "Unable to process login." },
      { status: 500 },
    );
  }
}