import { createClient } from "@/utils/supabase/server";
import { normalizeDecimalInput } from "@/utils/parseDecimal";
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

    const body = await req.json();
    const {
      pallete_count,
      length,
      inside_diameter,
      outside_diameter,
      flat_crush,
      h20,
      remarks,
    } = body;

    const supabase = await createClient();

    // Get measurement row from tbl_measurement_prod to get ofid for tbl_prod.note update
    const { data: measurementRow } = await supabase
      .from("tbl_measurement_prod")
      .select("ofid")
      .eq("id", id)
      .single();

    const ofid_for_note = measurementRow?.ofid ?? null;

    // Update tbl_measurement_prod (map frontend field names to DB columns)
    const updatePayload: Record<string, unknown> = {
      length: length != null && length !== "" ? (normalizeDecimalInput(length) ?? null) : null,
      inside_diameter: inside_diameter != null && inside_diameter !== "" ? (normalizeDecimalInput(inside_diameter) ?? null) : null,
      outside_diameter: outside_diameter != null && outside_diameter !== "" ? (normalizeDecimalInput(outside_diameter) ?? null) : null,
      flat_crush: flat_crush != null && flat_crush !== "" ? (normalizeDecimalInput(flat_crush) ?? null) : null,
      humidity: h20 != null && h20 !== "" ? (normalizeDecimalInput(h20) ?? null) : null,
    };
    if (pallete_count != null && pallete_count !== "") {
      updatePayload.palette_num = Number(pallete_count);
    }

    const { data: userUpdateData, error: userUpdateError } = await supabase
      .from("tbl_measurement_prod")
      .update(updatePayload)
      .eq("id", id)
      .select();

    if (userUpdateError) {
      console.error("Supabase Update Error:", userUpdateError);
      return NextResponse.json(
        { error: `Database update failed: ${userUpdateError.message}` },
        { status: 500 }
      );
    }

    // Persist remarks to tbl_prod.note (by ofid)
    if (ofid_for_note != null && ofid_for_note !== "") {
      const { error: prodError } = await supabase
        .from("tbl_prod")
        .update({ note: remarks ?? null })
        .eq("ofid", ofid_for_note);
      if (prodError) {
        console.error("Error updating tbl_prod.note:", prodError.message);
      }
    }

    return NextResponse.json(
      { message: "Measurement updated successfully", data: userUpdateData },
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
