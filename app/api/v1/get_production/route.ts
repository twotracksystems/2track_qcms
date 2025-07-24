import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "0", 10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);
  const search = req.nextUrl.searchParams.get("search");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");
 

  const supabase = await createClient();
  // let totalDataBasedOnQuery = 0;

  // Base query
  let query = supabase
    .from("tbl_production")
    .select("*", { count: "exact" })
    .eq("is_exist", true)
    .range((page - 1) * limit, page * limit - 1);
  
    
  // Add date filters
  if (startDate && endDate) {
    const adjustedStartDate = `${startDate}T00:00:00`; // Ensure start of the day
    const adjustedEndDate = `${endDate}T23:59:59`; // Ensure end of the day
    query = query
      .gte("created_at", adjustedStartDate)
      .lte("created_at", adjustedEndDate);
  }

  const { data, error, count } = await query;
  console.log(data, error, count);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json(
      { data, total_count: count || 0 },
      { status: 200 }
    );
  }
}
