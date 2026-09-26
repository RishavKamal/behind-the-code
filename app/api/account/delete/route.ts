import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { createClient as createServerClient } from "@/components/lib/supabase/server";

export async function DELETE() {
  try {
    /*
     * Verify the request belongs to an authenticated user.
     * The server client reads the user's Supabase session from cookies.
     */
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to delete your account." },
        { status: 401 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Account deletion is missing Supabase server credentials.");

      return NextResponse.json(
        { error: "Account deletion is not configured on the server." },
        { status: 500 },
      );
    }

    /*
     * This client is server-only and uses the service-role key.
     * Never expose this key to browser code.
     */
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

    /*
     * Supabase Auth refuses to delete a user who still owns Storage objects.
     * Our avatar structure is:
     *
     * avatars/<user-id>/avatar
     *
     * List everything directly inside the user's folder and remove it
     * through the Storage API before deleting the Auth user.
     */
    const { data: objects, error: listError } = await admin.storage
      .from("avatars")
      .list(user.id, {
        limit: 1000,
      });

    if (listError) {
      console.error("Account deletion - avatar listing failed:", listError);

      return NextResponse.json(
        { error: "Could not prepare your profile files for deletion." },
        { status: 500 },
      );
    }

    const filePaths = (objects ?? [])
      .filter((object) => object.name)
      .map((object) => `${user.id}/${object.name}`);

    if (filePaths.length > 0) {
      const { error: removeError } = await admin.storage
        .from("avatars")
        .remove(filePaths);

      if (removeError) {
        console.error(
          "Account deletion - avatar removal failed:",
          removeError,
        );

        return NextResponse.json(
          { error: "Could not remove your profile files. Your account was not deleted." },
          { status: 500 },
        );
      }
    }

    /*
     * The database is configured with:
     *
     * auth.users
     *   -> profiles ON DELETE CASCADE
     *   -> articles through profiles ON DELETE CASCADE
     *
     * Therefore deleting the Auth user removes the application data too.
     */
    const { error: deleteError } = await admin.auth.admin.deleteUser(
      user.id,
      false,
    );

    if (deleteError) {
      console.error("Account deletion - Auth deletion failed:", deleteError);

      return NextResponse.json(
        {
          error:
            "Your profile files were removed, but the account could not be deleted. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected account deletion error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while deleting your account." },
      { status: 500 },
    );
  }
}
