import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import {
  createClient as createServerClient,
} from "@/components/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const identifier =
      typeof body.identifier === "string"
        ? body.identifier.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!identifier || !password) {
      return NextResponse.json(
        {
          error: "Username/email and password are required.",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: "Authentication is not configured correctly.",
        },
        {
          status: 500,
        },
      );
    }

    let email = identifier;

    /*
     * If the user entered a username,
     * find the corresponding profile.
     */
    if (!identifier.includes("@")) {
      const admin = createAdminClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

      const {
        data: profile,
        error: profileError,
      } = await admin
        .from("profiles")
        .select("id")
        .ilike("username", identifier)
        .maybeSingle();

      if (profileError || !profile) {
        return NextResponse.json(
          {
            error: "Invalid username/email or password.",
          },
          {
            status: 401,
          },
        );
      }

      /*
       * profiles.id must correspond to the
       * Supabase Auth user's id.
       */
      const {
        data: userData,
        error: userError,
      } = await admin.auth.admin.getUserById(profile.id);

      if (userError || !userData.user?.email) {
        return NextResponse.json(
          {
            error: "Invalid username/email or password.",
          },
          {
            status: 401,
          },
        );
      }

      email = userData.user.email;
    }

    /*
     * Authenticate using the normal server-side
     * Supabase client.
     */
    const supabase = await createServerClient();

    const {
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        {
          error: "Invalid username/email or password.",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}