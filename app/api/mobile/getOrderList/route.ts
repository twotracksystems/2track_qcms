import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  const supabase = await createClient();
  // let totalDataBasedOnQuery = 0;

  // Base query
  const { data, error, count } = await supabase
    .from("tbl_orders_form")
    .select(
      "* ,tbl_customer(company_name),tbl_article(id,user_id,is_exist,article_max,article_min,article_name,number_control,article_nominal)",
      { count: "exact" }
    )
    .eq("order_fabrication_control", search)
    .eq("is_exist", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json(
      { data, total_count: count || 0 },
      { status: 200 }
    );
  }
}
