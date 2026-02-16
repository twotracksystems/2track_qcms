import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { matchDimensions, normalizeText } from "@/utils/parseDesignation";

type ProductionRow = {
  ofid: string | number | null;
  client: string | null;
  length_p: string | number | null;
  inside_diameter_p: string | number | null;
  outside_diameter_p: string | number | null;
};

const parseNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return isNaN(value) ? null : value;
  const cleaned = String(value).replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

const parseLength = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return isNaN(value) ? null : value;
  const cleaned = String(value).replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

export async function GET(req: NextRequest) {
  try {
    const article = req.nextUrl.searchParams.get("article");
    if (!article) {
      return NextResponse.json(
        { error: "article parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const { data: articleRow, error: articleError } = await supabase
      .from("tbl_article_prod")
      .select("article, article_name, length, inside_diameter, outside_diameter")
      .eq("article", article)
      .single();

    if (articleError || !articleRow) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const normalizedClient = normalizeText(articleRow.article_name);
    const articleDimensions = {
      length: parseLength(articleRow.length),
      inside_diameter: parseNumber(articleRow.inside_diameter),
      outside_diameter: parseNumber(articleRow.outside_diameter),
    };

    let prodQuery = adminSupabase
      .from("tbl_prod")
      .select("ofid, client, length_p, inside_diameter_p, outside_diameter_p");

    if (normalizedClient) {
      prodQuery = prodQuery.ilike("client", `%${articleRow.article_name}%`);
    }

    const { data: productionRows, error: prodError } = await prodQuery.limit(5000);

    if (prodError) {
      return NextResponse.json(
        { error: `Failed to fetch production data: ${prodError.message}` },
        { status: 500 }
      );
    }

    const tolerance = 0.01;
    const matches = (productionRows as ProductionRow[] || []).filter((row) => {
      const clientMatch = normalizedClient
        ? normalizeText(row.client).includes(normalizedClient) ||
          normalizedClient.includes(normalizeText(row.client))
        : true;

      const dimensionMatch = matchDimensions(
        {
          length: parseNumber(row.length_p),
          inside_diameter: parseNumber(row.inside_diameter_p),
          outside_diameter: parseNumber(row.outside_diameter_p),
        },
        articleDimensions.length !== null &&
          articleDimensions.inside_diameter !== null &&
          articleDimensions.outside_diameter !== null
          ? {
              length: articleDimensions.length,
              inside_diameter: articleDimensions.inside_diameter,
              outside_diameter: articleDimensions.outside_diameter,
            }
          : null,
        tolerance
      );

      return clientMatch && dimensionMatch;
    });

    const ofids = matches
      .map((row) => row.ofid)
      .filter((ofid) => ofid !== null && ofid !== undefined)
      .map((ofid) => String(ofid));

    if (ofids.length === 0) {
      return NextResponse.json({ status: "NO_MATCH", ofids: [] }, { status: 200 });
    }

    if (ofids.length === 1) {
      return NextResponse.json(
        { status: "SINGLE_MATCH", ofid: ofids[0] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: "MULTIPLE_MATCHES", ofids },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
