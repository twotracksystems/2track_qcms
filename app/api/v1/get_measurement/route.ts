import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const page = req.nextUrl.searchParams.get("page") || "1"; // Default to 1
  const limit = req.nextUrl.searchParams.get("limit") || "10";
  const search = req.nextUrl.searchParams.get("search");

  const supabase = await createClient();

  let query = supabase.from("tbl_measurement").select("*").eq("is_exist", true).eq("order_form_id", id);

  if (search) {
    query = query.ilike("column_name", `%${search}%`); // Replace "column_name" with your actual column
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(
      (parseInt(page) - 1) * parseInt(limit),
      parseInt(page) * parseInt(limit) - 1
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
