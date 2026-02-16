import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      drying_start_date,
      drying_start_time,
      drying_end_date,
      drying_end_time,
    } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updatePayload: Record<string, string | null> = {};
    if (drying_start_date !== undefined) updatePayload.drying_start_date = drying_start_date || null;
    if (drying_start_time !== undefined) updatePayload.drying_start_time = drying_start_time || null;
    if (drying_end_date !== undefined) updatePayload.drying_end_date = drying_end_date || null;
    if (drying_end_time !== undefined) updatePayload.drying_end_time = drying_end_time || null;

    const { data, error } = await supabase
      .from("tbl_prod")
      .update(updatePayload)
      .eq("id", order_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating drying:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Drying updated successfully", data },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
