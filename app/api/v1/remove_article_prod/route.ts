import { createClient, requireNotViewer } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    // Extract ID from the request query
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const viewerCheck = await requireNotViewer(supabase);
    if (!viewerCheck.allowed) {
      return NextResponse.json(
        { error: "Viewers cannot modify data." },
        { status: 403 }
      );
    }

    // Get the article number (tbl_prod.article_ref references tbl_article_prod.article)
    const { data: articleRow, error: fetchError } = await supabase
      .from("tbl_article_prod")
      .select("article")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Supabase Fetch Error:", fetchError);
      return NextResponse.json(
        { error: `Failed to fetch article: ${fetchError.message}` },
        { status: 500 }
      );
    }

    const articleRef = articleRow?.article;
    if (articleRef != null && articleRef !== "") {
      // Clear article_ref in tbl_prod to avoid FK violation on delete
      const { error: updateError } = await supabase
        .from("tbl_prod")
        .update({ article_ref: null })
        .eq("article_ref", articleRef);

      if (updateError) {
        console.error("Supabase Update tbl_prod.article_ref Error:", updateError);
        return NextResponse.json(
          { error: `Failed to clear article_ref: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    // Delete the record from the database
    const { data: deleteData, error: deleteError } = await supabase
      .from("tbl_article_prod")
      .delete()
      .eq("id", id)
      .select();

    if (deleteError) {
      console.error("Supabase Delete Error:", deleteError);
      return NextResponse.json(
        { error: `Database delete failed: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      { message: "Article prod deleted successfully", data: deleteData },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unexpected Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: err.message },
      { status: 500 }
    );
  }
}




