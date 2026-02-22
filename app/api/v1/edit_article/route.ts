import { createClient, requireNotViewer } from "@/utils/supabase/server";
import { normalizeDecimalInput } from "@/utils/parseDecimal";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const {id_number,article_name,customer_id,article_nominal,article_min,article_max,number_control} =
      await req.json();

    const supabase = await createClient();
    const viewerCheck = await requireNotViewer(supabase);
    if (!viewerCheck.allowed) {
      return NextResponse.json(
        { error: "Viewers cannot modify data." },
        { status: 403 }
      );
    }

    const numberControlValue = normalizeDecimalInput(number_control);

    // Update user details in the database
    const { data: userUpdateData, error: userUpdateError } = await supabase
      .from("tbl_article")
      .update({
        id_number: id_number, // Assuming id_number is the same as the UUID
        article_name,
        customer_id,
        article_nominal,
        article_min,
        article_max,
        number_control: numberControlValue ?? null,
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
