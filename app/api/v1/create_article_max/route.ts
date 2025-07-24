import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    const {
      length,
      inside_diameter,
      outside_diameter,
      flat_crush,
      h20,
      user_id,
      radial,
    } = data;

 

    // Create Supabase client
    const supabase = await createClient();

    // Insert data into tbl_orders_form
    const { data: insertResult, error } = await supabase
      .from("tbl_article_max")
      .insert([
        {
          length: length || null,
          inside_diameter: inside_diameter || null,
          outside_diameter: outside_diameter || null,
          flat_crush: flat_crush || null,
          h20: h20 || null,
          radial:radial||null,
          user_id: user_id,
          is_exist: true, // Always true
        },
      ])
      .select(); // Ensure we return the inserted row, including its ID

    // Handle errors
    if (error) {
      console.error("Error inserting data:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const insertedId = insertResult[0]?.id;
    // Return success response
    return NextResponse.json(
      { message: "Data inserted successfully", id:insertedId, data: insertResult },
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
