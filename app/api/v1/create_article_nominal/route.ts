import { createClient, requireNotViewer } from "@/utils/supabase/server";
import { normalizeDecimalInput } from "@/utils/parseDecimal";
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

 
    const supabase = await createClient();
    const viewerCheck = await requireNotViewer(supabase);
    if (!viewerCheck.allowed) {
      return NextResponse.json(
        { error: "Viewers cannot modify data." },
        { status: 403 }
      );
    }

    const lengthValue = normalizeDecimalInput(length);
    const insideDiameterValue = normalizeDecimalInput(inside_diameter);
    const outsideDiameterValue = normalizeDecimalInput(outside_diameter);
    const flatCrushValue = normalizeDecimalInput(flat_crush);
    const h20Value = normalizeDecimalInput(h20);
    const radialValue = normalizeDecimalInput(radial);

    // Insert data into tbl_orders_form
    const { data: insertResult, error } = await supabase
      .from("tbl_article_nominal")
      .insert([
        {
          length: lengthValue ?? null,
          inside_diameter: insideDiameterValue ?? null,
          outside_diameter: outsideDiameterValue ?? null,
          flat_crush: flatCrushValue ?? null,
          h20: h20Value ?? null,
          radial: radialValue ?? null,
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
      { message: "Data inserted successfully", id: insertedId, data: insertResult },
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
