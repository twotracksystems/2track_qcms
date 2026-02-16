import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * OF Management: update a single order in tbl_prod by id (tbl_prod.id).
 * Body: order_fabrication_control, customer_id, article_id (tbl_article_prod id), pallete_count.
 */
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const body = await req.json();
    const {
      order_fabrication_control,
      product_name,
      customer_id,
      article_id,
      pallete_count,
    } = body;

    const supabase = await createClient();

    // Resolve customer_id -> client (company_name) for tbl_prod
    let client: string | null = null;
    if (customer_id != null && customer_id !== "") {
      const { data: customerRow, error: customerError } = await supabase
        .from("tbl_customer")
        .select("company_name")
        .eq("id", customer_id)
        .single();

      if (customerError) {
        console.error("edit_order: Error fetching customer:", customerError.message);
        return NextResponse.json(
          { error: "Failed to resolve customer." },
          { status: 500 }
        );
      }
      client = customerRow?.company_name ?? null;
    }

    // Resolve article_id (tbl_article_prod id) -> article number for tbl_prod.article_ref
    let article_ref: number | null = null;
    if (article_id != null && article_id !== "") {
      const { data: articleRow, error: articleError } = await supabase
        .from("tbl_article_prod")
        .select("article")
        .eq("id", article_id)
        .single();

      if (articleError) {
        console.error("edit_order: Error fetching article_prod:", articleError.message);
        return NextResponse.json(
          { error: "Failed to resolve article." },
          { status: 500 }
        );
      }
      if (articleRow?.article != null && Number.isFinite(Number(articleRow.article))) {
        article_ref = Number(articleRow.article);
      }
    }

    const updatePayload: Record<string, unknown> = {
      ofid: order_fabrication_control != null && order_fabrication_control !== ""
        ? String(order_fabrication_control).trim()
        : null,
      client,
      article_ref,
      pallet_num_dried: pallete_count != null && pallete_count !== ""
        ? Number(pallete_count)
        : null,
    };

    const { data: updateData, error: updateError } = await supabase
      .from("tbl_prod")
      .update(updatePayload)
      .eq("id", id)
      .select("id");

    if (updateError) {
      console.error("edit_order: Supabase update error:", updateError);
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Order updated successfully", data: updateData },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("edit_order: Unexpected error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
