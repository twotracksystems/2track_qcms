import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = req.nextUrl.searchParams.get("page") || "0";
  const limit = req.nextUrl.searchParams.get("limit") || "10";
  const search = req.nextUrl.searchParams.get("search");
  console.log(search);
  console.log(page);
  console.log(limit);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tbl_article_min")
    .select("*")
    .eq("is_exist", true)
    
    .order("created_at", { ascending: false })
    .range(
      (parseInt(page) - 1) * parseInt(limit),
      parseInt(page) * parseInt(limit) - 1
    );

  console.log(data, error);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json(data, {
      status: 200,
    });
  }
}
