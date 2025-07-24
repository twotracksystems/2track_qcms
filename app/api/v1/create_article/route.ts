import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    const {
      article_name,
      customer_id,
      article_nominal,
      article_min,
      article_max,
      number_control,
      user_id,
    } = data;

    console.log("Recieve data"
    ,article_name,
    customer_id,
    article_nominal,
    article_min,
    article_max,
    number_control,
    user_id
    );

    // Create Supabase client
    const supabase = await createClient();

    // Insert data without article_name first
    const { data: insertResult, error: insertError } = await supabase
      .from("tbl_article")
      .insert([
        {
          article_name: article_name || null,
          customer_id: customer_id,
          article_nominal: article_nominal,
          article_min: article_min,
          article_max: article_max,
          number_control: number_control || null,
          user_id: user_id,
          is_exist: true, // Always true
        },
      ])
      .select(); // Ensure we return the inserted row, including its ID

    // Handle insertion errors
    if (insertError) {
      console.error("Error inserting data:", insertError.message);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }


    // Retrieve the inserted ID (assuming only one row is inserted)
    const insertedId = insertResult[0]?.id;

    // if (!insertedId) {
    //   throw new Error("Failed to retrieve the inserted ID.");
    // }

    // // Update the article_name to include the ID
    // const { data: updateResult, error: updateError } = await supabase
    //   .from("tbl_article")
    //   .update({ article_name: `article ${insertedId}` })
    //   .eq("id", insertedId);

    // // Handle update errors
    // if (updateError) {
    //   console.error("Error updating article_name:", updateError.message);
    //   return NextResponse.json(
    //     { error: updateError.message },
    //     { status: 500 }
    //   );
    // }

   

    // Return success response
    return NextResponse.json(
      { message: "Data inserted and updated successfully", id: insertedId },
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
