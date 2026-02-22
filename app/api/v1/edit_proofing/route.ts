import { createClient, requireNotViewer } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const {order_form_id, entry_date_time,
      exit_date_time,
      num_pallets,
      program_name } =
      await req.json();

    const supabase = await createClient();
    const viewerCheck = await requireNotViewer(supabase);
    if (!viewerCheck.allowed) {
      return NextResponse.json(
        { error: "Viewers cannot modify data." },
        { status: 403 }
      );
    }

    // Update user details in the database
    const { data: userUpdateData, error: userUpdateError } = await supabase
      .from("tbl_proofing")
      .update({
        order_form_id,
        entry_date_time,
        exit_date_time,
        num_pallets,
        program_name,
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
