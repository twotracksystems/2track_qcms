import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
  
    const {id} = await req.json();
    const supabase = await createClient();

    const { data, error } = await supabase.from("tbl_measurement").update({is_exist:false}).eq("id",id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data: data }, { status: 200 });



}