import { createClient, requireNotViewer } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const MEASUREMENT_DELETE_BATCH_SIZE = 500;

/** Delete all tbl_measurement_prod rows for an ofid in batches by id to avoid timeouts and full scans. */
async function deleteMeasurementsByOfidInBatches(
  supabase: SupabaseClient,
  ofid: string
): Promise<{ error: Error | null }> {
  while (true) {
    const { data: batch, error: selectError } = await supabase
      .from("tbl_measurement_prod")
      .select("id")
      .eq("ofid", ofid)
      .limit(MEASUREMENT_DELETE_BATCH_SIZE);

    if (selectError) {
      return { error: new Error(selectError.message) };
    }
    if (!batch?.length) {
      return { error: null };
    }

    const ids = batch.map((row) => row.id);
    const { error: deleteError } = await supabase
      .from("tbl_measurement_prod")
      .delete()
      .in("id", ids);

    if (deleteError) {
      return { error: new Error(deleteError.message) };
    }
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Order id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const viewerCheck = await requireNotViewer(supabase);
    if (!viewerCheck.allowed) {
      return NextResponse.json(
        { error: "Viewers cannot modify data." },
        { status: 403 }
      );
    }

    // Get ofid before deleting so we can cascade-delete measurements
    const { data: prodRow, error: fetchError } = await supabase
      .from("tbl_prod")
      .select("ofid")
      .eq("id", id)
      .maybeSingle();

    if (!fetchError && prodRow?.ofid) {
      const { error: measDeleteError } = await deleteMeasurementsByOfidInBatches(
        supabase,
        prodRow.ofid
      );
      if (measDeleteError) {
        console.error("Supabase Delete Error (tbl_measurement_prod):", measDeleteError);
        return NextResponse.json(
          { error: `Failed to delete related measurements: ${measDeleteError.message}` },
          { status: 500 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("tbl_prod")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase Delete Error:", deleteError);
      return NextResponse.json(
        { error: `Database delete failed: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Order deleted successfully" },
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

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Order id is required" },
        { status: 400 }
      );
    }

    const { is_exist } = await req.json();

    const supabase = await createClient();

    // Hard delete: remove row from tbl_prod (no is_exist column), and cascade to tbl_measurement_prod
    if (is_exist === false) {
      // Get ofid before deleting so we can cascade-delete measurements
      const { data: prodRow, error: fetchError } = await supabase
        .from("tbl_prod")
        .select("ofid")
        .eq("id", id)
        .maybeSingle();

      if (!fetchError && prodRow?.ofid) {
        const { error: measDeleteError } = await deleteMeasurementsByOfidInBatches(
          supabase,
          prodRow.ofid
        );
        if (measDeleteError) {
          console.error("Supabase Delete Error (tbl_measurement_prod):", measDeleteError);
          return NextResponse.json(
            { error: `Failed to delete related measurements: ${measDeleteError.message}` },
            { status: 500 }
          );
        }
      }

      const { error: deleteError } = await supabase
        .from("tbl_prod")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Supabase Delete Error:", deleteError);
        return NextResponse.json(
          { error: `Database delete failed: ${deleteError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: "Order updated successfully" },
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
