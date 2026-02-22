import { createClient } from "@/utils/supabase/admin";
import { roleExtractor, requireNotViewer } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, first_name, last_name, role } = await req.json();

  const supabase = await createClient();
  const viewerCheck = await requireNotViewer(supabase);
  if (!viewerCheck.allowed) {
    return NextResponse.json(
      { error: "Viewers cannot modify data." },
      { status: 403 }
    );
  }
  const current_role = await roleExtractor(supabase);

  if (current_role !== "Super Admin") {
    return NextResponse.json(
      { error: "No permission to perform this action." },
      { status: 401 }
    );
  }

  //const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const siteUrl = "http://localhost:3000";

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/signup`,
    data: {
      first_name,
      last_name,
      role,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const insertResult = await supabase.from("tbl_users").insert([
    {
      uuid: data.user?.id,
      email: email,
      first_name: first_name,
      last_name: last_name,
      role: role,
      is_exist: true,
      is_verified: false,
    },
  ]);

  if (insertResult.error) {
    return NextResponse.json(
      { error: insertResult.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
