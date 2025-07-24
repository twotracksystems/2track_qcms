import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10) - 1; // Convert to zero-based index
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);
  const search = req.nextUrl.searchParams.get("search") || "";

  console.log("Page:", page + 1); // Convert back to 1-based for logging
  console.log("Limit:", limit);
  console.log("Search Company:", search);

  const supabase = await createClient();

  // Query to get articles matching search
  let articleQuery = supabase
    .from("tbl_article")
    .select("*, tbl_customer(id, company_name)", { count: "exact" }) // Ensure inner join
    // .select("*, tbl_customer!inner(id, company_name)", { count: "exact" }) // Ensure inner join
    // .not("customer_id", "is", null)
    .eq("is_exist", true) // Filter for existing articles
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  // Query to get customers matching search
  const customerQuery = supabase
    .from("tbl_article")
    .select("*, tbl_customer(id, company_name)", { count: "exact" })
    // .select("*, tbl_customer!inner(id, company_name)", { count: "exact" }) // Ensure inner join
    .filter("tbl_customer.company_name", "ilike", `%${search}%`)
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  // Apply search to articles
  if (search) {
    articleQuery = articleQuery.filter("article_name", "ilike", `%${search}%`);
  }

  // Execute both queries
  const [{ data: articleResults, error: articleError, count: articleCount }, { data: customerResults, error: customerError, count: customerCount }] =
    await Promise.all([articleQuery, customerQuery]);

  if (articleError || customerError) {
    console.error("Error:", articleError || customerError);
    return NextResponse.json({ error: (articleError || customerError)?.message }, { status: 500 });
  }

  // Merge results while avoiding duplicates
  const mergedResults = [...new Map([...articleResults, ...customerResults].map(item => [item.id, item])).values()];

  return NextResponse.json({ data: mergedResults, total_count: (articleCount || 0) || (customerCount || 0) }, { status: 200 });
}
