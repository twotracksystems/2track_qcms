import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = await req.nextUrl.searchParams.get("id");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tbl_article_prod")
    .select()
    .eq("id", id);

  if (error) {
    console.error("Error fetching article_prod:", error.message);
    return NextResponse.json({ error: "Article prod not found" }, { status: 404 });
  }

  // Calculate average (nominal) values for resistance and humidity
  const processedData = data?.map((article: any) => {
    // Calculate average for resistance (nominal = (min + max) / 2)
    const resistanceNominal = 
      article.resistance_min != null && article.resistance_max != null
        ? (parseFloat(article.resistance_min) + parseFloat(article.resistance_max)) / 2
        : null;
    
    // Calculate average for humidity (nominal = (min + max) / 2)
    const humidityNominal = 
      article.humidty_min != null && article.humidity_max != null
        ? (parseFloat(article.humidty_min) + parseFloat(article.humidity_max)) / 2
        : null;

    return {
      ...article,
      // Add calculated nominal values
      resistance: resistanceNominal,
      humidity: humidityNominal,
      // Keep min/max values for reference
      resistance_min: article.resistance_min,
      resistance_max: article.resistance_max,
      humidity_min: article.humidty_min,
      humidity_max: article.humidity_max,
    };
  });

  console.log("Fetched article_prod data:", processedData);
  return NextResponse.json(processedData, { status: 200 });
}

