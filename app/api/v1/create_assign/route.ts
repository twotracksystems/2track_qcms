import { createClient, roleExtractor } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    const { order_form_id,user_id } = data;



    // Create Supabase client
    const supabase = await createClient();

    // Verify user role
    // const current_role = await roleExtractor(supabase);
    // if (current_role !== "Super Admin") {
    //   return NextResponse.json(
    //     { error: "No permission to perform this action" },
    //     { status: 401 }
    //   );
    // }
    // Check if the email already exists
    const { data: existingEmail, error: fetchError } = await supabase
      .from("tbl_assignee_history")
      .select("user_id")
      .eq("user_id", user_id)
      .single();

    if (existingEmail) {
   
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 } // Conflict status code
      );
    }
  
    // Insert data into tbl_customer
    const { data: insertResult, error: insertError } = await supabase
      .from("tbl_assignee_history")
      .insert([
        {
          order_form_id: order_form_id || null,
          is_assigned: true,
          user_id: user_id || null,
          created_date: new Date().toISOString(),
          is_exist: true, // Always true
        },
      ]);

    if (insertError) {
      console.error("Error inserting data:", insertError.message);
      return NextResponse.json(
        { error: insertError.message },
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
