import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");
  const rawSearch = req.nextUrl.searchParams.get("search") || "";
  const search = rawSearch.trim();

  const supabase = await createClient();

  // Query the data with total count
  let query = supabase
    .from("tbl_article_prod")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    const isNumericSearch = /^\d+$/.test(search);
    const orFilters = [
      "designation_article.ilike." + `%${search}%`,
      "article_name.ilike." + `%${search}%`,
      "quality.ilike." + `%${search}%`,
    ];

    if (isNumericSearch) {
      orFilters.unshift(`article.eq.${Number(search)}`);
    }

    query = query.or(orFilters.join(","));
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total_count: count || 0 }, { status: 200 });
}




