import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import {
  normalizeText,
  matchDimensions,
} from "@/utils/parseDesignation";

/**
 * Test endpoint to resolve articles by OFID directly
 * GET /api/v1/test_resolve_by_ofid?ofid=<ofid>
 */
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
    // Try admin client for production records (may bypass RLS)
    const adminSupabase = await createAdminClient();

    // Step 1: Find order with this OFID (optional - proceed even if not found)
    const { data: orders, error: orderError } = await supabase
      .from("tbl_orders_form")
      .select("id, order_fabrication_control")
      .eq("order_fabrication_control", ofid)
      .limit(1);

    if (orderError) {
      console.warn("Error finding order (continuing anyway):", orderError.message);
    }

    const orderId = orders && orders.length > 0 ? orders[0].id : null;
    
    if (!orders || orders.length === 0) {
      console.log("No order found in tbl_orders_form, proceeding with production record lookup only");
    }

    // Step 2: Check production records
    // Convert to string for consistent text-to-text matching
    // order_fabrication_control and ofid are both text fields, so string matching is correct
    const ofidString = String(ofid);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/287291a4-0a7e-4e9f-90cb-e3c85c55c63f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test_resolve_by_ofid/route.ts:65',message:'OFID conversion',data:{originalOfid:ofid,ofidString:ofidString,ofidType:typeof ofid,ofidLength:ofidString.length,orderId:orderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Use admin client for production queries (bypasses RLS)
    const { data: prodRecords, error: prodError } = await adminSupabase
      .from("tbl_prod")
      .select("client, length_p, inside_diameter_p, outside_diameter_p")
      .eq("ofid", ofidString);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/287291a4-0a7e-4e9f-90cb-e3c85c55c63f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test_resolve_by_ofid/route.ts:72',message:'Production query result',data:{ofidString:ofidString,prodRecordsCount:prodRecords?.length||0,prodError:prodError?.message||null,hasRecords:!!prodRecords&&prodRecords.length>0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (prodError) {
      return NextResponse.json(
        { error: `Error fetching production: ${prodError.message}` },
        { status: 500 }
      );
    }

    if (!prodRecords || prodRecords.length === 0) {
      // #region agent log
      // Try alternative queries to debug formatting issues
      const { data: sampleOfids, error: sampleError } = await adminSupabase
        .from("tbl_prod")
        .select("ofid")
        .limit(10);
      
      // Check total count in table
      const { count: totalCount, error: countError } = await adminSupabase
        .from("tbl_prod")
        .select("*", { count: 'exact', head: true });
      
      const { data: trimmedMatch, error: trimmedError } = await adminSupabase
        .from("tbl_prod")
        .select("ofid, client, length_p, inside_diameter_p, outside_diameter_p")
        .ilike("ofid", `%${ofidString.trim()}%`);
      
      // Try exact match with trimmed values
      const { data: allRecords } = await adminSupabase
        .from("tbl_prod")
        .select("ofid, client, length_p, inside_diameter_p, outside_diameter_p")
        .limit(100);
      
      // Filter in memory for trimmed comparison
      const trimmedResults = allRecords?.filter(r => r.ofid && String(r.ofid).trim() === ofidString.trim()) || [];
      
      // Try numeric comparison if ofid can be converted to number
      const ofidNumber = Number(ofidString);
      const numericResults = !isNaN(ofidNumber) 
        ? allRecords?.filter(r => r.ofid && Number(r.ofid) === ofidNumber) || []
        : [];
      
      fetch('http://127.0.0.1:7243/ingest/287291a4-0a7e-4e9f-90cb-e3c85c55c63f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test_resolve_by_ofid/route.ts:88',message:'No production records - comprehensive debugging',data:{ofidString:ofidString,ofidStringTrimmed:ofidString.trim(),ofidNumber:ofidNumber,isNaN:isNaN(ofidNumber),sampleOfids:sampleOfids?.map(r=>String(r.ofid))||[],sampleOfidsCount:sampleOfids?.length||0,sampleError:sampleError?.message||null,totalCount:totalCount,countError:countError?.message||null,trimmedMatchCount:trimmedMatch?.length||0,trimmedError:trimmedError?.message||null,trimmedResultsCount:trimmedResults.length,trimmedResults:trimmedResults.map(r=>({ofid:String(r.ofid),ofidType:typeof r.ofid,ofidLength:String(r.ofid).length,client:r.client})),numericResultsCount:numericResults.length,numericResults:numericResults.map(r=>({ofid:String(r.ofid),ofidType:typeof r.ofid,client:r.client})),allRecordsSample:allRecords?.slice(0,5).map(r=>({ofid:String(r.ofid),ofidType:typeof r.ofid}))||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      return NextResponse.json(
        {
          ofid: ofid,
          order_id: orderId,
          production_records: [],
          matching_articles: [],
          message: "No production records found for this OFID",
          debug: {
            searchedOfid: ofidString,
            searchedOfidNumber: ofidNumber,
            sampleOfids: sampleOfids?.map(r => String(r.ofid)) || [],
            totalCount: totalCount,
            trimmedMatchCount: trimmedMatch?.length || 0,
            trimmedResultsCount: trimmedResults.length,
            numericResultsCount: numericResults.length,
            sampleErrors: {
              sampleError: sampleError?.message || null,
              countError: countError?.message || null,
              trimmedError: trimmedError?.message || null
            }
          }
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

    // Use the first production record
    // Ensure dimensions are numbers (convert from string if needed)
    const productionRecord = {
      client: prodRecords[0].client,
      length: parseNumber(prodRecords[0].length_p),
      inside_diameter: parseNumber(prodRecords[0].inside_diameter_p),
      outside_diameter: parseNumber(prodRecords[0].outside_diameter_p),
    };

    if (!productionRecord.client) {
      return NextResponse.json(
        {
          ofid: ofid,
          order_id: orderId,
          production_records: [productionRecord],
          matching_articles: [],
          message: "Production record has no client value",
        },
        { status: 200 }
      );
    }

    // Step 3: Find articles matching client keyword
    const normalizedClient = normalizeText(productionRecord.client);
    
    // Query tbl_article_prod instead of tbl_article (paginate to fetch all rows)
    const pageSize = 1000;
    let articleData: any[] = [];
    let offset = 0;
    while (true) {
      const { data: articlePage, error: articleError } = await adminSupabase
        .from("tbl_article_prod")
        .select("id, article_name, designation_article, inside_diameter, outside_diameter, length, length_min, length_max, inside_diameter_min, inside_diameter_max, outside_diameter_min, outside_diameter_max, resistance_min, resistance_max, humidty_min, humidity_max")
        .range(offset, offset + pageSize - 1);

      if (articleError) {
        return NextResponse.json(
          { error: `Error fetching articles: ${articleError.message}` },
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
    const parseLength = (lengthValue: string | null | undefined): number | null =>
      parseNumber(lengthValue);

    // Filter articles by client keyword
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
          id: article.id,
          article_name: article.article_name,
          designation_article: article.designation_article,
          // Direct dimensions from tbl_article_prod
          length: articleLength,
          inside_diameter: parseNumber(article.inside_diameter),
          outside_diameter: parseNumber(article.outside_diameter),
          // Keep all fields for specs building
          original_article: article,
        };
      });

    // Debug: Log what we're matching
    console.log("Client matching debug:", {
      productionClient: productionRecord.client,
      normalizedClient: normalizedClient,
      clientWords: clientWords,
      totalArticles: articleData?.length || 0,
      candidatesFound: candidates.length,
      sampleArticleNames: candidates.slice(0, 3).map(c => ({
        article_name: c.article_name,
        normalized: normalizeText(c.article_name),
      })),
    });

    // If no candidates found by client matching, fall back to dimension-only matching
    if (candidates.length === 0) {
      console.log("No client matches found, falling back to dimension-only matching");
      
      // Use all articles with valid dimensions for dimension matching
      candidates = (articleData || [])
        .map((article) => {
          const articleLength = parseLength(article.length);
          
          return {
            id: article.id,
            article_name: article.article_name,
            designation_article: article.designation_article,
            length: articleLength,
            inside_diameter: parseNumber(article.inside_diameter),
            outside_diameter: parseNumber(article.outside_diameter),
            original_article: article,
          };
        })
        .filter((article) => {
          // Only include articles with all three dimensions
          return article.length !== null && 
                 article.inside_diameter !== null && 
                 article.outside_diameter !== null;
        });
      
      console.log("Dimension-only fallback:", {
        candidatesFound: candidates.length,
        sampleCandidates: candidates.slice(0, 3).map(c => ({
          id: c.id,
          article_name: c.article_name,
          dimensions: {
            length: c.length,
            inside_diameter: c.inside_diameter,
            outside_diameter: c.outside_diameter,
          },
        })),
      });
    }

    // Step 4: Match dimensions using direct values from tbl_article_prod
    const tolerance = 0.9;

    // Debug: Check why articles aren't matching
    // Sample some article names to see the format
    const sampleArticleNames = (articleData || [])
      .slice(0, 20)
      .map(a => ({
        article_name: a.article_name,
        normalized: normalizeText(a.article_name),
      }))
      .filter(a => a.article_name); // Only non-null names

    // Also check if any articles contain "dupont" or "typar" separately
    const articlesWithDupont = (articleData || [])
      .filter(a => a.article_name && normalizeText(a.article_name).includes("dupont"))
      .slice(0, 5)
      .map(a => ({
        article_name: a.article_name,
        normalized: normalizeText(a.article_name),
      }));
    
    const articlesWithTypar = (articleData || [])
      .filter(a => a.article_name && normalizeText(a.article_name).includes("typar"))
      .slice(0, 5)
      .map(a => ({
        article_name: a.article_name,
        normalized: normalizeText(a.article_name),
      }));

    const debugInfo = {
      normalized_client: normalizedClient,
      original_client: productionRecord.client,
      total_articles: articleData?.length || 0,
      candidate_count: candidates.length,
      candidates_with_valid_dimensions: candidates.filter(c => 
        c.length !== null && 
        c.inside_diameter !== null && 
        c.outside_diameter !== null
      ).length,
      sample_article_names: sampleArticleNames,
      articles_with_dupont: articlesWithDupont,
      articles_with_typar: articlesWithTypar,
      candidate_details: candidates.slice(0, 10).map(c => {
        const prod = productionRecord;
        const lengthDiff = prod.length && c.length ? Math.abs(prod.length - c.length) : null;
        const insideDiff = prod.inside_diameter && c.inside_diameter ? Math.abs(prod.inside_diameter - c.inside_diameter) : null;
        const outsideDiff = prod.outside_diameter && c.outside_diameter ? Math.abs(prod.outside_diameter - c.outside_diameter) : null;
        return {
          id: c.id,
          article_name: c.article_name,
          designation_article: c.designation_article,
          article_dimensions: {
            length: c.length,
            inside_diameter: c.inside_diameter,
            outside_diameter: c.outside_diameter,
          },
          dimension_match: {
            length_match: lengthDiff !== null && lengthDiff <= tolerance,
            length_diff: lengthDiff,
            inside_match: insideDiff !== null && insideDiff <= tolerance,
            inside_diff: insideDiff,
            outside_match: outsideDiff !== null && outsideDiff <= tolerance,
            outside_diff: outsideDiff,
            all_match: lengthDiff !== null && lengthDiff <= tolerance &&
                      insideDiff !== null && insideDiff <= tolerance &&
                      outsideDiff !== null && outsideDiff <= tolerance
          }
        };
      })
    };

    // Debug: Log production record dimensions
    console.log("Production record dimensions:", {
      length: productionRecord.length,
      lengthType: typeof productionRecord.length,
      inside_diameter: productionRecord.inside_diameter,
      inside_diameterType: typeof productionRecord.inside_diameter,
      outside_diameter: productionRecord.outside_diameter,
      outside_diameterType: typeof productionRecord.outside_diameter,
    });

    const withinTolerance = (
      value: number | null | undefined,
      target: number,
      tol: number
    ) => {
      if (value === null || value === undefined || isNaN(value)) {
        return false;
      }
      return Math.abs(value - target) <= tol;
    };

    const matchesByLengthInside = (
      prod: { length?: number | null; inside_diameter?: number | null },
      candidate: { length: number; inside_diameter: number },
      tol: number
    ) =>
      withinTolerance(prod.length, candidate.length, tol) &&
      withinTolerance(prod.inside_diameter, candidate.inside_diameter, tol);

    const usePartialMatch =
      productionRecord.outside_diameter === null ||
      productionRecord.outside_diameter === undefined;

    // Match articles using direct dimensions from tbl_article_prod
    const matchingArticles = candidates
      .filter((candidate) => {
        // All dimensions must be present and valid
        if (candidate.length === null || 
            candidate.inside_diameter === null || 
            candidate.outside_diameter === null) {
          console.log("Candidate filtered out - missing dimensions:", {
            id: candidate.id,
            length: candidate.length,
            inside_diameter: candidate.inside_diameter,
            outside_diameter: candidate.outside_diameter,
          });
          return false;
        }
        
        // Debug: Log dimension comparison
        const lengthDiff = productionRecord.length && candidate.length 
          ? Math.abs(productionRecord.length - candidate.length) 
          : null;
        const insideDiff = productionRecord.inside_diameter && candidate.inside_diameter
          ? Math.abs(productionRecord.inside_diameter - candidate.inside_diameter)
          : null;
        const outsideDiff = productionRecord.outside_diameter && candidate.outside_diameter
          ? Math.abs(productionRecord.outside_diameter - candidate.outside_diameter)
          : null;
        
        const matches = usePartialMatch
          ? matchesByLengthInside(
              productionRecord,
              {
                length: candidate.length,
                inside_diameter: candidate.inside_diameter,
              },
              tolerance
            )
          : matchDimensions(
              productionRecord,
              {
                length: candidate.length,
                inside_diameter: candidate.inside_diameter,
                outside_diameter: candidate.outside_diameter,
              },
              tolerance
            );
        
        if (!matches) {
          console.log("Candidate dimension mismatch:", {
            id: candidate.id,
            article_name: candidate.article_name,
            prod: {
              length: productionRecord.length,
              inside: productionRecord.inside_diameter,
              outside: productionRecord.outside_diameter,
            },
            article: {
              length: candidate.length,
              inside: candidate.inside_diameter,
              outside: candidate.outside_diameter,
            },
            diffs: {
              length: lengthDiff,
              inside: insideDiff,
              outside: outsideDiff,
            },
            tolerance: tolerance,
          });
        }
        
        return matches;
      })
      .map((match) => ({
        id: match.id,
        article_name: match.article_name,
        designated_article: match.designation_article, // Map designation_article to designated_article for frontend compatibility
        designation_article: match.designation_article, // Keep both for compatibility
        // Include dimensions for reference
        length: match.length,
        inside_diameter: match.inside_diameter,
        outside_diameter: match.outside_diameter,
        original_article: match.original_article,
      }));

    // Step 5: Build customer specifications from tbl_article_prod directly
    // The specs are already in tbl_article_prod, no need to fetch from other tables
    const articlesWithSpecs = matchingArticles.map((article) => {
      const originalArticle = article.original_article;
      
      if (!originalArticle) {
        return {
          ...article,
          customer_specifications: {
            nominal: null,
            min: null,
            max: null,
          },
        };
      }

      // Build specs from tbl_article_prod fields
      const specs = {
        nominal: {
          length: parseLength(originalArticle.length),
          inside_diameter: originalArticle.inside_diameter,
          outside_diameter: originalArticle.outside_diameter,
          // Calculate nominal for resistance and humidity if min/max exist
          resistance: originalArticle.resistance_min && originalArticle.resistance_max
            ? (parseFloat(String(originalArticle.resistance_min).replace(/,/g, "")) + 
               parseFloat(String(originalArticle.resistance_max).replace(/,/g, ""))) / 2
            : null,
          humidity: originalArticle.humidty_min && originalArticle.humidity_max
            ? (parseFloat(String(originalArticle.humidty_min).replace(/,/g, "")) + 
               parseFloat(String(originalArticle.humidity_max).replace(/,/g, ""))) / 2
            : null,
        },
        min: {
          length: parseLength(originalArticle.length_min),
          inside_diameter: originalArticle.inside_diameter_min,
          outside_diameter: originalArticle.outside_diameter_min,
          resistance: originalArticle.resistance_min 
            ? parseFloat(String(originalArticle.resistance_min).replace(/,/g, ""))
            : null,
          humidity: originalArticle.humidty_min
            ? parseFloat(String(originalArticle.humidty_min).replace(/,/g, ""))
            : null,
        },
        max: {
          length: parseLength(originalArticle.length_max),
          inside_diameter: originalArticle.inside_diameter_max,
          outside_diameter: originalArticle.outside_diameter_max,
          resistance: originalArticle.resistance_max
            ? parseFloat(String(originalArticle.resistance_max).replace(/,/g, ""))
            : null,
          humidity: originalArticle.humidity_max || null,
        },
      };

      return {
        ...article,
        customer_specifications: specs,
      };
    });

    // Final summary log
    console.log("Final matching summary:", {
      ofid: ofid,
      productionDimensions: {
        length: productionRecord.length,
        inside_diameter: productionRecord.inside_diameter,
        outside_diameter: productionRecord.outside_diameter,
      },
      candidatesCount: candidates.length,
      matchingArticlesCount: matchingArticles.length,
      finalArticlesWithSpecsCount: articlesWithSpecs.length,
      sampleMatchingArticles: matchingArticles.slice(0, 3).map(m => ({
        id: m.id,
        article_name: m.article_name,
        dimensions: {
          length: m.length,
          inside_diameter: m.inside_diameter,
          outside_diameter: m.outside_diameter,
        },
      })),
    });

    return NextResponse.json(
      {
        ofid: ofid,
        order_id: orderId || null,
        production_record: {
          client: productionRecord.client,
          length: productionRecord.length,
          inside_diameter: productionRecord.inside_diameter,
          outside_diameter: productionRecord.outside_diameter,
        },
        matching_articles: articlesWithSpecs,
        match_count: articlesWithSpecs.length,
        debug: {
          ...debugInfo,
          production_dimensions: {
            length: productionRecord.length,
            inside_diameter: productionRecord.inside_diameter,
            outside_diameter: productionRecord.outside_diameter,
          },
          matching_articles_count: matchingArticles.length,
          final_articles_count: articlesWithSpecs.length,
          order_found: orderId !== null,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Internal error: ${err.message}` },
      { status: 500 }
    );
  }
}

