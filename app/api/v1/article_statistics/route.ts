import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { matchDimensions, normalizeText } from "@/utils/parseDesignation";
import { NextRequest, NextResponse } from "next/server";

type ProdRecord = {
  id?: number | string | null;
  ofid?: string | number | null;
  client?: string | null;
  length_p?: string | number | null;
  inside_diameter_p?: string | number | null;
  outside_diameter_p?: string | number | null;
  flat_crush_p?: string | number | null;
  h2o_p?: string | number | null;
  length_min?: string | number | null;
  inside_diameter_min?: string | number | null;
  outside_diameter_min?: string | number | null;
  flat_crush_min?: string | number | null;
  h2o_min?: string | number | null;
  length_max?: string | number | null;
  inside_diameter_max?: string | number | null;
  outside_diameter_max?: string | number | null;
  flat_crush_max?: string | number | null;
  h2o_max?: string | number | null;
};

type MeasurementRecord = {
  id?: number | string | null;
  ofid?: string | number | null;
  palette_num?: number | null;
  length?: number | null;
  inside_diameter?: number | null;
  outside_diameter?: number | null;
  flat_crush?: number | null;
  humidity?: number | null;
  import_datetime?: string | null;
};

const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = typeof value === "string" ? value.replace(/,/g, "") : value;
  const numeric = typeof normalized === "number" ? normalized : parseFloat(String(normalized));
  return Number.isFinite(numeric) ? numeric : null;
};

export async function GET(req: NextRequest) {
  const debug = (label: string, payload: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "production") return;
    console.log(`[article_statistics] ${label}`, payload);
  };

  const page = Math.max(parseInt(req.nextUrl.searchParams.get("page") || "1", 10), 1);
  const limit = Math.max(parseInt(req.nextUrl.searchParams.get("limit") || "10", 10), 1);
  const client = req.nextUrl.searchParams.get("client")?.trim() || "";
  const designation = req.nextUrl.searchParams.get("designation")?.trim() || "";
  const startDate = req.nextUrl.searchParams.get("startDate")?.trim() || "";
  const endDate = req.nextUrl.searchParams.get("endDate")?.trim() || "";
  const isAnalysis = req.nextUrl.searchParams.get("analysis") === "true";

  debug("request", { page, limit, client, designation, startDate, endDate });

  if (!client || !designation) {
    return NextResponse.json(
      { error: "Client and designation are required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const normalizedDesignation = normalizeText(designation);
  if (!normalizedDesignation) {
    return NextResponse.json({ data: [], total_count: 0 }, { status: 200 });
  }

  const pageSize = 1000;
  let articleData: any[] = [];
  let offset = 0;
  while (true) {
    const { data: articlePage, error: articleError } = await adminSupabase
      .from("tbl_article_prod")
      .select(
        "article_name, designation_article, length, length_min, length_max, inside_diameter, inside_diameter_min, inside_diameter_max, outside_diameter, outside_diameter_min, outside_diameter_max, humidty_min, humidity_max, resistance_min, resistance_max"
      )
      .range(offset, offset + pageSize - 1);

    if (articleError) {
      console.error("article_statistics: Failed to load article list:", articleError);
      return NextResponse.json({ error: articleError.message }, { status: 500 });
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

  debug("article_data_loaded", { total: articleData.length });

  const normalizedClient = normalizeText(client);
  debug("normalized_inputs", {
    normalizedClient,
    normalizedDesignation,
  });
  const matchesClientKeyword = (clientName: string, articleName: string): boolean => {
    if (!clientName || !articleName) return false;
    const normalizedClientName = normalizeText(clientName);
    const normalizedName = normalizeText(articleName);
    if (!normalizedClientName || !normalizedName) return false;

    if (normalizedName.includes(normalizedClientName)) {
      return true;
    }

    const clientWords = normalizedClientName.split(/\s+/).filter((w) => w.length > 2);
    if (clientWords.length > 0) {
      const hasSignificantMatch = clientWords.some(
        (word) => normalizedName.includes(word) && word.length >= 3
      );
      if (hasSignificantMatch) {
        return true;
      }
    }

    const articleWords = normalizedName.split(/\s+/).filter((w) => w.length > 2);
    if (articleWords.length > 0) {
      const hasReverseMatch = articleWords.some(
        (word) => normalizedClientName.includes(word) && word.length >= 3
      );
      if (hasReverseMatch) {
        return true;
      }
    }

    return false;
  };

  const parseLength = (lengthValue: string | number | null | undefined): number | null => {
    if (lengthValue === null || lengthValue === undefined || lengthValue === "") return null;
    const cleaned = String(lengthValue).replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  let candidates = (articleData || [])
    .filter((article) => matchesClientKeyword(client, article.article_name))
    .map((article) => ({
      article_name: article.article_name,
      designation_article: article.designation_article,
      length: parseLength(article.length),
      length_min: parseLength(article.length_min),
      length_max: parseLength(article.length_max),
      inside_diameter: parseNumber(article.inside_diameter),
      inside_diameter_min: parseNumber(article.inside_diameter_min),
      inside_diameter_max: parseNumber(article.inside_diameter_max),
      outside_diameter: parseNumber(article.outside_diameter),
      outside_diameter_min: parseNumber(article.outside_diameter_min),
      outside_diameter_max: parseNumber(article.outside_diameter_max),
      humidty_min: parseNumber(article.humidty_min),
      humidity_max: parseNumber(article.humidity_max),
      resistance_min: parseNumber(article.resistance_min),
      resistance_max: parseNumber(article.resistance_max),
    }));

  if (candidates.length === 0) {
    candidates = (articleData || [])
      .map((article) => ({
        article_name: article.article_name,
        designation_article: article.designation_article,
        length: parseLength(article.length),
        length_min: parseLength(article.length_min),
        length_max: parseLength(article.length_max),
        inside_diameter: parseNumber(article.inside_diameter),
        inside_diameter_min: parseNumber(article.inside_diameter_min),
        inside_diameter_max: parseNumber(article.inside_diameter_max),
        outside_diameter: parseNumber(article.outside_diameter),
        outside_diameter_min: parseNumber(article.outside_diameter_min),
        outside_diameter_max: parseNumber(article.outside_diameter_max),
        humidty_min: parseNumber(article.humidty_min),
        humidity_max: parseNumber(article.humidity_max),
        resistance_min: parseNumber(article.resistance_min),
        resistance_max: parseNumber(article.resistance_max),
      }))
      .filter(
        (article) =>
          article.length !== null &&
          article.inside_diameter !== null &&
          article.outside_diameter !== null
      );
  }

  debug("candidate_counts", {
    withClientMatch: candidates.length,
    totalArticles: articleData.length,
  });

  const candidatesWithDesignation = candidates.filter((article) => {
    const normalizedDesignationValue = normalizeText(article.designation_article);
    return normalizedDesignationValue === normalizedDesignation;
  });

  debug("designation_filtered", { total: candidatesWithDesignation.length });

  if (candidatesWithDesignation.length === 0) {
    return NextResponse.json({ data: [], total_count: 0 }, { status: 200 });
  }

  const candidatesWithParsed = candidatesWithDesignation.map((candidate) => {
    if (
      candidate.length === null ||
      candidate.inside_diameter === null ||
      candidate.outside_diameter === null
    ) {
      return { ...candidate, parsed_dimensions: null };
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

  const prodPageSize = 1000;
  let prodOffset = 0;
  let prodRows: any[] = [];

  while (true) {
    const prodSelectFields = isAnalysis
      ? "id, ofid, client, length_p, inside_diameter_p, outside_diameter_p, flat_crush_p, h2o_p, length_min, inside_diameter_min, outside_diameter_min, flat_crush_min, h2o_min, length_max, inside_diameter_max, outside_diameter_max, flat_crush_max, h2o_max, length_avg, inside_diameter_avg, outside_diameter_avg, flat_crush_avg, h2o_avg, prod_start_date, prod_end_date"
      : "id, ofid, client, length_p, inside_diameter_p, outside_diameter_p, flat_crush_p, h2o_p, length_min, inside_diameter_min, outside_diameter_min, flat_crush_min, h2o_min, length_max, inside_diameter_max, outside_diameter_max, flat_crush_max, h2o_max, prod_start_date, prod_end_date";

    let query = adminSupabase
      .from("tbl_prod")
      .select(prodSelectFields)
      .range(prodOffset, prodOffset + prodPageSize - 1);

    if (startDate && endDate) {
      query = query.lte("prod_start_date", endDate);
    } else if (startDate) {
      query = query.gte("prod_start_date", startDate);
    } else if (endDate) {
      query = query.lte("prod_start_date", endDate);
    }

    const { data: prodPage, error: prodError } = await query;

    if (prodError) {
      console.error("article_statistics: Failed to load production rows:", prodError);
      return NextResponse.json({ error: prodError.message }, { status: 500 });
    }

    if (!prodPage || prodPage.length === 0) {
      break;
    }

    prodRows.push(...prodPage);
    if (prodPage.length < prodPageSize) {
      break;
    }

    prodOffset += prodPageSize;
  }

  if (prodRows.length === 0) {
    return NextResponse.json({ data: [], total_count: 0 }, { status: 200 });
  }

  debug("prod_rows_loaded", { total: prodRows.length });

  let filteredProdRows = prodRows;
  if (startDate && endDate) {
    filteredProdRows = prodRows.filter((prod: any) => {
      if (!prod.prod_end_date || String(prod.prod_end_date).trim() === "") {
        return true;
      }

      let endDateStr: string;
      if (typeof prod.prod_end_date === "string") {
        endDateStr = prod.prod_end_date.split("T")[0].split(" ")[0].trim();
      } else {
        endDateStr = String(prod.prod_end_date);
      }

      try {
        const parsedEndDate = new Date(endDateStr);
        if (isNaN(parsedEndDate.getTime())) {
          return true;
        }
        const normalizedEndDate = parsedEndDate.toISOString().split("T")[0];
        return normalizedEndDate >= startDate;
      } catch {
        return true;
      }
    });
  } else if (startDate) {
    filteredProdRows = prodRows.filter((prod: any) => {
      if (!prod.prod_end_date || String(prod.prod_end_date).trim() === "") {
        return true;
      }

      let endDateStr: string;
      if (typeof prod.prod_end_date === "string") {
        endDateStr = prod.prod_end_date.split("T")[0].split(" ")[0].trim();
      } else {
        endDateStr = String(prod.prod_end_date);
      }

      try {
        const parsedEndDate = new Date(endDateStr);
        if (isNaN(parsedEndDate.getTime())) {
          return true;
        }
        const normalizedEndDate = parsedEndDate.toISOString().split("T")[0];
        return normalizedEndDate >= startDate;
      } catch {
        return true;
      }
    });
  } else if (endDate) {
    filteredProdRows = prodRows.filter((prod: any) => {
      if (!prod.prod_end_date || String(prod.prod_end_date).trim() === "") {
        return true;
      }

      let endDateStr: string;
      if (typeof prod.prod_end_date === "string") {
        endDateStr = prod.prod_end_date.split("T")[0].split(" ")[0].trim();
      } else {
        endDateStr = String(prod.prod_end_date);
      }

      try {
        const parsedEndDate = new Date(endDateStr);
        if (isNaN(parsedEndDate.getTime())) {
          return true;
        }
        const normalizedEndDate = parsedEndDate.toISOString().split("T")[0];
        return normalizedEndDate <= endDate;
      } catch {
        return true;
      }
    });
  }

  debug("prod_rows_filtered", { total: filteredProdRows.length });

  const designationMatches = filteredProdRows
    .map((prod: any) => {
      const length = parseNumber(prod.length_p);
      const inside = parseNumber(prod.inside_diameter_p);
      const outside = parseNumber(prod.outside_diameter_p);
      if (length === null || inside === null || outside === null) return null;

      const matchedCandidate = candidatesWithParsed.find((candidate) => {
        if (!candidate.parsed_dimensions) return false;
        const clientMatch = matchesClientKeyword(prod.client, candidate.article_name);
        if (!clientMatch) return false;
        return matchDimensions(
          { length, inside_diameter: inside, outside_diameter: outside },
          candidate.parsed_dimensions,
          0.9
        );
      });

      return matchedCandidate ? { prod, candidate: matchedCandidate } : null;
    })
    .filter(Boolean);

  debug("final_matches", { total: designationMatches.length });

  if (designationMatches.length === 0) {
    return NextResponse.json({ data: [], total_count: 0 }, { status: 200 });
  }

  designationMatches.sort((a: any, b: any) => {
    const aDate = a.prod.prod_start_date ? new Date(a.prod.prod_start_date).getTime() : 0;
    const bDate = b.prod.prod_start_date ? new Date(b.prod.prod_start_date).getTime() : 0;
    return bDate - aDate;
  });

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const rowsForResponse = isAnalysis ? designationMatches : designationMatches.slice(startIndex, endIndex);

  const normalizedRows = rowsForResponse.map((row: any) => ({
    id: row.prod.id ?? row.prod.ofid ?? null,
    ofid: row.prod.ofid ?? null,
    client: row.prod.client ?? null,
    length_p: parseNumber(row.prod.length_p),
    inside_diameter_p: parseNumber(row.prod.inside_diameter_p),
    outside_diameter_p: parseNumber(row.prod.outside_diameter_p),
    flat_crush_p: parseNumber(row.prod.flat_crush_p),
    h2o_p: parseNumber(row.prod.h2o_p),
    length_min: parseNumber(row.prod.length_min),
    inside_diameter_min: parseNumber(row.prod.inside_diameter_min),
    outside_diameter_min: parseNumber(row.prod.outside_diameter_min),
    flat_crush_min: parseNumber(row.prod.flat_crush_min),
    h2o_min: parseNumber(row.prod.h2o_min),
    length_max: parseNumber(row.prod.length_max),
    inside_diameter_max: parseNumber(row.prod.inside_diameter_max),
    outside_diameter_max: parseNumber(row.prod.outside_diameter_max),
    flat_crush_max: parseNumber(row.prod.flat_crush_max),
    h2o_max: parseNumber(row.prod.h2o_max),
    length_avg: parseNumber(row.prod.length_avg),
    inside_diameter_avg: parseNumber(row.prod.inside_diameter_avg),
    outside_diameter_avg: parseNumber(row.prod.outside_diameter_avg),
    flat_crush_avg: parseNumber(row.prod.flat_crush_avg),
    h2o_avg: parseNumber(row.prod.h2o_avg),
    prod_start_date: row.prod.prod_start_date ?? null,
    prod_end_date: row.prod.prod_end_date ?? null,
    article_length: row.candidate.length ?? null,
    article_length_min: row.candidate.length_min ?? null,
    article_length_max: row.candidate.length_max ?? null,
    article_inside_diameter: row.candidate.inside_diameter ?? null,
    article_inside_diameter_min: row.candidate.inside_diameter_min ?? null,
    article_inside_diameter_max: row.candidate.inside_diameter_max ?? null,
    article_outside_diameter: row.candidate.outside_diameter ?? null,
    article_outside_diameter_min: row.candidate.outside_diameter_min ?? null,
    article_outside_diameter_max: row.candidate.outside_diameter_max ?? null,
    article_resistance_min: row.candidate.resistance_min ?? null,
    article_resistance_max: row.candidate.resistance_max ?? null,
    article_humidity_min: row.candidate.humidty_min ?? null,
    article_humidity_max: row.candidate.humidity_max ?? null,
  }));

  if (!isAnalysis) {
    return NextResponse.json(
      { data: normalizedRows, total_count: designationMatches.length },
      { status: 200 }
    );
  }

  const measurementOfids = Array.from(
    new Set(
      designationMatches
        .map((match: any) => match.prod?.ofid)
        .filter((ofid: any) => typeof ofid === "string" && ofid.trim().length > 0)
    )
  );

  let measurementRows: MeasurementRecord[] = [];
  if (measurementOfids.length) {
    const measurementPageSize = 1000;
    const ofidChunkSize = 250;
    const measurementData: any[] = [];

    for (let ofidIndex = 0; ofidIndex < measurementOfids.length; ofidIndex += ofidChunkSize) {
      const ofidChunk = measurementOfids.slice(ofidIndex, ofidIndex + ofidChunkSize);
      let measurementOffset = 0;

      while (true) {
        let measurementQuery = adminSupabase
          .from("tbl_measurement_prod")
          .select(
            "id, ofid, palette_num, length, inside_diameter, outside_diameter, flat_crush, humidity, import_datetime"
          )
          .in("ofid", ofidChunk)
          .order("import_datetime", { ascending: true })
          .order("palette_num", { ascending: true })
          .range(measurementOffset, measurementOffset + measurementPageSize - 1);

        if (startDate) {
          measurementQuery = measurementQuery.gte("import_datetime", startDate);
        }
        if (endDate) {
          measurementQuery = measurementQuery.lte("import_datetime", endDate);
        }

        const { data: measurementPage, error: measurementError } = await measurementQuery;
        if (measurementError) {
          console.error("article_statistics: Failed to load measurement rows:", measurementError);
          return NextResponse.json({ error: measurementError.message }, { status: 500 });
        }

        if (!measurementPage || measurementPage.length === 0) {
          break;
        }

        measurementData.push(...measurementPage);
        if (measurementPage.length < measurementPageSize) {
          break;
        }
        measurementOffset += measurementPageSize;
      }
    }

    measurementRows = measurementData
      .map((item: any) => ({
      id: item.id,
      ofid: item.ofid,
      palette_num: item.palette_num,
      length: parseNumber(item.length),
      inside_diameter: parseNumber(item.inside_diameter),
      outside_diameter: parseNumber(item.outside_diameter),
      flat_crush: parseNumber(item.flat_crush),
      humidity: parseNumber(item.humidity),
      import_datetime: item.import_datetime ?? null,
      }))
      .sort((a, b) => {
        const aTime = a.import_datetime ? new Date(a.import_datetime).getTime() : 0;
        const bTime = b.import_datetime ? new Date(b.import_datetime).getTime() : 0;
        if (aTime !== bTime) return aTime - bTime;
        const aPalette = a.palette_num ?? 0;
        const bPalette = b.palette_num ?? 0;
        return aPalette - bPalette;
      });
  }

  return NextResponse.json(
    { data: normalizedRows, total_count: designationMatches.length, measurements: measurementRows },
    { status: 200 }
  );
}
