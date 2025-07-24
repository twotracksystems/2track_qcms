import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    console.log(data)
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
      measurement_id
    } = data;

   

    // Create Supabase client
    const supabase = await createClient();
    if(pallete_count === 0 || pallete_count === null || pallete_count === undefined){
      return NextResponse.json(
        { error: "Pallete count cannot be 0" },
        { status: 400 }
      );
    }


    // Update data into tbl_orders_form
    const { data: insertResult, error } = await supabase
  .from("tbl_measurement")
  .update([
    {
      length: length || 0,
      inside_diameter: inside_diameter || 0,
      outside_diameter: outside_diameter || 0,
      flat_crush: flat_crush || 0,
      h20: h20 || 0,
      radial: radial || 0,
      remarks: remarks || null,
      user_id: user_id || null,
      is_exist: true,
    },
  ]).eq("id",measurement_id)
  .eq("is_exist",true);


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
