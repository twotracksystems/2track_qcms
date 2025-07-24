import { createClient, roleExtractor } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    // Extract UUID from the request query
    const id = req.nextUrl.searchParams.get("id");
   

    // Parse request body
    const { is_exist } =
      await req.json();

    // Initialize Supabase client
    const supabase = await createClient();

    const { data: orderCheckData, error: orderCheckError } = await supabase
      .from("tbl_orders_form")
      .select("article_id")
      .eq("is_exist", true)
      .eq("article_id", id)
      .limit(1);
    if (orderCheckError) {
      console.error("Supabase Order Check Error:", orderCheckError);
      return NextResponse.json(
        { error: `Database query failed: ${orderCheckError.message}` },
        { status: 500 }
      );
    }
    if (orderCheckData && orderCheckData.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete article with existing orders" },
        { status: 400 }
      );
    }
    // Update user details in the database
    const { data: userUpdateData, error: userUpdateError } = await supabase
      .from("tbl_article")
      .update({ is_exist:false, updated_at: new Date() }).eq("id", id);

    if (userUpdateError) {
      console.error("Supabase Update Error:", userUpdateError);
      return NextResponse.json(
        { error: `Database update failed: ${userUpdateError.message}` },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      { message: "Article updated successfully", data: userUpdateData },
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
