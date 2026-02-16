import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    const {
      order_fabrication_control,
      // product_name,
      customer_id,
      article_id,
      // assignee,
      pallete_count,
      // is_assigned,
      // user,
    } = data;
    console.log("Received data:", data);

    // Create Supabase client
    const supabase = await createClient();

    if (!order_fabrication_control) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const ofidValue = String(order_fabrication_control).trim();

    // Check for duplicates in tbl_prod (by OFID)
    const { data: existingProd, error: existingProdError } = await supabase
      .from("tbl_prod")
      .select("id")
      .eq("ofid", ofidValue)
      .limit(1);

    if (existingProdError) {
      console.error("Error checking duplicate OFID:", existingProdError.message);
      return NextResponse.json(
        { error: existingProdError.message },
        { status: 500 }
      );
    }

    if (existingProd && existingProd.length > 0) {
      return NextResponse.json(
        { error: "OFID already exists in production table." },
        { status: 409 }
      );
    }

    // Resolve client name from customer_id
    let clientName: string | null = null;
    if (customer_id) {
      const { data: customerRow, error: customerError } = await supabase
        .from("tbl_customer")
        .select("company_name")
        .eq("id", customer_id)
        .single();

      if (customerError) {
        console.error("Error fetching customer:", customerError.message);
        return NextResponse.json(
          { error: "Failed to resolve customer name." },
          { status: 500 }
        );
      }

      clientName = customerRow?.company_name || null;
    }

    // article_ref = article number from tbl_article_prod.article (FK to tbl_prod.article_ref)
    // Resolve article_id (tbl_article_prod id) -> article number, like edit_order
    let article_ref: number | null = null;
    if (data.article_ref != null && data.article_ref !== "") {
      const num = Number(data.article_ref);
      if (Number.isFinite(num)) article_ref = num;
    } else if (article_id != null && article_id !== "") {
      const { data: articleRow, error: articleError } = await supabase
        .from("tbl_article_prod")
        .select("article")
        .eq("id", article_id)
        .single();

      if (articleError) {
        console.error("create_order: Error fetching article_prod:", articleError.message);
        return NextResponse.json(
          { error: "Failed to resolve article. Please select a valid ID Article." },
          { status: 400 }
        );
      }
      if (articleRow?.article != null && Number.isFinite(Number(articleRow.article))) {
        article_ref = Number(articleRow.article);
      }
    }

    const insertPayload: Record<string, any> = {
      ofid: ofidValue,
      client: clientName,
      pallet_num_dried: pallete_count ?? null,
      article_ref,
    };

    // Generate next numeric id for tbl_prod (id column is not auto-generated)
    const { data: latestProdRow, error: latestProdError } = await supabase
      .from("tbl_prod")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (latestProdError) {
      console.error("Error fetching latest prod id:", latestProdError.message);
      return NextResponse.json(
        { error: "Failed to generate production ID." },
        { status: 500 }
      );
    }

    const latestIdValue = Number(latestProdRow?.id);
    const nextId = Number.isFinite(latestIdValue) ? latestIdValue + 1 : null;

    if (!nextId) {
      console.error("Invalid latest prod id:", latestProdRow?.id);
      return NextResponse.json(
        { error: "Failed to generate production ID." },
        { status: 500 }
      );
    }

    insertPayload.id = nextId;

    // Insert data into tbl_prod
    let { data: insertResult, error: insertError } = await supabase
      .from("tbl_prod")
      .insert([insertPayload])
      .select("id"); // Ensure to retrieve the inserted ID

    // Handle errors
    if (insertError) {
      console.error("Error inserting data:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    console.log("Insert Result:", insertResult);
    // Retrieve the inserted ID
    const order_form_id = insertResult?.[0]?.id;

    if (!order_form_id) {
      console.error("Failed to retrieve the inserted production id.");
      return NextResponse.json(
        { error: "Failed to retrieve the inserted production ID" },
        { status: 500 }
      );
    }

    // // Insert data into tbl_assignee_history
    // const { error: historyError } = await supabase
    //   .from("tbl_assignee_history")
    //   .insert([
    //     {
    //       order_form_id: order_form_id, // Use the retrieved ID
    //       user_id: assignee || null,
    //       is_assigned: true,
    //       is_exist: true, // Always true
    //     },
    //   ]);

    // // Handle errors
    // if (historyError) {
    //   console.error("Error inserting assignee history:", historyError.message);
    //   return NextResponse.json({ error: historyError.message }, { status: 500 });
    // }

    // Return success response
    return NextResponse.json(
      { message: "Data inserted successfully", code: 200, data: insertResult },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    return NextResponse.json(
      { code: 500, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
