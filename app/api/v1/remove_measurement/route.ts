import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Delete the row from tbl_measurement_prod (hard delete so it no longer appears in the list)
    const { data: deleteData, error: deleteError } = await supabase
      .from("tbl_measurement_prod")
      .delete()
      .eq("id", id)
      .select();

    if (deleteError) {
      console.error("Supabase Delete Error:", deleteError);
      return NextResponse.json(
        { error: `Database delete failed: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Measurement removed successfully", data: deleteData },
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
