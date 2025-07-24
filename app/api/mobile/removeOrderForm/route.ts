
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

  const { order_id } = await req.json();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tbl_orders_form")
    .update({ is_exist: false })
    .eq("id", order_id);
    
  if (error) {
  return NextResponse.json({code:500, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ code: 200, data: data }, { status: 200 }); 
}


