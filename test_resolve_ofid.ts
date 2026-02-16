/**
 * Test script to find order_id for a given OFID and test the resolver endpoint
 */

import { createClient } from "./utils/supabase/server";

async function testOFID(ofid: string) {
  console.log(`\n🔍 Testing OFID: ${ofid}\n`);

  try {
    const supabase = await createClient();

    // First, find an order with this OFID
    console.log("Step 1: Finding order with OFID...");
    const { data: orders, error: orderError } = await supabase
      .from("tbl_orders_form")
      .select("id, order_fabrication_control")
      .eq("order_fabrication_control", ofid)
      .limit(1);

    if (orderError) {
      console.error("❌ Error finding order:", orderError.message);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log(`❌ No order found with OFID: ${ofid}`);
      
      // Check if there are any orders with similar OFID
      const { data: similarOrders } = await supabase
        .from("tbl_orders_form")
        .select("id, order_fabrication_control")
        .ilike("order_fabrication_control", `%${ofid}%`)
        .limit(5);
      
      if (similarOrders && similarOrders.length > 0) {
        console.log("\n📋 Similar OFIDs found:");
        similarOrders.forEach((o) => {
          console.log(`  - Order ID: ${o.id}, OFID: ${o.order_fabrication_control}`);
        });
      }
      return;
    }

    const order = orders[0];
    console.log(`✅ Found order: ID=${order.id}, OFID=${order.order_fabrication_control}\n`);

    // Now check production records
    console.log("Step 2: Checking production records...");
    const { data: prodRecords, error: prodError } = await supabase
      .from("tbl_enregistrements_prod")
      .select("client, length, inside_diameter, outside_diameter")
      .eq("ofid", ofid);

    if (prodError) {
      console.error("❌ Error fetching production records:", prodError.message);
      return;
    }

    if (!prodRecords || prodRecords.length === 0) {
      console.log("⚠️  No production records found for this OFID");
    } else {
      console.log(`✅ Found ${prodRecords.length} production record(s):`);
      prodRecords.forEach((prod, idx) => {
        console.log(`  Record ${idx + 1}:`, {
          client: prod.client,
          length: prod.length,
          inside_diameter: prod.inside_diameter,
          outside_diameter: prod.outside_diameter,
        });
      });
    }

    // Now test the resolver endpoint
    console.log(`\nStep 3: Testing resolver endpoint with order_id=${order.id}...\n`);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/v1/resolve_designated_article?order_id=${order.id}`;
    
    console.log(`📡 Calling: ${url}\n`);
    
    const response = await fetch(url);
    const data = await response.json();

    console.log("📊 Response Status:", response.status);
    console.log("📊 Response Data:");
    console.log(JSON.stringify(data, null, 2));

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📋 SUMMARY");
    console.log("=".repeat(60));
    console.log(`Status: ${data.status}`);
    console.log(`Production Record: ${data.production_record ? "✅ Found" : "❌ Not found"}`);
    console.log(`Candidates: ${data.candidates?.length || 0}`);
    console.log(`Dimension Matches: ${data.dimension_matches?.length || 0}`);
    if (data.resolved_article) {
      console.log(`Resolved Article: ✅ ${data.resolved_article.article_name}`);
    } else {
      console.log(`Resolved Article: ❌ None`);
    }
    console.log("=".repeat(60) + "\n");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }
}

// Run test
const ofid = process.argv[2] || "910825";
testOFID(ofid);





