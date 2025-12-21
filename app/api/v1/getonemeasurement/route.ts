import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = await req.nextUrl.searchParams.get("id");

  const supabase = await createClient();

  // Add debugging
  console.log("getonemeasurement - Searching for order_form_id:", {
    id: id,
    idType: typeof id,
    idAsNumber: id ? Number(id) : null,
    isNaN: id ? isNaN(Number(id)) : true
  });

  // Try both string and number matching
  const idAsNumber = id ? Number(id) : null;
  const isNumeric = idAsNumber !== null && !isNaN(idAsNumber);

  // First, try exact match with the provided ID (as string)
  const { data, error } = await supabase
    .from("tbl_measurement")
    .select()
    .eq("order_form_id", id)
    .eq("is_exist", true)
    .order("pallete_count", { ascending: true })
    .order("created_at", { ascending: true });

  // If numeric and no results, try as number
  let dataToReturn = data;
  if (isNumeric && (!data || data.length === 0)) {
    console.log("No results with string match, trying numeric match...");
    const { data: numericData, error: numericError } = await supabase
      .from("tbl_measurement")
      .select()
      .eq("order_form_id", idAsNumber)
      .eq("is_exist", true)
      .order("pallete_count", { ascending: true })
      .order("created_at", { ascending: true });
    
    if (!numericError && numericData) {
      dataToReturn = numericData;
      console.log("Found measurements with numeric match:", numericData.length);
    }
  }

  // Additional debugging - check if there are any measurements for this order (even if is_exist is false)
  const { data: allMeasurements, error: allError } = await supabase
    .from("tbl_measurement")
    .select("id, order_form_id, is_exist, pallete_count, length, inside_diameter, outside_diameter")
    .eq("order_form_id", id);

  // Also try numeric if applicable
  let allMeasurementsToCheck = allMeasurements;
  if (isNumeric && (!allMeasurements || allMeasurements.length === 0)) {
    const { data: allNumericMeasurements } = await supabase
      .from("tbl_measurement")
      .select("id, order_form_id, is_exist, pallete_count, length, inside_diameter, outside_diameter")
      .eq("order_form_id", idAsNumber);
    allMeasurementsToCheck = allNumericMeasurements;
  }

  console.log("getonemeasurement - Results:", {
    requestedId: id,
    requestedIdType: typeof id,
    foundWithIsExistTrue: dataToReturn?.length || 0,
    foundTotal: allMeasurementsToCheck?.length || 0,
    allMeasurements: allMeasurementsToCheck,
    measurementsWithIsExistTrue: dataToReturn,
    error: error?.message
  });

  if (error) {
    console.error("Error fetching measurements:", error.message);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  console.log("Fetched measurement data:", dataToReturn);
  return NextResponse.json(dataToReturn || [], { status: 200 });
}
