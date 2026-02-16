import { createClient } from "@/utils/supabase/server";
import { normalizeDecimalInput } from "@/utils/parseDecimal";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Parse incoming request data
    const data = await req.json();
    const {
      article,
      designation_article,
      inside_diameter,
      outside_diameter,
      length,
      article_name,
      quality,
      inside_diameter_min,
      inside_diameter_max,
      humidty_min,
      humidity_max,
      outside_diameter_min,
      outside_diameter_max,
      resistance_min,
      resistance_max,
      length_min,
      length_max,
    } = data;

    console.log("Receive data", {
      article,
      designation_article,
      inside_diameter,
      outside_diameter,
      length,
      article_name,
      quality,
      inside_diameter_min,
      inside_diameter_max,
      humidty_min,
      humidity_max,
      outside_diameter_min,
      outside_diameter_max,
      resistance_min,
      resistance_max,
      length_min,
      length_max,
    });

    // Create Supabase client
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    let nextId = Date.now();
    const { data: latestRow, error: latestError } = await adminSupabase
      .from("tbl_article_prod")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.error("Error fetching latest id:", latestError.message);
      return NextResponse.json(
        { error: `Failed to generate id: ${latestError.message}` },
        { status: 500 }
      );
    }

    if (latestRow?.id !== null && latestRow?.id !== undefined) {
      nextId = Number(latestRow.id) + 1;
    }

    let nextArticle = 1;
    const { data: latestArticleRow, error: latestArticleError } =
      await adminSupabase
        .from("tbl_article_prod")
        .select("article")
        .order("article", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestArticleError) {
      console.error("Error fetching latest article:", latestArticleError.message);
      return NextResponse.json(
        { error: `Failed to generate article: ${latestArticleError.message}` },
        { status: 500 }
      );
    }

    if (latestArticleRow?.article !== null && latestArticleRow?.article !== undefined) {
      const parsedLatestArticle = Number(latestArticleRow.article);
      if (!isNaN(parsedLatestArticle)) {
        nextArticle = parsedLatestArticle + 1;
      }
    }

    const parsedArticle =
      article !== null && article !== undefined && article !== ""
        ? Number(article)
        : null;
    const articleToInsert = !isNaN(parsedArticle as number) && parsedArticle !== null
      ? parsedArticle
      : nextArticle;

    const lengthValue = normalizeDecimalInput(length);
    const insideDiameterValue = normalizeDecimalInput(inside_diameter);
    const outsideDiameterValue = normalizeDecimalInput(outside_diameter);
    const lengthMinValue = normalizeDecimalInput(length_min);
    const lengthMaxValue = normalizeDecimalInput(length_max);
    const insideDiameterMinValue = normalizeDecimalInput(inside_diameter_min);
    const insideDiameterMaxValue = normalizeDecimalInput(inside_diameter_max);
    const outsideDiameterMinValue = normalizeDecimalInput(outside_diameter_min);
    const outsideDiameterMaxValue = normalizeDecimalInput(outside_diameter_max);
    const resistanceMinValue = normalizeDecimalInput(resistance_min);
    const resistanceMaxValue = normalizeDecimalInput(resistance_max);
    const humidityMinValue = normalizeDecimalInput(humidty_min);
    const humidityMaxValue = normalizeDecimalInput(humidity_max);

    // Insert data
    const { data: insertResult, error: insertError } = await supabase
      .from("tbl_article_prod")
      .insert([
        {
          id: nextId,
          article: articleToInsert,
          designation_article: designation_article || null,
          inside_diameter: insideDiameterValue ?? null,
          outside_diameter: outsideDiameterValue ?? null,
          length: lengthValue ?? null,
          article_name: article_name || null,
          quality: quality || null,
          inside_diameter_min: insideDiameterMinValue ?? null,
          inside_diameter_max: insideDiameterMaxValue ?? null,
          humidty_min: humidityMinValue ?? null,
          humidity_max: humidityMaxValue ?? null,
          outside_diameter_min: outsideDiameterMinValue ?? null,
          outside_diameter_max: outsideDiameterMaxValue ?? null,
          resistance_min: resistanceMinValue ?? null,
          resistance_max: resistanceMaxValue ?? null,
          length_min: lengthMinValue ?? null,
          length_max: lengthMaxValue ?? null,
          created_at: new Date().toISOString().slice(0, 10),
        },
      ])
      .select(); // Ensure we return the inserted row, including its ID

    // Handle insertion errors
    if (insertError) {
      console.error("Error inserting data:", insertError.message);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Retrieve the inserted ID (assuming only one row is inserted)
    const insertedId = insertResult[0]?.id;

    // Return success response
    return NextResponse.json(
      { message: "Data inserted successfully", id: insertedId },
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




