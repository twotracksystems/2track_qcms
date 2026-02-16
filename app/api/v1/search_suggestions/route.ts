import { createClient as createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

type SuggestionResponse = {
  clients: string[];
  designations: string[];
};

const collectColumnValues = async (
  adminSupabase: Awaited<ReturnType<typeof createAdminClient>>,
  table: string,
  column: string
) => {
  const pageSize = 1000;
  const values: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await adminSupabase
      .from(table)
      .select(column)
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { values: [], error };
    }

    if (!data || data.length === 0) {
      break;
    }

    const rows: unknown[] = data ?? [];
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const record = row as Record<string, unknown>;
      const raw = record[column];
      if (typeof raw !== "string") continue;
      const trimmed = raw.trim();
      if (trimmed) values.push(trimmed);
    }

    if (data.length < pageSize) {
      break;
    }
    offset += pageSize;
  }

  return { values, error: null };
};

const uniqueSorted = (values: string[]) => {
  const map = new Map<string, string>();
  values.forEach((value) => {
    const key = value.toLowerCase();
    if (!map.has(key)) {
      map.set(key, value);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
};

export async function GET(_req: NextRequest) {
  const adminSupabase = await createAdminClient();

  const [customerClients, designationValues] = await Promise.all([
    collectColumnValues(adminSupabase, "tbl_customer", "company_name"),
    collectColumnValues(adminSupabase, "tbl_article_prod", "designation_article"),
  ]);

  const firstError = customerClients.error || designationValues.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const response: SuggestionResponse = {
    clients: uniqueSorted(customerClients.values),
    designations: uniqueSorted(designationValues.values),
  };

  return NextResponse.json(response, { status: 200 });
}
