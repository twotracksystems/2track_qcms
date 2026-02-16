import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const ofid = req.nextUrl.searchParams.get("ofid");

    if (!ofid) {
      return NextResponse.json(
        { error: "ofid parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, find the order by OFID (order_fabrication_control)
    const { data: orders, error: orderError } = await supabase
      .from("tbl_orders_form")
      .select("id")
      .eq("order_fabrication_control", ofid)
      .limit(1);

    if (orderError) {
      return NextResponse.json(
        { error: `Error finding order: ${orderError.message}` },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: "Order not found with the provided OFID" },
        { status: 404 }
      );
    }

    const orderId = orders[0].id;

    // Get production records for this order
    const { data, error } = await supabase
      .from("tbl_production")
      .select("*")
      .eq("order_form_id", orderId)
      .eq("is_exist", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Error fetching production: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




