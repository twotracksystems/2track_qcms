
import { createClient, roleExtractor } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const uuid = req.nextUrl.searchParams.get("uuid");
    if (!uuid || !/^[0-9a-fA-F-]{36}$/.test(uuid)) {
      return NextResponse.json({ error: "Invalid or missing UUID" }, { status: 400 });
    }

    const { is_exist } = await req.json();
    if (is_exist === undefined) {
      return NextResponse.json({ error: "Missing 'is_exist' field" }, { status: 400 });
    }

    const supabase = await createClient();
    const current_role = await roleExtractor(supabase);

    if (current_role !== "Super Admin") {
      return NextResponse.json({ error: "No permission to perform this action" }, { status: 401 });
    }

    const { data: user, error: userError } = await supabase
      .from("tbl_users")
      .select("*")
      .eq("uuid", uuid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("tbl_users")
      .update({ is_exist, updated_at: new Date() })
      .eq("uuid", uuid);

    if (updateError) {
      return NextResponse.json({ error: `Update failed: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: "User removed successfully" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Unexpected error", details: err.message }, { status: 500 });
  }
}
