import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
  const search = req.nextUrl.searchParams.get("search") || "";

  const supabase = await createClient();


  // Query the data with total count
  const { data, error,count } = await supabase
    .from("tbl_users")
    .select("*",{ count: "exact" })
    .eq("is_exist", true)
    .or(
      `email.ilike.%${search}%,first_name.ilike.%${search}%,middle_name.ilike.%${search}%,last_name.ilike.%${search}%`
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);


  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total_count: count || 0 }, { status: 200 });
}
