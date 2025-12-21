/**
 * Script to test OFID resolution
 * Usage: npx tsx scripts/test_ofid.ts 910825
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✅" : "❌");
  console.error("   NEXT_PUBLIC_SUPABASE_ANON_KEY:", SUPABASE_ANON_KEY ? "✅" : "❌");
  console.error("\nPlease set these in your .env.local file");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testOFID(ofid: string) {
  console.log(`\n🔍 Testing OFID: ${ofid}\n`);
  console.log("=".repeat(60));

  try {
    // Step 1: Find order with this OFID
    console.log("\n📋 Step 1: Finding order with OFID...");
    const { data: orders, error: orderError } = await supabase
      .from("tbl_orders_form")
      .select("id, order_fabrication_control, created_at")
      .eq("order_fabrication_control", ofid)
      .limit(1);

    if (orderError) {
      console.error("❌ Error:", orderError.message);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log(`❌ No order found with OFID: ${ofid}`);
      
      // Check for similar OFIDs
      const { data: similarOrders } = await supabase
        .from("tbl_orders_form")
        .select("id, order_fabrication_control")
        .ilike("order_fabrication_control", `%${ofid}%`)
        .limit(5);
      
      if (similarOrders && similarOrders.length > 0) {
        console.log("\n📋 Similar OFIDs found:");
        similarOrders.forEach((o) => {
          console.log(`   Order ID: ${o.id}, OFID: ${o.order_fabrication_control}`);
        });
      }
      return;
    }

    const order = orders[0];
    console.log(`✅ Found order:`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   OFID: ${order.order_fabrication_control}`);
    console.log(`   Created: ${order.created_at}`);

    // Step 2: Check production records
    console.log(`\n📋 Step 2: Checking production records...`);
    const { data: prodRecords, error: prodError } = await supabase
      .from("tbl_enregistrements_prod")
      .select("client, length, inside_diameter, outside_diameter")
      .eq("ofid", ofid);

    if (prodError) {
      console.error("❌ Error:", prodError.message);
      return;
    }

    if (!prodRecords || prodRecords.length === 0) {
      console.log("⚠️  No production records found for this OFID");
    } else {
      console.log(`✅ Found ${prodRecords.length} production record(s):`);
      prodRecords.forEach((prod, idx) => {
        console.log(`\n   Record ${idx + 1}:`);
        console.log(`   Client: ${prod.client || "(null)"}`);
        console.log(`   Length: ${prod.length || "(null)"}`);
        console.log(`   Inside Diameter: ${prod.inside_diameter || "(null)"}`);
        console.log(`   Outside Diameter: ${prod.outside_diameter || "(null)"}`);
      });
    }

    // Step 3: Find candidate articles (if we have a client)
    if (prodRecords && prodRecords.length > 0 && prodRecords[0].client) {
      const client = prodRecords[0].client;
      console.log(`\n📋 Step 3: Finding articles matching client: "${client}"`);
      
      // Normalize client for matching
      const normalizedClient = client
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();

      const { data: articles, error: articleError } = await supabase
        .from("tbl_article")
        .select("article_name, designated_article")
        .limit(1000); // Get a reasonable number

      if (articleError) {
        console.error("❌ Error fetching articles:", articleError.message);
        return;
      }

      // Filter articles
      const candidates = (articles || []).filter((article) => {
        if (!article.article_name) return false;
        const normalizedName = article.article_name
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .trim();
        return normalizedName.includes(normalizedClient);
      });

      console.log(`✅ Found ${candidates.length} candidate article(s):`);
      if (candidates.length > 0) {
        candidates.slice(0, 10).forEach((article, idx) => {
          console.log(`\n   ${idx + 1}. ${article.article_name}`);
          console.log(`      Designated: ${article.designated_article || "(null)"}`);
        });
        if (candidates.length > 10) {
          console.log(`   ... and ${candidates.length - 10} more`);
        }
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`OFID: ${ofid}`);
    console.log(`Order ID: ${order.id}`);
    console.log(`Production Records: ${prodRecords?.length || 0}`);
    if (prodRecords && prodRecords.length > 0) {
      console.log(`Client: ${prodRecords[0].client || "(null)"}`);
    }
    console.log("=".repeat(60));
    console.log(`\n💡 To test the full resolver endpoint, use:`);
    console.log(`   http://localhost:3000/api/v1/resolve_designated_article?order_id=${order.id}`);
    console.log("");

  } catch (error: any) {
    console.error("❌ Unexpected error:", error.message);
    console.error(error.stack);
  }
}

// Get OFID from command line
const ofid = process.argv[2] || "910825";
testOFID(ofid);

