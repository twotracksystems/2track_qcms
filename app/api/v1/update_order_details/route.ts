import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/v1/update_order_details
 * Updates tbl_prod.order_number (bigint null) and tbl_prod.delivery_date (date null).
 * Body: { id?: number; ofid?: string; order_number?: number | null; delivery_date?: string | null; article_ref?: number | null }
 * Either id (tbl_prod row id) or ofid is required. If only ofid is provided, we look up the row by ofid.
 * delivery_date must be YYYY-MM-DD or empty/null.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const rawId = body.id != null && body.id !== "" ? Number(body.id) : null;
    let id = typeof rawId === "number" && !Number.isNaN(rawId) ? rawId : null;
    const ofid = body.ofid != null && body.ofid !== "" ? String(body.ofid).trim() : null;

    if (id == null && !ofid) {
      return NextResponse.json(
        { error: "Missing id or ofid (tbl_prod row id or order fabrication id)" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (id == null && ofid) {
      const { data: row, error: findError } = await supabase
        .from("tbl_prod")
        .select("id")
        .eq("ofid", ofid)
        .maybeSingle();
      if (findError) {
        console.error("update_order_details lookup by ofid:", findError);
        return NextResponse.json(
          { error: `Lookup failed: ${findError.message}` },
          { status: 500 }
        );
      }
      if (!row?.id) {
        return NextResponse.json(
          { error: `No tbl_prod row found for ofid: ${ofid}` },
          { status: 404 }
        );
      }
      id = row.id;
    }

    const payload: Record<string, unknown> = {};

    if (body.hasOwnProperty("order_number")) {
      const raw = body.order_number;
      if (raw === null || raw === undefined || raw === "") {
        payload.order_number = null;
      } else {
        const num = typeof raw === "number" ? raw : parseInt(String(raw).trim(), 10);
        if (isNaN(num)) {
          return NextResponse.json(
            { error: "order_number must be a number or null" },
            { status: 400 }
          );
        }
        payload.order_number = num;
      }
    }

    if (body.hasOwnProperty("delivery_date")) {
      const raw = body.delivery_date;
      if (raw === null || raw === undefined || raw === "") {
        payload.delivery_date = null;
      } else {
        const str = String(raw).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          return NextResponse.json(
            { error: "delivery_date must be YYYY-MM-DD or null" },
            { status: 400 }
          );
        }
        payload.delivery_date = str;
      }
    }

    if (body.hasOwnProperty("article_ref")) {
      const raw = body.article_ref;
      if (raw === null || raw === undefined || raw === "") {
        payload.article_ref = null;
      } else {
        const num = typeof raw === "number" ? raw : Number(raw);
        if (typeof num !== "number" || Number.isNaN(num)) {
          return NextResponse.json(
            { error: "article_ref must be a number or null" },
            { status: 400 }
          );
        }
        payload.article_ref = num;
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No order_number, delivery_date, or article_ref to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tbl_prod")
      .update(payload)
      .eq("id", id)
      .select("id, order_number, delivery_date, article_ref")
      .single();

    if (error) {
      console.error("update_order_details tbl_prod error:", error);
      return NextResponse.json(
        { error: `Database update failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Order details updated", data }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("update_order_details error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: message },
      { status: 500 }
    );
  }
}
