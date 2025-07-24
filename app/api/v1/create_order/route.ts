import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    const {
      id,
      product_name,
      customer_id,
      article_id,
      assignee,
      pallete_count,
      is_assigned,
      user,
    } = data;



    // Create Supabase client
    const supabase = await createClient();

    // Insert data into tbl_orders_form
    const { data: insertResult, error: insertError } = await supabase
      .from("tbl_orders_form")
      .insert([
        {
          product_name: product_name || null,
          customer_id: customer_id || null,
          article_id: article_id || null,
          order_fabrication_control: id || null,
          //assignee: assignee || null,
          pallete_count: pallete_count || 0, // Default to 0 if not provided
          //is_assigned: true,
          is_exist: true, // Always true
        },
      ])
      .select("id"); // Ensure to retrieve the inserted ID

    // Handle errors
    if (insertError) {
      console.error("Error inserting data:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Retrieve the inserted ID
    const order_form_id = insertResult[0]?.id;

    if (!order_form_id) {
      console.error("Failed to retrieve the inserted order_form_id.");
      return NextResponse.json(
        { error: "Failed to retrieve the inserted order ID" },
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
