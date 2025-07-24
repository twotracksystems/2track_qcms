import { createClient, roleExtractor } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    // Extract UUID from the request query
    const id = req.nextUrl.searchParams.get("id");
   

    // Parse request body
    const {entry_date_time,exit_date_time} =
      await req.json();

    // Initialize Supabase client
    const supabase = await createClient();

    // Verify user role
    // const current_role = await roleExtractor(supabase);
    // if (current_role !== "Super Admin") {
    //   return NextResponse.json(
    //     { error: "No permission to perform this action" },
    //     { status: 401 }
    //   );
    // }

    // Update user details in the database
    const { data: updateResult, error: updateError } = await supabase
    .from("tbl_orders_form")
    .update({ entry_date_time, exit_date_time })
    .eq("id", id);


    if (updateError) {
      console.error("Supabase Update Error:", updateError);
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      );
    }
    console.log("recieved data are:",updateResult)

    // Optional: Update Auth if password is provided
    // if (password) {
    //   const { error: authError } = await supabase.auth.updateUser({
    //     email,
    //     password,
    //   });

    //   if (authError) {
    //     console.error("Auth Update Error:", authError);
    //     return NextResponse.json(
    //       { error: `Failed to update authentication: ${authError.message}` },
    //       { status: 500 }
    //     );
    //   }
    // }

    // Return success response
    return NextResponse.json(
      { message: "User updated successfully", data: updateResult },
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
