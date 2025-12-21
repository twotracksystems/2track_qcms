import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import {
  normalizeText,
  parseDesignation,
  matchDimensions,
} from "@/utils/parseDesignation";

/**
 * Status types for the resolver
 */
type ResolverStatus =
  | "NO_PROD_RECORD"
  | "NO_CLIENT_MATCH"
  | "NO_DIMENSION_MATCH"
  | "SINGLE_MATCH"
  | "MULTIPLE_MATCHES";

/**
 * Endpoint: GET /api/v1/resolve_designated_article
 * 
 * Full resolver for designated_article during "Download order".
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const orderId = req.nextUrl.searchParams.get("order_id");
  const toleranceParam = req.nextUrl.searchParams.get("tolerance");
  const tolerance = toleranceParam ? parseFloat(toleranceParam) : 0.01;

  // Logging helper (safe, no huge payloads)
  const log = (step: string, data: any) => {
    const safeData = JSON.stringify(data, (key, value) => {
      if (typeof value === "string" && value.length > 100) {
        return value.substring(0, 100) + "...";
      }
      return value;
    });
    console.log(`[resolve_designated_article] ${step}:`, safeData);
  };

  try {
    if (!orderId) {
      return NextResponse.json(
        { error: "order_id parameter is required" },
        { status: 400 }
      );
    }

    log("START", { order_id: orderId, tolerance });

    const supabase = await createClient();
    // Use admin client for production records (may bypass RLS)
    const adminSupabase = await createAdminClient();

    // Step 1: order → OFID
    log("STEP_1", { action: "Fetching order_fabrication_control" });
    const { data: orderData, error: orderError } = await supabase
      .from("tbl_orders_form")
      .select("order_fabrication_control")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      log("STEP_1_ERROR", { error: orderError?.message || "Order not found" });
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const orderFabricationControl = orderData.order_fabrication_control;
    if (!orderFabricationControl) {
      log("STEP_1_ERROR", { error: "No order_fabrication_control value" });
      return NextResponse.json(
        {
          status: "NO_PROD_RECORD" as ResolverStatus,
          production_record: null,
          candidates: [],
          dimension_matches: [],
          resolved_article: null,
        },
        { status: 200 }
      );
    }

    log("STEP_1_SUCCESS", { ofid: orderFabricationControl });

    // Step 2: OFID → production record(s)
    log("STEP_2", { action: "Fetching production records", ofid: orderFabricationControl });
    // Convert both to string for consistent text-to-text matching
    // order_fabrication_control and ofid are both text fields, so string matching is correct
    const ofidString = String(orderFabricationControl);
    log("STEP_2_CONVERSION", { original: orderFabricationControl, asString: ofidString });
    
    // Use admin client for production records (bypasses RLS)
    const { data: productionData, error: productionError } = await adminSupabase
      .from("tbl_enregistrements_prod")
      .select("client, length, inside_diameter, outside_diameter")
      .eq("ofid", ofidString);

    if (productionError) {
      log("STEP_2_ERROR", { error: productionError.message });
      return NextResponse.json(
        { error: `Failed to fetch production data: ${productionError.message}` },
        { status: 500 }
      );
    }

    if (!productionData || productionData.length === 0) {
      log("STEP_2_NO_RECORDS", { ofid: orderFabricationControl, ofidString });
      return NextResponse.json(
        {
          status: "NO_PROD_RECORD" as ResolverStatus,
          production_record: null,
          candidates: [],
          dimension_matches: [],
          resolved_article: null,
        },
        { status: 200 }
      );
    }

    // Use the first production record
    const productionRecord = {
      client: productionData[0].client,
      length: productionData[0].length,
      inside_diameter: productionData[0].inside_diameter,
      outside_diameter: productionData[0].outside_diameter,
    };

    log("STEP_2_SUCCESS", {
      records_found: productionData.length,
      client: productionRecord.client,
      dimensions: {
        length: productionRecord.length,
        inside_diameter: productionRecord.inside_diameter,
        outside_diameter: productionRecord.outside_diameter,
      },
    });

    // Step 3: client keyword match → candidate articles
    if (!productionRecord.client) {
      log("STEP_3_NO_CLIENT", {});
      return NextResponse.json(
        {
          status: "NO_CLIENT_MATCH" as ResolverStatus,
          production_record: productionRecord,
          candidates: [],
          dimension_matches: [],
          resolved_article: null,
        },
        { status: 200 }
      );
    }

    log("STEP_3", {
      action: "Matching articles by client keyword",
      client: productionRecord.client,
    });

    // Normalize client for matching
    const normalizedClient = normalizeText(productionRecord.client);
    log("STEP_3_NORMALIZED", { normalized_client: normalizedClient });

    // Fetch all articles
    const { data: articleData, error: articleError } = await supabase
      .from("tbl_article")
      .select("article_name, designated_article");

    if (articleError) {
      log("STEP_3_ERROR", { error: articleError.message });
      return NextResponse.json(
        { error: `Failed to fetch articles: ${articleError.message}` },
        { status: 500 }
      );
    }

    // Filter articles where normalized article_name contains normalized client
    const candidates = (articleData || [])
      .filter((article) => {
        if (!article.article_name) return false;
        const normalizedName = normalizeText(article.article_name);
        return normalizedName.includes(normalizedClient);
      })
      .map((article) => ({
        article_name: article.article_name,
        designated_article: article.designated_article,
      }));

    log("STEP_3_SUCCESS", {
      candidates_found: candidates.length,
      candidate_names: candidates.map((c) => c.article_name).slice(0, 5),
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          status: "NO_CLIENT_MATCH" as ResolverStatus,
          production_record: productionRecord,
          candidates: [],
          dimension_matches: [],
          resolved_article: null,
        },
        { status: 200 }
      );
    }

    // Step 4: parse each candidate designated_article
    log("STEP_4", {
      action: "Parsing designated_article for each candidate",
      candidates_count: candidates.length,
    });

    const candidatesWithParsed = candidates.map((candidate) => {
      const parsed = parseDesignation(candidate.designated_article);
      return {
        ...candidate,
        parsed_dimensions: parsed,
      };
    });

    const parseableCount = candidatesWithParsed.filter(
      (c) => c.parsed_dimensions !== null
    ).length;
    log("STEP_4_SUCCESS", {
      parseable: parseableCount,
      unparseable: candidates.length - parseableCount,
    });

    // Step 5: dimension-match using tolerance
    log("STEP_5", {
      action: "Matching dimensions with tolerance",
      tolerance,
      production_dimensions: {
        length: productionRecord.length,
        inside_diameter: productionRecord.inside_diameter,
        outside_diameter: productionRecord.outside_diameter,
      },
    });

    const dimensionMatches = candidatesWithParsed.filter((candidate) => {
      if (!candidate.parsed_dimensions) return false;
      return matchDimensions(productionRecord, candidate.parsed_dimensions, tolerance);
    });

    log("STEP_5_SUCCESS", {
      dimension_matches: dimensionMatches.length,
      matches: dimensionMatches.map((m) => ({
        article_name: m.article_name,
        dimensions: m.parsed_dimensions,
      })),
    });

    // Determine status and build response
    let status: ResolverStatus;
    let resolvedArticle: { article_name: string; designated_article: string } | null = null;

    if (dimensionMatches.length === 0) {
      status = "NO_DIMENSION_MATCH";
    } else if (dimensionMatches.length === 1) {
      status = "SINGLE_MATCH";
      resolvedArticle = {
        article_name: dimensionMatches[0].article_name,
        designated_article: dimensionMatches[0].designated_article,
      };
    } else {
      status = "MULTIPLE_MATCHES";
    }

    const response = {
      status,
      production_record: productionRecord,
      candidates: candidatesWithParsed.map((c) => ({
        article_name: c.article_name,
        designated_article: c.designated_article,
        parsed_dimensions: c.parsed_dimensions,
      })),
      dimension_matches: dimensionMatches.map((m) => ({
        article_name: m.article_name,
        designated_article: m.designated_article,
        parsed_dimensions: m.parsed_dimensions,
      })),
      resolved_article: resolvedArticle,
    };

    const duration = Date.now() - startTime;
    log("COMPLETE", {
      status,
      duration_ms: duration,
      candidates_count: candidates.length,
      dimension_matches_count: dimensionMatches.length,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    log("ERROR", { error: err.message, stack: err.stack });
    return NextResponse.json(
      { error: `Internal server error: ${err.message}` },
      { status: 500 }
    );
  }
}
