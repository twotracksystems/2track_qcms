import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ofid = await req.nextUrl.searchParams.get("ofid");

  if (!ofid) {
    return NextResponse.json(
      { error: "ofid parameter is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // ===== CONNECTION TEST: Test if we can connect to tbl_measurement_prod =====
  console.log("=".repeat(80));
  console.log("CONNECTION TEST: Testing connection to tbl_measurement_prod");
  console.log("=".repeat(80));
  
  try {
    // Test 1: Try to get total count (tests table access)
    const { count: totalCount, error: countError } = await supabase
      .from("tbl_measurement_prod")
      .select("*", { count: 'exact', head: true });
    
    console.log("Connection Test 1 - Total count query:", {
      success: !countError,
      totalCount: totalCount,
      error: countError?.message || null,
      errorCode: countError?.code || null,
      errorDetails: countError?.details || null,
    });

    // Test 2: Try to get a sample record (tests data retrieval)
    const { data: sampleData, error: sampleError } = await supabase
      .from("tbl_measurement_prod")
      .select("id, ofid, palette_num, import_datetime")
      .limit(5);
    
    console.log("Connection Test 2 - Sample records query:", {
      success: !sampleError,
      sampleCount: sampleData?.length || 0,
      sampleRecords: sampleData?.map(r => ({
        id: r.id,
        ofid: r.ofid,
        ofidType: typeof r.ofid,
        palette_num: r.palette_num,
      })) || [],
      error: sampleError?.message || null,
      errorCode: sampleError?.code || null,
    });

    // Test 3: Try to get column information (tests schema access)
    const { data: columnTest, error: columnError } = await supabase
      .from("tbl_measurement_prod")
      .select("id")
      .limit(1);
    
    console.log("Connection Test 3 - Column access test:", {
      success: !columnError,
      canAccessColumns: !columnError,
      error: columnError?.message || null,
    });

    // Test 4: Test connection to tbl_prod as well
    const { count: prodCount, error: prodCountError } = await supabase
      .from("tbl_prod")
      .select("*", { count: 'exact', head: true });
    
    console.log("Connection Test 4 - tbl_prod connection test:", {
      success: !prodCountError,
      totalCount: prodCount,
      error: prodCountError?.message || null,
    });

    // Summary
    const connectionStatus = {
      tbl_measurement_prod_accessible: !countError && !sampleError,
      tbl_prod_accessible: !prodCountError,
      totalRecordsInMeasurementProd: totalCount || 0,
      totalRecordsInProd: prodCount || 0,
      hasSampleData: sampleData && sampleData.length > 0,
    };

    console.log("=".repeat(80));
    console.log("CONNECTION TEST SUMMARY:", connectionStatus);
    console.log("=".repeat(80));
    
  } catch (connectionTestError: any) {
    console.error("=".repeat(80));
    console.error("CONNECTION TEST FAILED:", {
      error: connectionTestError?.message || "Unknown error",
      stack: connectionTestError?.stack || null,
    });
    console.error("=".repeat(80));
  }
  // ===== END CONNECTION TEST =====

  const trimmedOfid = ofid.trim();

  console.log("getonemeasurementprod - Searching for ofid:", {
    originalOfid: ofid,
    trimmedOfid: trimmedOfid,
    ofidType: typeof ofid,
    ofidLength: ofid.length,
    trimmedLength: trimmedOfid.length,
    hasWhitespace: ofid !== trimmedOfid,
  });

  // Query tbl_measurement_prod by ofid
  let { data, error } = await supabase
    .from("tbl_measurement_prod")
    .select("*")
    .eq("ofid", trimmedOfid)
    .order("palette_num", { ascending: true })
    .order("import_datetime", { ascending: true });

  console.log("getonemeasurementprod - Initial query result:", {
    searchedOfid: trimmedOfid,
    count: data?.length || 0,
    error: error?.message || null,
    errorCode: error?.code || null,
    hasData: !!data && data.length > 0,
  });

  // If no results, try alternative matching
  if ((!data || data.length === 0) && !error) {
    console.log("getonemeasurementprod - No exact match found, trying alternatives...");
    
    // Try with original ofid (in case there's intentional whitespace)
    if (trimmedOfid !== ofid) {
      const { data: originalData, error: originalError } = await supabase
        .from("tbl_measurement_prod")
        .select("*")
        .eq("ofid", ofid)
        .order("palette_num", { ascending: true })
        .order("import_datetime", { ascending: true });
      
      if (!originalError && originalData && originalData.length > 0) {
        data = originalData;
        console.log("getonemeasurementprod - Found with original ofid (with whitespace):", originalData.length);
      }
    }

    // Try case-insensitive search
    if ((!data || data.length === 0)) {
      const { data: caseInsensitiveData, error: caseError } = await supabase
        .from("tbl_measurement_prod")
        .select("*")
        .ilike("ofid", trimmedOfid)
        .order("palette_num", { ascending: true })
        .order("import_datetime", { ascending: true });
      
      if (!caseError && caseInsensitiveData && caseInsensitiveData.length > 0) {
        data = caseInsensitiveData;
        console.log("getonemeasurementprod - Found with case-insensitive search:", caseInsensitiveData.length);
      }
    }
  }

  // Do not auto-register a row when there are no measurements. After the user deletes
  // all measurements, the list should stay empty until they use "Add Pallete".

  // Debug: If still no results, check what's in the database
  if ((!data || data.length === 0) && !error) {
    console.log("=".repeat(80));
    console.log("DEBUG: No measurements found for ofid:", trimmedOfid);
    console.log("=".repeat(80));
    
    // Get sample ofids from tbl_measurement_prod
    const { data: sampleProdData, error: sampleError } = await supabase
      .from("tbl_measurement_prod")
      .select("ofid, id, palette_num, import_datetime")
      .limit(20)
      .order("import_datetime", { ascending: false });
    
    // Check for similar ofids (partial match)
    const { data: similarOfids, error: similarError } = await supabase
      .from("tbl_measurement_prod")
      .select("ofid, id")
      .ilike("ofid", `%${trimmedOfid}%`)
      .limit(10);
    
    // Check for null ofids
    const { count: nullOfidCount } = await supabase
      .from("tbl_measurement_prod")
      .select("*", { count: 'exact', head: true })
      .is("ofid", null);
    
    // Check what ofids exist in tbl_prod for comparison
    const { data: prodOfids, error: prodOfidError } = await supabase
      .from("tbl_prod")
      .select("id, ofid")
      .eq("ofid", trimmedOfid)
      .limit(5);
    
    console.log("DEBUG Information:", {
      searchedOfid: trimmedOfid,
      sampleOfids: sampleProdData?.map(r => ({
        ofid: r.ofid,
        ofidType: typeof r.ofid,
        ofidLength: r.ofid?.length,
        id: r.id,
        palette_num: r.palette_num,
      })) || [],
      similarOfids: similarOfids?.map(r => ({ ofid: r.ofid, id: r.id })) || [],
      nullOfidCount: nullOfidCount || 0,
      prodRecordsWithOfid: prodOfids?.map(r => ({ id: r.id, ofid: r.ofid })) || [],
      prodHasMatchingOfid: prodOfids && prodOfids.length > 0,
    });
    console.log("=".repeat(80));
  }

  if (error) {
    console.error("Error fetching measurements from tbl_measurement_prod:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json(
      { error: "Failed to fetch measurement data", details: error.message },
      { status: 500 }
    );
  }

  // Query tbl_prod to get the note field for this ofid
  const { data: prodData, error: prodError } = await supabase
    .from("tbl_prod")
    .select("note")
    .eq("ofid", trimmedOfid)
    .limit(1); // Get the first record (or you can aggregate if multiple exist)

  if (prodError) {
    console.error("Error fetching note from tbl_prod:", {
      message: prodError.message,
      code: prodError.code,
      details: prodError.details,
    });
    // Continue without note if there's an error
  }

  // Get the note value (use the first record's note if multiple exist)
  const noteValue = prodData && prodData.length > 0 ? prodData[0].note : null;

  console.log("Fetched note from tbl_prod:", {
    ofid: trimmedOfid,
    note: noteValue,
    prodDataLength: prodData?.length || 0,
    foundProdRecord: prodData && prodData.length > 0,
  });

  // Map humidity to h2o (frontend column name), keep palette_num as-is
  const mappedData = (data || []).map((item) => ({
    id: item.id,
    ofid: item.ofid,
    palette_num: item.palette_num, // Keep palette_num directly from database
    length: item.length,
    inside_diameter: item.inside_diameter,
    outside_diameter: item.outside_diameter,
    flat_crush: item.flat_crush,
    h2o: item.humidity, // Map humidity column to h2o (frontend column name)
    remarks: noteValue || item.remarks || null, // Use note from tbl_prod, fallback to remarks from tbl_measurement_prod if exists
    // Include other fields if needed
    geometry_valid: item.geometry_valid,
    temp_value: item.temp_value,
    import_datetime: item.import_datetime,
  }));

  console.log("=".repeat(80));
  console.log("getonemeasurementprod - Final result:", {
    ofid: trimmedOfid,
    rawDataCount: data?.length || 0,
    mappedDataCount: mappedData.length,
    noteUsed: noteValue,
    hasData: mappedData.length > 0,
  });
  console.log("=".repeat(80));

  return NextResponse.json(mappedData || [], { status: 200 });
}

