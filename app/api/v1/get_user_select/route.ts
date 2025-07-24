import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get("page") || "0";
  const limit = req.nextUrl.searchParams.get("limit") || "10";
  const search = req.nextUrl.searchParams.get("search");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tbl_users")
    .select("*")
    .eq("is_exist", true)

    .range(
      (parseInt(page) - 1) * parseInt(limit),
      parseInt(page) * parseInt(limit) - 1
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json(data, {
      status: 200,
    });
  }
}
