import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { use } from "react";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    const {
      order_form_id,
      entry_date_time,
      exit_date_time,
      user_id,
    } = data;

   
    // Create Supabase client
    const supabase = await createClient();

    // // Insert data into tbl_orders_form
    // const { data: insertResult, error } = await supabase
    //   .from("tbl_production")
    //   .insert([
    //     {
    //       order_form_id: order_form_id || null,
    //       entry_date_time: entry_date_time || null,
    //       exit_date_time: exit_date_time || null,
    //       user_id: user_id || null,
    //       is_exist: true, // Always true
    //     },
    //   ]);

    // // Handle errors
    // if (error) {
    //   console.error("Error inserting data:", error.message);
    //   return NextResponse.json(
    //     { error: error.message },
    //     { status: 500 }
    //   );
    // }

    // console.log("Insert Result:", insertResult);

    const { data: updateResult, error: updateError } = await supabase
      .from("tbl_orders_form")
      .update({ entry_date_time, exit_date_time })
      .eq("id", order_form_id);

    // Return success response
    return NextResponse.json(
      { message: "Data inserted successfully", data: updateResult },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
