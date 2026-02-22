import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET ?id=<tbl_article_prod.id>
 * Returns whether this article is referenced in production data (tbl_prod.article_ref).
 */
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: articleRow, error: fetchError } = await supabase
      .from("tbl_article_prod")
      .select("article")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("check_article_prod_usage fetch article:", fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    const articleRef = articleRow?.article;
    if (articleRef == null || articleRef === "") {
      return NextResponse.json({ inUse: false, count: 0 }, { status: 200 });
    }

    const { count, error: countError } = await supabase
      .from("tbl_prod")
      .select("id", { count: "exact", head: true })
      .eq("article_ref", articleRef);

    if (countError) {
      console.error("check_article_prod_usage count tbl_prod:", countError);
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    return NextResponse.json(
      { inUse: total > 0, count: total },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("check_article_prod_usage unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
