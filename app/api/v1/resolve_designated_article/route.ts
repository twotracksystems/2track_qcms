import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import {
  normalizeText,
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
      .from("tbl_prod")
      .select("client, length_p, inside_diameter_p, outside_diameter_p")
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

    // Helper to parse numeric fields that might be strings (with commas)
    const parseNumber = (value: string | number | null | undefined): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === "number") return isNaN(value) ? null : value;
      const cleaned = String(value).replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    };

    // Use the first production record and normalize numeric fields
    const productionRecord = {
      client: productionData[0].client,
      length: parseNumber(productionData[0].length_p),
      inside_diameter: parseNumber(productionData[0].inside_diameter_p),
      outside_diameter: parseNumber(productionData[0].outside_diameter_p),
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

    // Query tbl_article_prod instead of tbl_article (paginate to fetch all rows)
    const pageSize = 1000;
    let articleData: any[] = [];
    let offset = 0;
    while (true) {
      const { data: articlePage, error: articleError } = await adminSupabase
        .from("tbl_article_prod")
        .select("id, article_name, designation_article, inside_diameter, outside_diameter, length")
        .range(offset, offset + pageSize - 1);

      if (articleError) {
        log("STEP_3_ERROR", { error: articleError.message });
        return NextResponse.json(
          { error: `Failed to fetch articles: ${articleError.message}` },
          { status: 500 }
        );
      }

      if (!articlePage || articlePage.length === 0) {
        break;
      }

      articleData.push(...articlePage);
      if (articlePage.length < pageSize) {
        break;
      }
      offset += pageSize;
    }

    // Helper function to parse length from text (handles commas like "2,060.00")
    const parseLength = (lengthValue: string | null | undefined): number | null => {
      if (!lengthValue) return null;
      // Remove commas and parse
      const cleaned = String(lengthValue).replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    };

    // Filter articles where normalized article_name contains normalized client
    // Use more flexible matching: split client into words and match if article contains any significant word
    // Also try the original exact match for backwards compatibility
    const clientWords = normalizedClient.split(/\s+/).filter(w => w.length > 2); // Filter out short words like "de", "le", etc.
    let candidates = (articleData || [])
      .filter((article) => {
        if (!article.article_name) return false;
        const normalizedName = normalizeText(article.article_name);
        
        // Strategy 1: Exact match (original behavior)
        if (normalizedName.includes(normalizedClient)) {
          return true;
        }
        
        // Strategy 2: Match if article name contains any significant word from client
        // This handles cases like "DUPONT TYPAR" vs "DUPONT DE NEMOURS"
        // where "DUPONT" is the common keyword
        if (clientWords.length > 0) {
          const hasSignificantMatch = clientWords.some(word => 
            normalizedName.includes(word) && word.length >= 3
          );
          if (hasSignificantMatch) {
            return true;
          }
        }
        
        // Strategy 3: Reverse match - check if client contains words from article name
        // This handles cases where article might have more specific name
        const articleWords = normalizedName.split(/\s+/).filter(w => w.length > 2);
        if (articleWords.length > 0) {
          const hasReverseMatch = articleWords.some(word => 
            normalizedClient.includes(word) && word.length >= 3
          );
          if (hasReverseMatch) {
            return true;
          }
        }
        
        return false;
      })
      .map((article) => {
        // Use direct dimensions from tbl_article_prod
        const articleLength = parseLength(article.length);
        
        return {
          article_name: article.article_name,
          designation_article: article.designation_article,
          // Direct dimensions from tbl_article_prod
          length: articleLength,
          inside_diameter: article.inside_diameter,
          outside_diameter: article.outside_diameter,
        };
      });

    log("STEP_3_SUCCESS", {
      candidates_found: candidates.length,
      candidate_names: candidates.map((c) => c.article_name).slice(0, 5),
    });

    // If no candidates found by client matching, fall back to dimension-only matching
    if (candidates.length === 0) {
      log("STEP_3_FALLBACK", {
        message: "No client matches found, falling back to dimension-only matching",
        total_articles: articleData?.length || 0,
      });
      
      // Use all articles with valid dimensions for dimension matching
      candidates = (articleData || [])
        .map((article) => {
          const articleLength = parseLength(article.length);
          
          return {
            article_name: article.article_name,
            designation_article: article.designation_article,
            length: articleLength,
            inside_diameter: article.inside_diameter,
            outside_diameter: article.outside_diameter,
          };
        })
        .filter((article) => {
          // Only include articles with all three dimensions
          return article.length !== null && 
                 article.inside_diameter !== null && 
                 article.outside_diameter !== null;
        });
      
      log("STEP_3_FALLBACK_SUCCESS", {
        candidates_found: candidates.length,
        sample_candidates: candidates.slice(0, 3).map(c => ({
          article_name: c.article_name,
          dimensions: {
            length: c.length,
            inside_diameter: c.inside_diameter,
            outside_diameter: c.outside_diameter,
          },
        })),
      });
    }

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

    // Step 4: Use direct dimensions from tbl_article_prod (no parsing needed)
    log("STEP_4", {
      action: "Using direct dimensions from tbl_article_prod",
      candidates_count: candidates.length,
    });

    const candidatesWithParsed = candidates.map((candidate) => {
      // Use direct dimensions instead of parsing
      if (candidate.length === null || 
          candidate.inside_diameter === null || 
          candidate.outside_diameter === null) {
        return {
          ...candidate,
          parsed_dimensions: null,
        };
      }
      
      return {
        ...candidate,
        parsed_dimensions: {
          length: candidate.length,
          inside_diameter: candidate.inside_diameter,
          outside_diameter: candidate.outside_diameter,
        },
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
    let resolvedArticle: { article_name: string; designation_article: string } | null = null;

    if (dimensionMatches.length === 0) {
      status = "NO_DIMENSION_MATCH";
    } else if (dimensionMatches.length === 1) {
      status = "SINGLE_MATCH";
      resolvedArticle = {
        article_name: dimensionMatches[0].article_name,
        designation_article: dimensionMatches[0].designation_article,
      };
    } else {
      status = "MULTIPLE_MATCHES";
    }

    const response = {
      status,
      production_record: productionRecord,
      candidates: candidatesWithParsed.map((c) => ({
        article_name: c.article_name,
        designation_article: c.designation_article,
        parsed_dimensions: c.parsed_dimensions,
      })),
      dimension_matches: dimensionMatches.map((m) => ({
        article_name: m.article_name,
        designation_article: m.designation_article,
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
