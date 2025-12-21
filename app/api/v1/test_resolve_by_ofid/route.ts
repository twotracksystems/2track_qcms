import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import {
  normalizeText,
  parseDesignation,
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

    // Step 1: Find order with this OFID
    const { data: orders, error: orderError } = await supabase
      .from("tbl_orders_form")
      .select("id, order_fabrication_control")
      .eq("order_fabrication_control", ofid)
      .limit(1);

    if (orderError) {
      return NextResponse.json(
        { error: `Error finding order: ${orderError.message}` },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      // Check for similar OFIDs
      const { data: similarOrders } = await supabase
        .from("tbl_orders_form")
        .select("id, order_fabrication_control")
        .ilike("order_fabrication_control", `%${ofid}%`)
        .limit(5);

      return NextResponse.json(
        {
          error: `No order found with OFID: ${ofid}`,
          similar_ofids: similarOrders || [],
        },
        { status: 404 }
      );
    }

    const orderId = orders[0].id;

    // Step 2: Check production records
    // Convert to string for consistent text-to-text matching
    // order_fabrication_control and ofid are both text fields, so string matching is correct
    const ofidString = String(ofid);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/287291a4-0a7e-4e9f-90cb-e3c85c55c63f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test_resolve_by_ofid/route.ts:65',message:'OFID conversion',data:{originalOfid:ofid,ofidString:ofidString,ofidType:typeof ofid,ofidLength:ofidString.length,orderId:orderId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Use admin client for production queries (bypasses RLS)
    const { data: prodRecords, error: prodError } = await adminSupabase
      .from("tbl_enregistrements_prod")
      .select("client, length, inside_diameter, outside_diameter")
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
        .from("tbl_enregistrements_prod")
        .select("ofid")
        .limit(10);
      
      // Check total count in table
      const { count: totalCount, error: countError } = await adminSupabase
        .from("tbl_enregistrements_prod")
        .select("*", { count: 'exact', head: true });
      
      const { data: trimmedMatch, error: trimmedError } = await adminSupabase
        .from("tbl_enregistrements_prod")
        .select("ofid, client, length, inside_diameter, outside_diameter")
        .ilike("ofid", `%${ofidString.trim()}%`);
      
      // Try exact match with trimmed values
      const { data: allRecords } = await adminSupabase
        .from("tbl_enregistrements_prod")
        .select("ofid, client, length, inside_diameter, outside_diameter")
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

    // Use the first production record
    const productionRecord = prodRecords[0];

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
    
    const { data: articleData, error: articleError } = await adminSupabase
      .from("tbl_article")
      .select("id, article_name, designated_article, article_nominal, article_min, article_max");

    if (articleError) {
      return NextResponse.json(
        { error: `Error fetching articles: ${articleError.message}` },
        { status: 500 }
      );
    }

    // Filter articles by client keyword
    const candidates = (articleData || [])
      .filter((article) => {
        if (!article.article_name) return false;
        const normalizedName = normalizeText(article.article_name);
        return normalizedName.includes(normalizedClient);
      })
      .map((article) => ({
        id: article.id,
        article_name: article.article_name,
        designated_article: article.designated_article,
        article_nominal: article.article_nominal,
        article_min: article.article_min,
        article_max: article.article_max,
      }));

    // Step 4: Parse and match dimensions
    const tolerance = 0.01;
    const matchingArticles = candidates
      .map((candidate) => {
        const parsed = parseDesignation(candidate.designated_article);
        return {
          ...candidate,
          parsed_dimensions: parsed,
        };
      })
      .filter((candidate) => {
        if (!candidate.parsed_dimensions) return false;
        return matchDimensions(productionRecord, candidate.parsed_dimensions, tolerance);
      })
      .map((match) => ({
        id: match.id,
        article_name: match.article_name,
        designated_article: match.designated_article,
        article_nominal: match.article_nominal,
        article_min: match.article_min,
        article_max: match.article_max,
        parsed_dimensions: match.parsed_dimensions,
      }));

    // Step 5: Fetch customer specifications for each matching article
    const articlesWithSpecs = await Promise.all(
      matchingArticles.map(async (article) => {
        const specs = {
          nominal: null as any,
          min: null as any,
          max: null as any,
        };

        try {
          // Fetch nominal specifications
          if (article.article_nominal) {
            const { data: nominalData, error: nominalError } = await adminSupabase
              .from("tbl_article_nominal")
              .select("*")
              .eq("id", article.article_nominal)
              .single();
            
            if (!nominalError && nominalData) {
              specs.nominal = nominalData;
            }
          }

          // Fetch min specifications
          if (article.article_min) {
            const { data: minData, error: minError } = await adminSupabase
              .from("tbl_article_min")
              .select("*")
              .eq("id", article.article_min)
              .single();
            
            if (!minError && minData) {
              specs.min = minData;
            }
          }

          // Fetch max specifications
          if (article.article_max) {
            const { data: maxData, error: maxError } = await adminSupabase
              .from("tbl_article_max")
              .select("*")
              .eq("id", article.article_max)
              .single();
            
            if (!maxError && maxData) {
              specs.max = maxData;
            }
          }
        } catch (error) {
          console.error(`Error fetching specs for article ${article.id}:`, error);
        }

        return {
          ...article,
          customer_specifications: specs,
        };
      })
    );

    return NextResponse.json(
      {
        ofid: ofid,
        order_id: orderId,
        production_record: {
          client: productionRecord.client,
          length: productionRecord.length,
          inside_diameter: productionRecord.inside_diameter,
          outside_diameter: productionRecord.outside_diameter,
        },
        matching_articles: articlesWithSpecs,
        match_count: articlesWithSpecs.length,
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

