import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {

    const order_id = req.nextUrl.searchParams.get("order_id");
    const pallete_count = req.nextUrl.searchParams.get("pallete_count");




    
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tbl_measurement")
    .select("*")
    .eq("order_form_id", order_id)
    .eq("pallete_count", pallete_count)
    .eq("is_exist", true)
   
    const {data:OrderFabricationControlData, error:OrderFabricationControlError} = await supabase.from("tbl_orders_form").select("*").eq("id", order_id);
    if(OrderFabricationControlError){
        return NextResponse.json(
            { error: "Order Error"+OrderFabricationControlError.message },
            { status: 500 }
        );
        }

    const {data:ArticleData, error:ArticleError} = await supabase.from("tbl_article").select("*").eq("id", OrderFabricationControlData[0].article_id);

    if(ArticleError){
        return NextResponse.json(
            { error: "Article Error"+ArticleError.message },
            { status: 500 }
        );
    }



  if (error) {
    return NextResponse.json({ error: "DataError"+error.message }, { status: 500 });
  }


  console.log(ArticleData[0].id);

  if(data.length >=ArticleData[0].number_control){
    return NextResponse.json({ status:"full"}, { status: 200 });
  }
  else{
    return NextResponse.json({ status:"not_full"}, { status: 200 });
  }


}