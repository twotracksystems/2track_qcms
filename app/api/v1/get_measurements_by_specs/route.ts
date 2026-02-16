import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type SpecValues = {
  length_p: number;
  inside_diameter_p: number;
  outside_diameter_p: number;
  flat_crush_p: number;
  h2o_p: number;
};

const parseNumber = (value: string | null): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = value.replace(/,/g, "");
  const numeric = parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

export async function GET(req: NextRequest) {
  const length_p = parseNumber(req.nextUrl.searchParams.get("length_p"));
  const inside_diameter_p = parseNumber(req.nextUrl.searchParams.get("inside_diameter_p"));
  const outside_diameter_p = parseNumber(req.nextUrl.searchParams.get("outside_diameter_p"));
  const flat_crush_p = parseNumber(req.nextUrl.searchParams.get("flat_crush_p"));
  const h2o_p = parseNumber(req.nextUrl.searchParams.get("h2o_p"));
  const startDateParam = req.nextUrl.searchParams.get("startDate");
  const endDateParam = req.nextUrl.searchParams.get("endDate");

  if (
    length_p === null ||
    inside_diameter_p === null ||
    outside_diameter_p === null ||
    flat_crush_p === null ||
    h2o_p === null
  ) {
    return NextResponse.json(
      { error: "All specification values are required." },
      { status: 400 }
    );
  }

  const specs: SpecValues = {
    length_p,
    inside_diameter_p,
    outside_diameter_p,
    flat_crush_p,
    h2o_p,
  };

  const supabase = await createClient();

  const { data: matchingProducts, error: matchingError } = await supabase
    .from("tbl_prod")
    .select("ofid")
    .eq("length_p", specs.length_p)
    .eq("inside_diameter_p", specs.inside_diameter_p)
    .eq("outside_diameter_p", specs.outside_diameter_p)
    .eq("flat_crush_p", specs.flat_crush_p)
    .eq("h2o_p", specs.h2o_p);

  if (matchingError) {
    console.error("get_measurements_by_specs: Failed to load matching products:", matchingError);
    return NextResponse.json({ error: matchingError.message }, { status: 500 });
  }

  const ofids = (matchingProducts || [])
    .map((row) => row.ofid)
    .filter((ofid): ofid is string => Boolean(ofid));

  if (!ofids.length) {
    return NextResponse.json([], { status: 200 });
  }

  const fallbackStart = new Date();
  fallbackStart.setFullYear(fallbackStart.getFullYear() - 1);
  const startDate = startDateParam ? new Date(startDateParam) : fallbackStart;
  const endDate = endDateParam ? new Date(endDateParam) : new Date();

  let query = supabase
    .from("tbl_measurement_prod")
    .select(
      "id, ofid, palette_num, length, inside_diameter, outside_diameter, flat_crush, humidity, import_datetime"
    )
    .in("ofid", ofids)
    .gte("import_datetime", startDate.toISOString())
    .lte("import_datetime", endDate.toISOString())
    .order("import_datetime", { ascending: true })
    .order("palette_num", { ascending: true });

  const { data: measurementData, error: measurementError } = await query;

  if (measurementError) {
    console.error("get_measurements_by_specs: Failed to load measurements:", measurementError);
    return NextResponse.json({ error: measurementError.message }, { status: 500 });
  }

  const mappedData = (measurementData || []).map((item) => ({
    id: item.id,
    ofid: item.ofid,
    palette_num: item.palette_num,
    length: item.length,
    inside_diameter: item.inside_diameter,
    outside_diameter: item.outside_diameter,
    flat_crush: item.flat_crush,
    h2o: item.humidity,
    import_datetime: item.import_datetime,
  }));

  return NextResponse.json(mappedData, { status: 200 });
}
