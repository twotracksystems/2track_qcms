import { createClient, requireNotViewer } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    const { email, first_name, middle_name, last_name, company_name, user_id,customer_id } = await req.json();
    console.log("Received Data:", email, first_name, middle_name, last_name, company_name, user_id,customer_id);
    const supabase = await createClient();
    const viewerCheck = await requireNotViewer(supabase);
    if (!viewerCheck.allowed) {
      return NextResponse.json(
        { error: "Viewers cannot modify data." },
        { status: 403 }
      );
    }

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
