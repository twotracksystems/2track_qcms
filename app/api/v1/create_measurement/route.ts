import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    const {
      order_id,
      length,
      inside_diameter,
      outside_diameter,
      flat_crush,
      h20,
      radial,
      number_control,
      pallete_count,
      remarks,
      user_id,
    } = data;

    console.log("Data gathered:", data[1]);

    // Create Supabase client
    const supabase = await createClient();
    if(pallete_count === 0 || pallete_count === null || pallete_count === undefined){
      return NextResponse.json(
        { error: "Pallete count cannot be 0" },
        { status: 400 }
      );
    }
    // Insert data into tbl_orders_form
    const { data: insertResult, error } = await supabase
  .from("tbl_measurement")
  .insert([
    {
      // Do not include `id` in the payload
      order_form_id: order_id || null,
      length: length || null,
      inside_diameter: inside_diameter || null,
      outside_diameter: outside_diameter || null,
      flat_crush: flat_crush || null,
      h20: h20 || null,
      radial: radial || null,
      number_control: number_control || null,
      pallete_count: pallete_count,
      remarks: remarks || null,
      user_id: user_id || null,
      is_exist: true,
    },
  ]);


    // Handle errors
    if (error) {
      console.error("Error inserting data:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      { message: "Data inserted successfully", data: insertResult },
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
