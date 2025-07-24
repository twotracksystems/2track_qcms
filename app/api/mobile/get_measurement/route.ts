import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id=req.nextUrl.searchParams.get("id")
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tbl_measurement")
    .select("*")
    .eq("is_exist", true)
    .eq("id",id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: data, error: error }, { status: 200 });
}
