import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * OF Management: fetch a single order from tbl_prod by id (tbl_prod.id).
 * Returns shape expected by the edit order form: order_fabrication_control, customer_id, article_id (tbl_article_prod id), pallete_count.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: prodRow, error: prodError } = await supabase
    .from("tbl_prod")
    .select("*")
    .eq("id", id)
    .single();

  if (prodError || !prodRow) {
    return NextResponse.json(
      { error: prodError?.message || "Order not found" },
      { status: 404 }
    );
  }

  // Resolve client (company name) -> customer_id from tbl_customer
  let customer_id: string | number | null = null;
  if (prodRow.client && String(prodRow.client).trim() !== "") {
    const { data: customerRow } = await supabase
      .from("tbl_customer")
      .select("id")
      .ilike("company_name", String(prodRow.client).trim())
      .limit(1)
      .maybeSingle();
    if (customerRow?.id != null) {
      customer_id = customerRow.id;
    }
  }

  // Resolve article_ref (article number) -> tbl_article_prod id for form dropdown
  let article_id: string | number | null = null;
  if (prodRow.article_ref != null && prodRow.article_ref !== "") {
    const articleNum = Number(prodRow.article_ref);
    if (Number.isFinite(articleNum)) {
      const { data: articleRow } = await supabase
        .from("tbl_article_prod")
        .select("id")
        .eq("article", articleNum)
        .limit(1)
        .maybeSingle();
      if (articleRow?.id != null) {
        article_id = articleRow.id;
      }
    }
  }

  const order = {
    id: prodRow.id,
    order_fabrication_control: prodRow.ofid ?? null,
    customer_id,
    article_id,
    pallete_count: prodRow.pallet_num_dried ?? null,
  };

  return NextResponse.json([order], { status: 200 });
}
