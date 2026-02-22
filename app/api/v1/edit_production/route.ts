import { createClient, requireNotViewer } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/** ISO time (HH:mm or HH:mm:ss) to tbl_prod time text e.g. "6:50:00 AM" */
function toProdTime(isoDateTime: string | null | undefined): string | null {
  if (!isoDateTime || typeof isoDateTime !== "string") return null;
  const t = isoDateTime.includes("T") ? isoDateTime.split("T")[1] : isoDateTime;
  const [hStr, mStr, sStr] = t.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const s = sStr != null ? parseInt(sStr, 10) : 0;
  if (isNaN(h) || h < 0 || h > 23) return null;
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  const mm = String(isNaN(m) ? 0 : m).padStart(2, "0");
  const ss = String(isNaN(s) ? 0 : s).padStart(2, "0");
  return `${hour12}:${mm}:${ss} ${ampm}`;
}

/** ISO date (YYYY-MM-DD) to tbl_prod prod_end_date text "MM/DD/YY" */
function toProdEndDateText(isoDateTime: string | null | undefined): string | null {
  if (!isoDateTime || typeof isoDateTime !== "string") return null;
  const datePart = isoDateTime.split("T")[0].split(" ")[0].trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const [y, m, d] = datePart.split("-").map((x) => parseInt(x, 10));
  const yy = y >= 2000 ? y - 2000 : y < 100 ? y : y % 100;
  return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${String(yy).padStart(2, "0")}`;
}

/** ISO datetime to date-only YYYY-MM-DD for prod_start_date (date column) */
function toProdStartDate(isoDateTime: string | null | undefined): string | null {
  if (!isoDateTime || typeof isoDateTime !== "string") return null;
  const datePart = isoDateTime.split("T")[0].split(" ")[0].trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  return datePart;
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id (tbl_prod row id)" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const entry_date_time = body.entry_date_time as string | null | undefined;
    const exit_date_time = body.exit_date_time as string | null | undefined;

    const supabase = await createClient();
    const viewerCheck = await requireNotViewer(supabase);
    if (!viewerCheck.allowed) {
      return NextResponse.json(
        { error: "Viewers cannot modify data." },
        { status: 403 }
      );
    }

    const prod_start_date = toProdStartDate(entry_date_time);
    const prod_start_time = toProdTime(entry_date_time);
    const prod_end_date = toProdEndDateText(exit_date_time);
    const prod_end_time = toProdTime(exit_date_time);

    const payload: Record<string, unknown> = {};
    if (prod_start_date != null) payload.prod_start_date = prod_start_date;
    if (prod_start_time != null) payload.prod_start_time = prod_start_time;
    if (prod_end_date != null) payload.prod_end_date = prod_end_date;
    if (prod_end_time != null) payload.prod_end_time = prod_end_time;

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No valid entry_date_time or exit_date_time to update" },
        { status: 400 }
      );
    }

    const { data: updateResult, error: updateError } = await supabase
      .from("tbl_prod")
      .update(payload)
      .eq("id", id);

    if (updateError) {
      console.error("Supabase Update Error (tbl_prod):", updateError);
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Production updated successfully", data: updateResult },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Unexpected Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: message },
      { status: 500 }
    );
  }
}
