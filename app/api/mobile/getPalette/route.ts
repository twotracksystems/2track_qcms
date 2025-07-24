import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tbl_orders_form")
    .select("*,tbl_customer(*),tbl_article(*),tbl_assignee_history(*)")
    .eq("is_exist", true).order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: data, error: error }, { status: 200 });
}