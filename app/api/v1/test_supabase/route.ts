import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint to check Supabase connection
 * GET /api/v1/test_supabase
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const results: any = {
      timestamp: new Date().toISOString(),
      anon_client: {},
      admin_client: {},
    };

    // Test anon client - try to query a simple table
    try {
      const { data: ordersData, error: ordersError, count: ordersCount } = await supabase
        .from("tbl_orders_form")
        .select("id", { count: "exact" })
        .limit(1);

      results.anon_client.orders_table = {
        accessible: !ordersError,
        error: ordersError?.message || null,
        count: ordersCount || 0,
        sample_data: ordersData || null,
      };
    } catch (err: any) {
      results.anon_client.orders_table = {
        accessible: false,
        error: err.message,
      };
    }

    // Test admin client - try to query production table
    try {
      const { data: prodData, error: prodError, count: prodCount } = await adminSupabase
        .from("tbl_enregistrements_prod")
        .select("ofid", { count: "exact" })
        .limit(5);

      results.admin_client.production_table = {
        accessible: !prodError,
        error: prodError?.message || null,
        count: prodCount || 0,
        sample_ofids: prodData?.map((r: any) => r.ofid) || [],
      };
    } catch (err: any) {
      results.admin_client.production_table = {
        accessible: false,
        error: err.message,
      };
    }

    // Test admin client - try to query articles table
    try {
      const { data: articleData, error: articleError, count: articleCount } = await adminSupabase
        .from("tbl_article")
        .select("id, article_name", { count: "exact" })
        .limit(5);

      results.admin_client.articles_table = {
        accessible: !articleError,
        error: articleError?.message || null,
        count: articleCount || 0,
        sample_articles: articleData?.map((r: any) => ({
          id: r.id,
          article_name: r.article_name,
        })) || [],
      };
    } catch (err: any) {
      results.admin_client.articles_table = {
        accessible: false,
        error: err.message,
      };
    }

    // Test specific OFID query
    try {
      const { data: ofidData, error: ofidError } = await adminSupabase
        .from("tbl_enregistrements_prod")
        .select("ofid, client, length, inside_diameter, outside_diameter")
        .eq("ofid", 910825)
        .limit(1);

      results.admin_client.ofid_910825_query = {
        found: !ofidError && ofidData && ofidData.length > 0,
        error: ofidError?.message || null,
        data: ofidData?.[0] || null,
      };
    } catch (err: any) {
      results.admin_client.ofid_910825_query = {
        found: false,
        error: err.message,
      };
    }

    // Overall status
    const allAccessible =
      results.anon_client.orders_table?.accessible &&
      results.admin_client.production_table?.accessible &&
      results.admin_client.articles_table?.accessible;

    return NextResponse.json(
      {
        status: allAccessible ? "✅ Connected" : "⚠️ Partial Connection",
        ...results,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "❌ Connection Failed",
        error: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}


