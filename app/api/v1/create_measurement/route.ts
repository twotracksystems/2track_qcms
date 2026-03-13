import { createClient, requireNotViewer } from "@/utils/supabase/server";
import { normalizeDecimalInput } from "@/utils/parseDecimal";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    const {
      order_id,
      ofid: ofidFromBody,
      length,
      inside_diameter,
      outside_diameter,
      flat_crush,
      h20,
      radial,
      number_control,
      pallete_count,
      remarks,
      user_id,
    } = data;

    console.log("create_measurement - Data gathered:", { order_id, ofidFromBody, pallete_count });

    const supabase = await createClient();
    const viewerCheck = await requireNotViewer(supabase);
    if (!viewerCheck.allowed) {
      return NextResponse.json(
        { error: "Viewers cannot modify data." },
        { status: 403 }
      );
    }
    // Allow pallet number to be 0 (client inputs in table)

    // Resolve ofid: prefer from request body (frontend sends orderformdisplay), else lookup from tbl_prod by order_id
    let ofidValue: string | null = (ofidFromBody != null && String(ofidFromBody).trim() !== "")
      ? String(ofidFromBody).trim()
      : null;
    if (ofidValue == null && order_id != null) {
      const { data: prodRows, error: prodLookupError } = await supabase
        .from("tbl_prod")
        .select("ofid")
        .eq("id", order_id)
        .limit(1);
      if (prodLookupError) {
        console.error("create_measurement - tbl_prod lookup error:", prodLookupError.message, { order_id });
      } else if (!prodRows?.length) {
        console.warn("create_measurement - No tbl_prod row for order_id:", order_id);
      } else if (!prodRows[0]?.ofid) {
        console.warn("create_measurement - tbl_prod row has null ofid for order_id:", order_id);
      } else {
        ofidValue = prodRows[0].ofid;
      }
    }
    if (ofidValue == null) {
      console.warn("create_measurement - No ofid resolved; skipping tbl_measurement_prod insert. Pass ofid in body or ensure order_id matches tbl_prod.id with ofid set.");
    }

    // Normalize measurement values (same logic as insert payload)
    const norm = (v: unknown) =>
      v != null && v !== ""
        ? (normalizeDecimalInput(v) ?? Number(String(v).replace(",", "."))) ?? 0
        : 0;
    const len = norm(length);
    const inside = norm(inside_diameter);
    const outside = norm(outside_diameter);
    const flat = norm(flat_crush);
    const hum = norm(h20);
    // const allZeros = len === 0 && inside === 0 && outside === 0 && flat === 0 && hum === 0;
    // if (allZeros) {
    //   return NextResponse.json(
    //     { message: "Row skipped: all measurement values are zero" },
    //     { status: 200 }
    //   );
    // }

    // Insert into tbl_measurement_prod so the measurement modal can display the data (it reads by ofid)
    if (ofidValue) {
      // Generate next id if table has no default (id bigint not null)
      let nextId: number | null = null;
      const { data: maxRow, error: maxError } = await supabase
        .from("tbl_measurement_prod")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .single();
      if (!maxError && maxRow?.id != null) {
        nextId = Number(maxRow.id) + 1;
      } else {
        nextId = 1;
      }

      const insertPayload = {
        id: nextId,
        ofid: ofidValue,
        palette_num: pallete_count != null ? Number(pallete_count) : null,
        inside_diameter: inside_diameter != null && inside_diameter !== "" ? ((normalizeDecimalInput(inside_diameter) ?? Number(String(inside_diameter).replace(",", "."))) || null) : null,
        outside_diameter: outside_diameter != null && outside_diameter !== "" ? ((normalizeDecimalInput(outside_diameter) ?? Number(String(outside_diameter).replace(",", "."))) || null) : null,
        length: length != null && length !== "" ? ((normalizeDecimalInput(length) ?? Number(String(length).replace(",", "."))) || null) : null,
        flat_crush: flat_crush != null && flat_crush !== "" ? ((normalizeDecimalInput(flat_crush) ?? Number(String(flat_crush).replace(",", "."))) || null) : null,
        humidity: h20 != null && h20 !== "" ? ((normalizeDecimalInput(h20) ?? Number(String(h20).replace(",", "."))) || null) : null,
        geometry_valid: null,
        temp_value: null,
        import_datetime: new Date().toISOString().split("T")[0],
      };
      const { error: prodInsertError } = await supabase
        .from("tbl_measurement_prod")
        .insert([insertPayload]);
      if (prodInsertError) {
        console.error("Error inserting into tbl_measurement_prod:", prodInsertError.message, insertPayload);
        return NextResponse.json(
          { error: prodInsertError.message },
          { status: 500 }
        );
      }
      console.log("create_measurement - Inserted into tbl_measurement_prod:", { ofid: ofidValue, id: nextId });
    }

    // Use only tbl_measurement_prod; do not insert into tbl_measurement

    // Persist remarks to tbl_prod.note (keyed by order id = tbl_prod id)
    if (order_id != null) {
      const { error: prodError } = await supabase
        .from("tbl_prod")
        .update({ note: remarks ?? null })
        .eq("id", order_id);
      if (prodError) {
        console.error("Error updating tbl_prod.note:", prodError.message);
        // Don't fail the request; measurement was already inserted
      }
    }

    // Return success response
    return NextResponse.json(
      { message: "Data inserted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
