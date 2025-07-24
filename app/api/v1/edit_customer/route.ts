import { createClient, roleExtractor } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    // Extract UUID from the request query
    const id = req.nextUrl.searchParams.get("id");

    // Parse request body
    const { email, first_name, middle_name, last_name, company_name, user_id,customer_id } = await req.json();
    console.log("Received Data:", email, first_name, middle_name, last_name, company_name, user_id,customer_id);
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

    // // Fetch the existing user by ID
    // const { data: existingUser, error: userFetchError } = await supabase
    //   .from("tbl_customer")
    //   .select("email")
    //   .eq("id", id)
    //   .single();

    // if (userFetchError || !existingUser) {
    //   return NextResponse.json(
    //     { error: "User not found" },
    //     { status: 404 }
    //   );
    // }

    // // Check if email is being updated and if it already exists in another record
    // if (email && email !== existingUser.email) {
    //   const { data: existingEmail, error: emailCheckError } = await supabase
    //     .from("tbl_customer")
    //     .select("email, id")
    //     .eq("email", email)
    //     .single();


    //   if (existingEmail && existingEmail.id !== id) {
    //     console.log("Email already exists:", email);
    //     return NextResponse.json(
    //       { message: "Email already exists" },
    //       { status: 409 } // Conflict status code
    //     );
    //   }
    // }

    // Update user details in the database
    const { data: userUpdateData, error: userUpdateError } = await supabase
      .from("tbl_customer")
      .update({
        // email: email || existingUser.email, // Keep the original email if not updated
        // first_name,
        // middle_name,
        // last_name,
        company_name,
        customer_id,
        user_id,
        updated_at: new Date(),
      })
      .eq("id", id);

    if (userUpdateError) {
      console.error("Supabase Update Error:", userUpdateError);
      return NextResponse.json(
        { error: `Database update failed: ${userUpdateError.message}` },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      { message: "User updated successfully", data: userUpdateData },
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
