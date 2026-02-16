import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    // Extract ID from the request query
    const id = req.nextUrl.searchParams.get("id");

    // Parse request body
    const {
      article,
      designation_article,
      inside_diameter,
      outside_diameter,
      length,
      article_name,
      quality,
      inside_diameter_min,
      inside_diameter_max,
      humidty_min,
      humidity_max,
      outside_diameter_min,
      outside_diameter_max,
      resistance_min,
      resistance_max,
      length_min,
      length_max,
    } = await req.json();

    // Initialize Supabase client
    const supabase = await createClient();

    // Update article_prod details in the database
    const { data: updateData, error: updateError } = await supabase
      .from("tbl_article_prod")
      .update({
        article: article || null,
        designation_article: designation_article || null,
        inside_diameter: inside_diameter || null,
        outside_diameter: outside_diameter || null,
        length: length || null,
        article_name: article_name || null,
        quality: quality || null,
        inside_diameter_min: inside_diameter_min || null,
        inside_diameter_max: inside_diameter_max || null,
        humidty_min: humidty_min || null,
        humidity_max: humidity_max || null,
        outside_diameter_min: outside_diameter_min || null,
        outside_diameter_max: outside_diameter_max || null,
        resistance_min: resistance_min || null,
        resistance_max: resistance_max || null,
        length_min: length_min || null,
        length_max: length_max || null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Supabase Update Error:", updateError);
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      { message: "Article prod updated successfully", data: updateData },
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




