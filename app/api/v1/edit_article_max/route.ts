import { createClient, requireNotViewer } from "@/utils/supabase/server";
import { normalizeDecimalInput } from "@/utils/parseDecimal";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    // Extract UUID from the request query
    const id = req.nextUrl.searchParams.get("id");
   

    // Parse request body
    const {length,
      inside_diameter,
      outside_diameter,
      flat_crush,
      h20,
      radial,
    } =
      await req.json();

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

    // Update user details in the database
    const { data: userUpdateData, error: userUpdateError } = await supabase
      .from("tbl_article_max")
      .update({
        length: lengthValue ?? null,
        inside_diameter: insideDiameterValue ?? null,
        outside_diameter: outsideDiameterValue ?? null,
        flat_crush: flatCrushValue ?? null,
        h20: h20Value ?? null,
        radial: radialValue ?? null,
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
