import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = await createClient();

  const { data: sessionData, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const userId = sessionData.user.id;
  const userEmail = sessionData.user.email;
  const metadata = sessionData.user.user_metadata;

  // Check if a tbl_users row already exists for this user
  const { data: existingUser } = await supabase
    .from("tbl_users")
    .select("uuid")
    .eq("uuid", userId)
    .single();

  if (!existingUser) {
    // Create a tbl_users row for new Google sign-in users with Viewer role
    await supabase.from("tbl_users").insert([
      {
        uuid: userId,
        email: userEmail,
        first_name: metadata?.full_name?.split(" ")[0] || metadata?.name || "",
        last_name: metadata?.full_name?.split(" ").slice(1).join(" ") || "",
        role: "Viewer",
        is_exist: true,
        is_verified: true,
      },
    ]);
  }

  return NextResponse.redirect(
    new URL("/dashboard/order_management", requestUrl.origin)
  );
}
