import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { normalizeText, matchDimensions } from "@/utils/parseDesignation";

/**
 * Test endpoint to debug OFID matching
 * GET /api/v1/test_ofid_matching?ofid=943951
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

    const adminSupabase = await createAdminClient();
    const ofidString = String(ofid);

    // Step 1: Get production record
    const { data: prodRecords, error: prodError } = await adminSupabase
      .from("tbl_enregistrements_prod")
      .select("client, length, inside_diameter, outside_diameter")
      .eq("ofid", ofidString);

    if (prodError || !prodRecords || prodRecords.length === 0) {
      return NextResponse.json({
        error: "No production record found",
        ofid: ofidString,
        prodError: prodError?.message,
      }, { status: 404 });
    }

    const productionRecord = {
      client: prodRecords[0].client,
      length: typeof prodRecords[0].length === 'string' 
        ? parseFloat(prodRecords[0].length.replace(/,/g, '')) 
        : prodRecords[0].length,
      inside_diameter: typeof prodRecords[0].inside_diameter === 'string'
        ? parseFloat(prodRecords[0].inside_diameter)
        : prodRecords[0].inside_diameter,
      outside_diameter: typeof prodRecords[0].outside_diameter === 'string'
        ? parseFloat(prodRecords[0].outside_diameter)
        : prodRecords[0].outside_diameter,
    };

    // Step 2: Get all articles
    const { data: articleData, error: articleError } = await adminSupabase
      .from("tbl_article_prod")
      .select("id, article_name, designation_article, inside_diameter, outside_diameter, length")
      .limit(1000);

    if (articleError) {
      return NextResponse.json({
        error: "Error fetching articles",
        articleError: articleError.message,
      }, { status: 500 });
    }

    // Helper to parse length
    const parseLength = (lengthValue: string | null | undefined): number | null => {
      if (!lengthValue) return null;
      const cleaned = String(lengthValue).replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    };

    // Step 3: Test client matching
    const normalizedClient = normalizeText(productionRecord.client);
    const clientWords = normalizedClient.split(/\s+/).filter(w => w.length > 2);
    
    const clientMatchedArticles = (articleData || [])
      .filter((article) => {
        if (!article.article_name) return false;
        const normalizedName = normalizeText(article.article_name);
        
        if (normalizedName.includes(normalizedClient)) return true;
        if (clientWords.some(word => normalizedName.includes(word) && word.length >= 3)) return true;
        
        const articleWords = normalizedName.split(/\s+/).filter(w => w.length > 2);
        if (articleWords.some(word => normalizedClient.includes(word) && word.length >= 3)) return true;
        
        return false;
      })
      .map((article) => ({
        id: article.id,
        article_name: article.article_name,
        designation_article: article.designation_article,
        length: parseLength(article.length),
        inside_diameter: article.inside_diameter,
        outside_diameter: article.outside_diameter,
      }));

    // Step 4: Test dimension matching with all articles
    const tolerance = 0.01;
    const allArticlesWithDimensions = (articleData || [])
      .map((article) => ({
        id: article.id,
        article_name: article.article_name,
        designation_article: article.designation_article,
        length: parseLength(article.length),
        inside_diameter: article.inside_diameter,
        outside_diameter: article.outside_diameter,
      }))
      .filter((article) => 
        article.length !== null && 
        article.inside_diameter !== null && 
        article.outside_diameter !== null
      );

    const dimensionMatchedArticles = allArticlesWithDimensions
      .filter((article) => {
        return matchDimensions(
          productionRecord,
          {
            length: article.length!,
            inside_diameter: article.inside_diameter!,
            outside_diameter: article.outside_diameter!,
          },
          tolerance
        );
      })
      .map((article) => {
        const lengthDiff = Math.abs(productionRecord.length! - article.length!);
        const insideDiff = Math.abs(productionRecord.inside_diameter! - article.inside_diameter!);
        const outsideDiff = Math.abs(productionRecord.outside_diameter! - article.outside_diameter!);
        
        return {
          ...article,
          dimension_diffs: {
            length: lengthDiff,
            inside_diameter: insideDiff,
            outside_diameter: outsideDiff,
          },
        };
      });

    // Step 5: Find articles that match both client AND dimensions
    const fullyMatchedArticles = clientMatchedArticles.filter((clientArticle) => {
      return dimensionMatchedArticles.some((dimArticle) => dimArticle.id === clientArticle.id);
    });

    return NextResponse.json({
      ofid: ofid,
      production_record: productionRecord,
      normalized_client: normalizedClient,
      client_words: clientWords,
      
      // Client matching results
      client_matching: {
        total_articles: articleData?.length || 0,
        matched_count: clientMatchedArticles.length,
        matched_articles: clientMatchedArticles.slice(0, 10).map(a => ({
          id: a.id,
          article_name: a.article_name,
          normalized_name: normalizeText(a.article_name),
        })),
      },
      
      // Dimension matching results
      dimension_matching: {
        total_with_dimensions: allArticlesWithDimensions.length,
        matched_count: dimensionMatchedArticles.length,
        matched_articles: dimensionMatchedArticles.slice(0, 10),
        tolerance: tolerance,
      },
      
      // Combined results
      fully_matched: {
        count: fullyMatchedArticles.length,
        articles: fullyMatchedArticles,
      },
      
      // Sample articles with same dimensions (for debugging)
      articles_with_same_dimensions: allArticlesWithDimensions
        .filter(a => 
          a.length === productionRecord.length &&
          a.inside_diameter === productionRecord.inside_diameter &&
          a.outside_diameter === productionRecord.outside_diameter
        )
        .slice(0, 10),
    }, { status: 200 });
    
  } catch (err: any) {
    return NextResponse.json(
      { error: `Internal error: ${err.message}`, stack: err.stack },
      { status: 500 }
    );
  }
}
