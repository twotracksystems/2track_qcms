import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Autocomplete endpoint for ID Article dropdown.
 * Fetches from tbl_article_prod (id, article). Optional search filters by article
 * (exact if numeric) or designation_article (ilike). Single query, small limit — fast and scalable.
 */
export async function GET(req: NextRequest) {
  const rawSearch = req.nextUrl.searchParams.get("search") || "";
  const search = rawSearch.trim();
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    MAX_LIMIT
  );

  const supabase = await createClient();

  let query = supabase
    .from("tbl_article_prod")
    .select("id, article")
    .order("id", { ascending: true })
    .limit(limit);

  if (search) {
    const isNumeric = /^\d+$/.test(search);
    if (isNumeric) {
      query = query.eq("article", Number(search));
    } else {
      query = query.ilike("designation_article", `%${search}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const options = (data || []).map((row: { id: number; article: string | number }) => ({
    id: row.id,
    article: row.article,
  }));

  return NextResponse.json({ data: options, total_count: options.length }, { status: 200 });
}
