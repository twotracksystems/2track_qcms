import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@/utils/supabase/admin";
import {
  normalizeText,
  parseDesignation,
  matchDimensions,
} from "@/utils/parseDesignation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "0", 10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);
  const search = req.nextUrl.searchParams.get("search");
  const ofidParam = req.nextUrl.searchParams.get("ofid")?.trim() || "";
  const clientParam = req.nextUrl.searchParams.get("client")?.trim() || "";
  const designationParam = req.nextUrl.searchParams.get("designation")?.trim() || "";
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  const matchesClientKeyword = (client: string, articleName: string): boolean => {
    if (!client || !articleName) return false;
    const normalizedClient = normalizeText(client);
    const normalizedName = normalizeText(articleName);
    if (!normalizedClient || !normalizedName) return false;

    if (normalizedName.includes(normalizedClient)) {
      return true;
    }

    const clientWords = normalizedClient.split(/\s+/).filter((w) => w.length > 2);
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
        (word) => normalizedClient.includes(word) && word.length >= 3
      );
      if (hasReverseMatch) {
        return true;
      }
    }

    return false;
  };

  const parseNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return isNaN(value) ? null : value;
    const cleaned = String(value).replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  const parseLength = (lengthValue: string | number | null | undefined): number | null => {
    if (lengthValue === null || lengthValue === undefined || lengthValue === "") return null;
    const cleaned = String(lengthValue).replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const hasStructuredSearch = Boolean(ofidParam || clientParam || designationParam);

  // OFID "numeric first" filter: OFIDs starting with 0-9 first, then letter-starting
  const OFID_STARTS_DIGIT_OR =
    "ofid.like.0%,ofid.like.1%,ofid.like.2%,ofid.like.3%,ofid.like.4%,ofid.like.5%,ofid.like.6%,ofid.like.7%,ofid.like.8%,ofid.like.9%";
  const applyLetterOnlyFilter = (q: any) =>
    q
      .not("ofid", "like", "0%")
      .not("ofid", "like", "1%")
      .not("ofid", "like", "2%")
      .not("ofid", "like", "3%")
      .not("ofid", "like", "4%")
      .not("ofid", "like", "5%")
      .not("ofid", "like", "6%")
      .not("ofid", "like", "7%")
      .not("ofid", "like", "8%")
      .not("ofid", "like", "9%");

  // Determine if the user is searching for a company name (contains letters)
  const term = (search || "").trim();
  const isCompanySearch = term !== "" && /[A-Za-z]/.test(term);
  const hasSearchTerm = term !== "";

  let prodData: any[] | null = null;
  let totalCount: number | null = null;

  if (hasStructuredSearch) {
    if (!ofidParam && !clientParam) {
      return NextResponse.json(
        { error: "OFID or client is required." },
        { status: 400 }
      );
    }

    // Build a fresh base query each time (Supabase builder mutates on .not(), so we must not reuse)
    const buildStructBaseQuery = () => {
      let q = supabase.from("tbl_prod").select("*", { count: "exact" });
      if (ofidParam) q = q.ilike("ofid", `%${ofidParam}%`);
      if (clientParam) q = q.ilike("client", `%${clientParam}%`);
      if (startDate && endDate) q = q.lte("prod_start_date", endDate);
      else if (startDate) q = q.gte("prod_start_date", startDate);
      else if (endDate) q = q.lte("prod_start_date", endDate);
      return q;
    };

    // Numeric-first: count numeric vs letter OFIDs, then fetch the right slice
    const countOpt = { count: "exact" as const, head: true };
    const structNumericCountRes = await (buildStructBaseQuery().or(
      OFID_STARTS_DIGIT_OR
    ) as any).select("*", countOpt);
    const structLetterCountRes = await (applyLetterOnlyFilter(
      buildStructBaseQuery()
    ) as any).select("*", countOpt);
    const structNumericCount = structNumericCountRes.count ?? 0;
    const structLetterCount = structLetterCountRes.count ?? 0;
    totalCount = structNumericCount + structLetterCount;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;

    if (totalCount === 0) {
      prodData = [];
    } else if (endIndex < structNumericCount) {
      const { data: structuredData, error: structuredError } =
        await buildStructBaseQuery()
          .or(OFID_STARTS_DIGIT_OR)
          .order("ofid", { ascending: false, nullsFirst: false })
          .range(startIndex, endIndex);
      if (structuredError) {
        return NextResponse.json({ error: structuredError.message }, { status: 500 });
      }
      prodData = structuredData;
    } else if (startIndex >= structNumericCount) {
      const letterOffset = startIndex - structNumericCount;
      const letterEnd = endIndex - structNumericCount;
      const { data: structuredData, error: structuredError } =
        await applyLetterOnlyFilter(buildStructBaseQuery())
          .order("ofid", { ascending: false, nullsFirst: false })
          .range(letterOffset, letterEnd);
      if (structuredError) {
        return NextResponse.json({ error: structuredError.message }, { status: 500 });
      }
      prodData = structuredData;
    } else {
      const numericEnd = structNumericCount - 1;
      const numericStart = startIndex;
      const letterStart = 0;
      const letterEnd = endIndex - structNumericCount;
      const [numericRes, letterRes] = await Promise.all([
        buildStructBaseQuery()
          .or(OFID_STARTS_DIGIT_OR)
          .order("ofid", { ascending: false, nullsFirst: false })
          .range(numericStart, numericEnd),
        applyLetterOnlyFilter(buildStructBaseQuery())
          .order("ofid", { ascending: false, nullsFirst: false })
          .range(letterStart, letterEnd),
      ]);
      if (numericRes.error) {
        return NextResponse.json({ error: numericRes.error.message }, { status: 500 });
      }
      if (letterRes.error) {
        return NextResponse.json({ error: letterRes.error.message }, { status: 500 });
      }
      prodData = [...(numericRes.data ?? []), ...(letterRes.data ?? [])];
    }

    if (designationParam && prodData && prodData.length > 0) {
      const normalizedDesignation = normalizeText(designationParam);
      if (!normalizedDesignation) {
        return NextResponse.json(
          { data: [], total_count: 0 },
          { status: 200 }
        );
      }

      const pageSize = 1000;
      let articleData: any[] = [];
      let offset = 0;
      while (true) {
        const { data: articlePage, error: articleError } = await adminSupabase
          .from("tbl_article_prod")
          .select("article_name, designation_article, length, inside_diameter, outside_diameter")
          .range(offset, offset + pageSize - 1);

        if (articleError) {
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

      let candidates = (articleData || [])
        .filter((article) => matchesClientKeyword(clientParam, article.article_name))
        .map((article) => ({
          article_name: article.article_name,
          designation_article: article.designation_article,
          length: parseLength(article.length),
          inside_diameter: parseNumber(article.inside_diameter),
          outside_diameter: parseNumber(article.outside_diameter),
        }));

      if (candidates.length === 0) {
        candidates = (articleData || [])
          .map((article) => ({
            article_name: article.article_name,
            designation_article: article.designation_article,
            length: parseLength(article.length),
            inside_diameter: parseNumber(article.inside_diameter),
            outside_diameter: parseNumber(article.outside_diameter),
          }))
          .filter(
            (article) =>
              article.length !== null &&
              article.inside_diameter !== null &&
              article.outside_diameter !== null
          );
      }

      const candidatesWithDesignation = candidates.filter((article) => {
        const normalizedDesignationValue = normalizeText(article.designation_article);
        return normalizedDesignationValue === normalizedDesignation;
      });

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

      const tolerance = 0.9;
      const designationMatches = prodData.filter((prod: any) => {
        const length = parseNumber(prod.length_p);
        const inside = parseNumber(prod.inside_diameter_p);
        const outside = parseNumber(prod.outside_diameter_p);
        if (length === null || inside === null || outside === null) return false;

        return candidatesWithParsed.some((candidate) => {
          if (!candidate.parsed_dimensions) return false;
          return matchDimensions(
            { length, inside_diameter: inside, outside_diameter: outside },
            candidate.parsed_dimensions,
            tolerance
          );
        });
      });

      prodData = designationMatches;
      totalCount = designationMatches.length;
    }
  } else {
    // Build a fresh base query each time (Supabase builder mutates on .not(), so we must not reuse)
    const buildDefaultBaseQuery = () => {
      let q = supabase.from("tbl_prod").select("*", { count: "exact" });
      if (isCompanySearch) q = q.ilike("client", `%${term}%`);
      else if (search) q = q.ilike("ofid", `%${search}%`);
      if (startDate && endDate) q = q.lte("prod_start_date", endDate);
      else if (startDate) q = q.gte("prod_start_date", startDate);
      else if (endDate) q = q.lte("prod_start_date", endDate);
      return q;
    };

    // Numeric-first: count rows where OFID starts with a digit vs letter
    const countOpt = { count: "exact" as const, head: true };
    const numericCountRes = await (buildDefaultBaseQuery().or(
      OFID_STARTS_DIGIT_OR
    ) as any).select("*", countOpt);
    const letterCountRes = await (applyLetterOnlyFilter(
      buildDefaultBaseQuery()
    ) as any).select("*", countOpt);
    const numericCount = numericCountRes.count ?? 0;
    const letterCount = letterCountRes.count ?? 0;
    totalCount = numericCount + letterCount;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;

    if (totalCount === 0) {
      prodData = [];
    } else if (endIndex < numericCount) {
      // Page fully in numeric zone
      const { data: initialData, error: prodError } =
        await buildDefaultBaseQuery()
          .or(OFID_STARTS_DIGIT_OR)
          .order("ofid", { ascending: false, nullsFirst: false })
          .range(startIndex, endIndex);
      if (prodError) {
        return NextResponse.json({ error: prodError.message }, { status: 500 });
      }
      prodData = initialData;
    } else if (startIndex >= numericCount) {
      // Page fully in letter zone
      const letterOffset = startIndex - numericCount;
      const letterEnd = endIndex - numericCount;
      const { data: initialData, error: prodError } =
        await applyLetterOnlyFilter(buildDefaultBaseQuery())
          .order("ofid", { ascending: false, nullsFirst: false })
          .range(letterOffset, letterEnd);
      if (prodError) {
        return NextResponse.json({ error: prodError.message }, { status: 500 });
      }
      prodData = initialData;
    } else {
      // Page spans numeric and letter: fetch numeric tail + letter head
      const numericEnd = numericCount - 1;
      const numericStart = startIndex;
      const letterStart = 0;
      const letterEnd = endIndex - numericCount;
      const [numericRes, letterRes] = await Promise.all([
        buildDefaultBaseQuery()
          .or(OFID_STARTS_DIGIT_OR)
          .order("ofid", { ascending: false, nullsFirst: false })
          .range(numericStart, numericEnd),
        applyLetterOnlyFilter(buildDefaultBaseQuery())
          .order("ofid", { ascending: false, nullsFirst: false })
          .range(letterStart, letterEnd),
      ]);
      if (numericRes.error) {
        return NextResponse.json({ error: numericRes.error.message }, { status: 500 });
      }
      if (letterRes.error) {
        return NextResponse.json({ error: letterRes.error.message }, { status: 500 });
      }
      prodData = [...(numericRes.data ?? []), ...(letterRes.data ?? [])];
    }
  }

  const applyDesignationSearchFallback = async () => {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) {
      return { data: [], total: 0 };
    }

    // Fetch all prod records for the current date filters (no search filter)
    let fallbackQuery = supabase.from("tbl_prod").select("*");

    if (startDate && endDate) {
      fallbackQuery = fallbackQuery.lte("prod_start_date", endDate);
    } else if (startDate) {
      fallbackQuery = fallbackQuery.gte("prod_start_date", startDate);
    } else if (endDate) {
      fallbackQuery = fallbackQuery.lte("prod_start_date", endDate);
    }

    const { data: fallbackProdData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    if (!fallbackProdData || fallbackProdData.length === 0) {
      return { data: [], total: 0 };
    }

    // Fetch all articles once (admin client bypasses RLS)
    const pageSize = 1000;
    let articleData: any[] = [];
    let offset = 0;
    while (true) {
    const { data: articlePage, error: articleError } = await adminSupabase
        .from("tbl_article_prod")
        .select("article_name, designation_article, length, inside_diameter, outside_diameter")
        .range(offset, offset + pageSize - 1);

      if (articleError) {
        throw new Error(articleError.message);
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

    const normalizedArticles = articleData
      .map((article) => ({
        ...article,
        normalizedName: normalizeText(article.article_name),
        normalizedDesignation: normalizeText(article.designation_article),
      }))
      .filter((article) => article.normalizedDesignation === normalizedTerm);

    if (normalizedArticles.length === 0) {
      return { data: [], total: 0 };
    }

    const tolerance = 0.9;

    const designationCandidates = normalizedArticles
      .map((article) => {
        const directLength = parseNumber(article.length);
        const directInside = parseNumber(article.inside_diameter);
        const directOutside = parseNumber(article.outside_diameter);
        const parsedFromDesignation = parseDesignation(article.designation_article);

        const length =
          directLength ?? parsedFromDesignation?.length ?? null;
        const inside_diameter =
          directInside ?? parsedFromDesignation?.inside_diameter ?? null;
        const outside_diameter =
          directOutside ?? parsedFromDesignation?.outside_diameter ?? null;

        if (
          length === null ||
          inside_diameter === null ||
          outside_diameter === null
        ) {
          return null;
        }

        return {
          article_name: article.article_name,
          dimensions: {
            length,
            inside_diameter,
            outside_diameter,
          },
        };
      })
      .filter(Boolean) as Array<{
      article_name: string;
      dimensions: { length: number; inside_diameter: number; outside_diameter: number };
    }>;

    if (designationCandidates.length === 0) {
      return { data: [], total: 0 };
    }

    const designationMatches = fallbackProdData.filter((prod: any) => {
      const prodDimensions = {
        length: parseNumber(prod.length_p),
        inside_diameter: parseNumber(prod.inside_diameter_p),
        outside_diameter: parseNumber(prod.outside_diameter_p),
      };

      if (
        prodDimensions.length === null ||
        prodDimensions.inside_diameter === null ||
        prodDimensions.outside_diameter === null
      ) {
        return false;
      }

      return designationCandidates.some((candidate) =>
        matchDimensions(prodDimensions, candidate.dimensions, tolerance)
      );
    });

    if (designationMatches.length === 0) {
      return { data: [], total: 0 };
    }

    // Sort: numeric-leading OFIDs first, then by OFID descending
    designationMatches.sort((a: any, b: any) => {
      const aOfid = String(a.ofid ?? "");
      const bOfid = String(b.ofid ?? "");
      const aNum = /^[0-9]/.test(aOfid);
      const bNum = /^[0-9]/.test(bOfid);
      if (aNum !== bNum) return aNum ? -1 : 1;
      return bOfid.localeCompare(aOfid, undefined, { numeric: true });
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pagedData = designationMatches.slice(startIndex, endIndex);

    return { data: pagedData, total: designationMatches.length };
  };

  if ((!prodData || prodData.length === 0) && hasSearchTerm) {
    try {
      const fallback = await applyDesignationSearchFallback();
      prodData = fallback.data;
      totalCount = fallback.total;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Designation search failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!prodData || prodData.length === 0) {
    return NextResponse.json(
      { data: [], total_count: totalCount || 0 },
      { status: 200 }
    );
  }

  // Post-process to filter by prod_end_date if it's a text field
  // This handles the case where prod_end_date is text type
  // We filter records where the production period overlaps with the selected date range
  // A record overlaps if: prod_start_date <= endDate AND (prod_end_date >= startDate OR prod_end_date IS NULL)
  let filteredProdData = prodData;
  if (startDate && endDate) {
    filteredProdData = prodData.filter((prod: any) => {
      // Include records without end date (they're still in progress or ongoing)
      if (!prod.prod_end_date || prod.prod_end_date.trim() === "") {
        return true;
      }
      
      // Extract date part from prod_end_date (handle text format)
      let endDateStr: string;
      if (typeof prod.prod_end_date === 'string') {
        // Handle various date formats
        endDateStr = prod.prod_end_date.split('T')[0].split(' ')[0].trim();
      } else {
        endDateStr = String(prod.prod_end_date);
      }
      
      // Normalize date format to YYYY-MM-DD for comparison
      try {
        const parsedEndDate = new Date(endDateStr);
        if (isNaN(parsedEndDate.getTime())) {
          // If date is invalid, include the record (better to show than hide)
          return true;
        }
        const normalizedEndDate = parsedEndDate.toISOString().split('T')[0];
        
        // Include records where prod_end_date >= startDate (overlaps with range)
        // This ensures records that ended before the start date are excluded
        return normalizedEndDate >= startDate;
      } catch {
        // If parsing fails, include the record
        return true;
      }
    });
  } else if (startDate) {
    // If only start date is provided, filter by prod_end_date >= startDate
    filteredProdData = prodData.filter((prod: any) => {
      if (!prod.prod_end_date || prod.prod_end_date.trim() === "") {
        return true; // Include records without end date
      }
      
      let endDateStr: string;
      if (typeof prod.prod_end_date === 'string') {
        endDateStr = prod.prod_end_date.split('T')[0].split(' ')[0].trim();
      } else {
        endDateStr = String(prod.prod_end_date);
      }
      
      try {
        const parsedEndDate = new Date(endDateStr);
        if (isNaN(parsedEndDate.getTime())) {
          return true;
        }
        const normalizedEndDate = parsedEndDate.toISOString().split('T')[0];
        return normalizedEndDate >= startDate;
      } catch {
        return true;
      }
    });
  } else if (endDate) {
    // If only end date is provided, filter by prod_end_date <= endDate
    filteredProdData = prodData.filter((prod: any) => {
      if (!prod.prod_end_date || prod.prod_end_date.trim() === "") {
        return true; // Include records without end date
      }
      
      let endDateStr: string;
      if (typeof prod.prod_end_date === 'string') {
        endDateStr = prod.prod_end_date.split('T')[0].split(' ')[0].trim();
      } else {
        endDateStr = String(prod.prod_end_date);
      }
      
      try {
        const parsedEndDate = new Date(endDateStr);
        if (isNaN(parsedEndDate.getTime())) {
          return true;
        }
        const normalizedEndDate = parsedEndDate.toISOString().split('T')[0];
        return normalizedEndDate <= endDate;
      } catch {
        return true;
      }
    });
  }

  // Get unique client names from tbl_prod to try to match with customers
  const clientNames = [...new Set(
    (filteredProdData || [])
      .map((p: any) => p.client)
      .filter((name: any) => name != null && name.trim() !== "")
  )];

  // Try to find matching customers by company_name (fuzzy match)
  let customersMap: Record<string, any> = {};
  if (clientNames.length > 0) {
    // Try exact matches first
    const { data: customersDataExact, error: customersErrorExact } = await supabase
      .from("tbl_customer")
      .select("*")
      .in("company_name", clientNames);

    if (!customersErrorExact && customersDataExact) {
      customersDataExact.forEach((customer: any) => {
        customersMap[customer.company_name] = customer;
      });
    }

    // Try partial matches for any clients not found
    const foundClientNames = Object.keys(customersMap);
    const unfoundClients = clientNames.filter((name: string) => !foundClientNames.includes(name));
    
    if (unfoundClients.length > 0) {
      // Try ILIKE search for each unfound client
      for (const clientName of unfoundClients) {
        const { data: customerData, error: customerError } = await supabase
          .from("tbl_customer")
          .select("*")
          .ilike("company_name", `%${clientName}%`)
          .limit(1);

        if (!customerError && customerData && customerData.length > 0) {
          customersMap[clientName] = customerData[0];
        }
      }
    }
  }

  // Designation from tbl_article_prod where article_ref = article (only for rows that have article_ref)
  const articleRefs = [...new Set(
    (filteredProdData || [])
      .map((p: any) => p.article_ref)
      .filter((ref: any) => ref != null && ref !== "" && (Number(ref) === Number(ref)))
  )] as (string | number)[];
  let articleRefToDesignation: Record<string, string> = {};
  if (articleRefs.length > 0) {
    const numericRefs = articleRefs.map((r) => Number(r));
    const { data: articleRows } = await supabase
      .from("tbl_article_prod")
      .select("article, designation_article")
      .in("article", numericRefs);
    if (articleRows) {
      articleRows.forEach((row: { article: number; designation_article: string | null }) => {
        if (row.designation_article != null && row.designation_article !== "") {
          articleRefToDesignation[String(row.article)] = row.designation_article;
        }
      });
    }
  }

  // Map tbl_prod data to match frontend expectations
  const mappedData = (filteredProdData || []).map((prod: any) => {
    const clientName = prod.client;
    const customer = clientName ? customersMap[clientName] : null;

    // If no customer match found but we have a client name, create a fallback customer object
    // This ensures the frontend can still display the client name
    let finalCustomer = customer;
    if (!finalCustomer && clientName && clientName.trim() !== "") {
      finalCustomer = {
        id: null,
        company_name: clientName, // Use the raw client value as fallback
        // Other fields can be null/undefined
      };
    }

    // Helper: format date to YYYY-MM-DD (for date-type prod_start_date; avoids UTC shift)
    const formatDate = (date: any): string | null => {
      if (!date) return null;

      if (typeof date === "string") {
        const datePart = date.split("T")[0].split(" ")[0].trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
        try {
          const parsed = new Date(datePart);
          if (!isNaN(parsed.getTime())) {
            // Use local date parts so timezone doesn't change the calendar day
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, "0");
            const d = String(parsed.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          }
        } catch {
          // ignore
        }
        return null;
      }

      if (date instanceof Date) {
        if (isNaN(date.getTime())) return null;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }

      return null;
    };

    // Helper: parse prod_end_date (text type, e.g. "11/26/25" MM/DD/YY) to YYYY-MM-DD without timezone
    const formatEndDateText = (value: any): string | null => {
      if (value == null || typeof value !== "string") return null;
      const trimmed = value.split("T")[0].split(" ")[0].trim();
      if (!trimmed) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const parts = trimmed.split("/").map((p) => p.trim());
      if (parts.length !== 3) return null;
      const mm = parseInt(parts[0], 10);
      const dd = parseInt(parts[1], 10);
      const yy = parseInt(parts[2], 10);
      if (isNaN(mm) || isNaN(dd) || isNaN(yy)) return null;
      const year = yy < 100 ? 2000 + yy : yy;
      if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
      return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    };

    // Helper: parse time from tbl_prod (HH:MM:SS or H:MM:SS AM/PM) to 24h HH:MM:SS
    const formatTime = (time: any): string => {
      if (!time) return "00:00:00";
      if (typeof time !== "string") return "00:00:00";
      const trimmed = time.trim();
      if (!trimmed) return "00:00:00";

      const upper = trimmed.toUpperCase();
      const isPm = upper.endsWith(" PM");
      const isAm = upper.endsWith(" AM");
      const hasAmPm = isPm || isAm;
      const timePart = hasAmPm ? trimmed.slice(0, -3).trim() : trimmed;
      const parts = timePart.split(":").map((p) => p.trim());
      if (parts.length < 2) return "00:00:00";

      let h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) || 0;
      const s = parts[2] != null ? parseInt(parts[2], 10) : 0;
      if (isNaN(h) || isNaN(m) || isNaN(s)) return "00:00:00";

      if (hasAmPm) {
        if (isPm && h !== 12) h += 12;
        else if (isAm && h === 12) h = 0;
      }
      if (h < 0 || h > 23) return "00:00:00";

      const hours = String(h).padStart(2, "0");
      const minutes = String(m).padStart(2, "0");
      const seconds = String(s).padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    };

    // Combine prod_start_date and prod_start_time for entry_date_time
    let entryDateTime = null;
    if (prod.prod_start_date) {
      const dateStr = formatDate(prod.prod_start_date);
      const timeStr = formatTime(prod.prod_start_time);
      if (dateStr) {
        const isoString = `${dateStr}T${timeStr}`;
        // Validate it's a valid ISO string
        const testDate = new Date(isoString);
        if (!isNaN(testDate.getTime())) {
          entryDateTime = isoString;
        }
      }
    }

    // Combine prod_end_date and prod_end_time for exit_date_time (prod_end_date is text, e.g. MM/DD/YY)
    let exitDateTime = null;
    if (prod.prod_end_date) {
      const endDateStr = formatEndDateText(prod.prod_end_date);
      if (endDateStr) {
        // Check if prod_end_date already contains time
        const endDateValue = prod.prod_end_date;
        if (typeof endDateValue === 'string' && (endDateValue.includes("T") || endDateValue.includes(" "))) {
          // Already has time, try to parse it
          try {
            const dateObj = new Date(endDateValue);
            if (!isNaN(dateObj.getTime())) {
              exitDateTime = dateObj.toISOString();
            } else {
              // Fallback: use the date part and add time
              const timeStr = formatTime(prod.prod_end_time);
              const isoString = `${endDateStr}T${timeStr}`;
              const testDate = new Date(isoString);
              if (!isNaN(testDate.getTime())) {
                exitDateTime = isoString;
              }
            }
          } catch {
            // If parsing fails, combine date and time
            const timeStr = formatTime(prod.prod_end_time);
            const isoString = `${endDateStr}T${timeStr}`;
            const testDate = new Date(isoString);
            if (!isNaN(testDate.getTime())) {
              exitDateTime = isoString;
            }
          }
        } else {
          // No time in date, combine with time field
          const timeStr = formatTime(prod.prod_end_time);
          const isoString = `${endDateStr}T${timeStr}`;
          const testDate = new Date(isoString);
          if (!isNaN(testDate.getTime())) {
            exitDateTime = isoString;
          }
        }
      }
    }

    // Only attach designation when this row has article_ref (leave others as-is)
    const hasArticleRef = prod.article_ref != null && prod.article_ref !== "";
    const designationFromArticle =
      hasArticleRef && articleRefToDesignation[String(prod.article_ref)]
        ? articleRefToDesignation[String(prod.article_ref)]
        : null;
    const tblArticle =
      designationFromArticle != null
        ? { designation_article: designationFromArticle }
        : null;

    return {
      // Use tbl_prod id
      id: prod.id || null,
      // Use ofid from tbl_prod as order_fabrication_control
      order_fabrication_control: prod.ofid || null,
      // Get customer data (matched by client name, or fallback to raw client value)
      customer_id: finalCustomer?.id || null,
      tbl_customer: finalCustomer || null,
      // Article link: tbl_prod.article_ref (matches tbl_article_prod.article)
      article_ref: prod.article_ref ?? null,
      article_id: prod.article_ref ?? null,
      tbl_article: tblArticle,
      // Get pallet count from tbl_prod
      pallete_count: prod.pallet_num_dried || null,
      // Include all other fields from tbl_prod
      ...prod,
      // OF Management Entry/Exit: always from prod_start_* and prod_end_* (override any raw prod fields)
      entry_date_time: entryDateTime,
      exit_date_time: exitDateTime,
      // Use prod_start_date for sorting if created_at doesn't exist
      created_at: prod.created_at || prod.prod_start_date || null,
    };
  });

  // Debug: Log sample order to verify structure
  if (mappedData && mappedData.length > 0) {
    const sampleOrder = mappedData[0];
    console.log("Sample order from API (tbl_prod only):", {
      prod_id: sampleOrder.id,
      ofid: sampleOrder.order_fabrication_control,
      client: sampleOrder.client,
      customer_id: sampleOrder.customer_id,
      has_tbl_customer: !!sampleOrder.tbl_customer,
      company_name: sampleOrder.tbl_customer?.company_name,
      entry_date_time: sampleOrder.entry_date_time,
      exit_date_time: sampleOrder.exit_date_time,
      prod_start_date: sampleOrder.prod_start_date,
      prod_end_date: sampleOrder.prod_end_date,
      pallete_count: sampleOrder.pallete_count,
    });
  }

  console.log("tbl_prod data:", mappedData, "total_count:", totalCount);

  return NextResponse.json(
    { data: mappedData, total_count: totalCount || 0 },
    { status: 200 }
  );
}
