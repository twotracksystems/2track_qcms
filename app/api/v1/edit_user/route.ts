import { createClient, roleExtractor } from "@/utils/supabase/server";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    // Extract UUID from the request query
    const uuid = req.nextUrl.searchParams.get("uuid");
    if (!uuid || uuid.length !== 36) {
      return NextResponse.json(
        { error: "Invalid or missing UUID" },
        { status: 400 }
      );
    }

    // Parse request body
    const { email, first_name, last_name, role } =
      await req.json();

    // Check required fields
    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: email, first_name, last_name, or role",
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Verify user role
    const current_role = await roleExtractor(supabase);
    if (current_role !== "Super Admin") {
      return NextResponse.json(
        { error: "No permission to perform this action" },
        { status: 401 }
      );
    }

    // Check if the email is already in use
    const { data: existingEmailData, error } = await supabase
      .from("tbl_users")
      .select("uuid,email")
      .eq("email", email)
      .single();
    if (existingEmailData && existingEmailData.uuid !== uuid) {
      // Email is in use by another UUID

      console.log("Email already exists:", email);
      return NextResponse.json(
        { error: "Email is already in use by another user" },
        { status: 409 }
      );
    }

    // Update user details in the database
    const { data: userUpdateData, error: userUpdateError } = await supabase
      .from("tbl_users")
      .update({
        email,
        first_name,
        // middle_name,
        last_name,
        role,
        // suffix,

        updated_at: new Date(),
      })
      .eq("uuid", uuid);
    if (userUpdateError) {
      console.error("Supabase Update Error:", userUpdateError);
      return NextResponse.json(
        { error: `Database update failed: ${userUpdateError.message}` },
        { status: 500 }
      );
    }

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
