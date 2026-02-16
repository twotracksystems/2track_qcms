"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import ImprovedPagination from "../UI/ImprovedPagination";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import {
  DrawFooter,
  DrawGraphLabel,
  DrawHorizontalLine,
  DrawMainHeader,
} from "./PDFBuilder";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, zoomPlugin);

type ProductionStatistic = {
  id?: number | string | null;
  ofid?: string | number | null;
  client?: string | null;
  length_p?: number | string | null;
  inside_diameter_p?: number | string | null;
  outside_diameter_p?: number | string | null;
  flat_crush_p?: number | string | null;
  h2o_p?: number | string | null;
  length_min?: number | string | null;
  inside_diameter_min?: number | string | null;
  outside_diameter_min?: number | string | null;
  flat_crush_min?: number | string | null;
  h2o_min?: number | string | null;
  length_max?: number | string | null;
  inside_diameter_max?: number | string | null;
  outside_diameter_max?: number | string | null;
  flat_crush_max?: number | string | null;
  h2o_max?: number | string | null;
  length_avg?: number | string | null;
  inside_diameter_avg?: number | string | null;
  outside_diameter_avg?: number | string | null;
  flat_crush_avg?: number | string | null;
  h2o_avg?: number | string | null;
  prod_start_date?: string | null;
  prod_end_date?: string | null;
  article_length?: number | string | null;
  article_length_min?: number | string | null;
  article_length_max?: number | string | null;
  article_inside_diameter?: number | string | null;
  article_inside_diameter_min?: number | string | null;
  article_inside_diameter_max?: number | string | null;
  article_outside_diameter?: number | string | null;
  article_outside_diameter_min?: number | string | null;
  article_outside_diameter_max?: number | string | null;
  article_resistance_min?: number | string | null;
  article_resistance_max?: number | string | null;
  article_humidity_min?: number | string | null;
  article_humidity_max?: number | string | null;
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

type ApiResponse = {
  data: ProductionStatistic[];
  total_count?: number;
  measurements?: MeasurementRecord[];
};

type SuggestionResponse = {
  clients: string[];
  designations: string[];
};

type MetricKey = "length" | "inside_diameter" | "outside_diameter" | "flat_crush" | "h2o";

const parseNumber = (value?: string | number | null): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = typeof value === "string" ? value.replace(/,/g, "") : value;
  const numeric = typeof normalized === "number" ? normalized : parseFloat(String(normalized));
  return Number.isFinite(numeric) ? numeric : null;
};

// formatNumber is now imported from @/utils/formatNumber

const formatCount = (value?: number | null) => {
  return value === null || value === undefined ? "—" : String(value);
};

const formatFixed2 = (value?: string | number | null) => {
  const numeric = parseNumber(value);
  return numeric === null ? "—" : numeric.toFixed(2);
};

const averageRange = (min: number | null, max: number | null) => {
  if (min === null || max === null) return null;
  return (min + max) / 2;
};

const formatMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const fetchStatistics = async ({
  page,
  limit,
  client,
  designation,
  startDate,
  endDate,
}: {
  page: number;
  limit: number;
  client: string;
  designation: string;
  startDate: string;
  endDate: string;
}): Promise<ApiResponse> => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("client", client);
  params.set("designation", designation);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const response = await fetch(`/api/v1/article_statistics?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load statistical analysis data.");
  }

  return response.json();
};

const fetchAnalysis = async ({
  client,
  designation,
  startDate,
  endDate,
}: {
  client: string;
  designation: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse> => {
  const params = new URLSearchParams();
  params.set("analysis", "true");
  params.set("client", client);
  params.set("designation", designation);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const response = await fetch(`/api/v1/article_statistics?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load analysis data.");
  }
  return response.json();
};

const fetchSuggestions = async (): Promise<SuggestionResponse> => {
  const response = await fetch("/api/v1/search_suggestions");
  if (!response.ok) {
    throw new Error("Failed to load search suggestions.");
  }
  return response.json();
};

const metricFieldMap: Record<
  MetricKey,
  {
    p: keyof ProductionStatistic;
    min: keyof ProductionStatistic;
    max: keyof ProductionStatistic;
    avg: keyof ProductionStatistic;
  }
> = {
  length: { p: "length_p", min: "length_min", max: "length_max", avg: "length_avg" },
  inside_diameter: {
    p: "inside_diameter_p",
    min: "inside_diameter_min",
    max: "inside_diameter_max",
    avg: "inside_diameter_avg",
  },
  outside_diameter: {
    p: "outside_diameter_p",
    min: "outside_diameter_min",
    max: "outside_diameter_max",
    avg: "outside_diameter_avg",
  },
  flat_crush: { p: "flat_crush_p", min: "flat_crush_min", max: "flat_crush_max", avg: "flat_crush_avg" },
  h2o: { p: "h2o_p", min: "h2o_min", max: "h2o_max", avg: "h2o_avg" },
};

const getProdMetricValue = (
  row: ProductionStatistic,
  metric: MetricKey,
  field: "p" | "min" | "max" | "avg"
) => {
  const key = metricFieldMap[metric][field];
  return parseNumber(row[key] as number | string | null | undefined);
};

const getMeasurementMetricValue = (row: MeasurementRecord, metric: MetricKey) => {
  const value =
    metric === "h2o"
      ? row.humidity
      : metric === "inside_diameter"
        ? row.inside_diameter
        : metric === "outside_diameter"
          ? row.outside_diameter
          : metric === "flat_crush"
            ? row.flat_crush
            : row.length;
  return parseNumber(value);
};

const getStats = (values: number[]) => {
  if (!values.length) {
    return {
      avg: null as number | null,
      min: null as number | null,
      max: null as number | null,
      stdDev: null as number | null,
      count: 0,
    };
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((acc, value) => acc + Math.pow(value - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { avg, min, max, stdDev, count: values.length };
};

export default function StatisticalAnalysisTable() {
  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);
  const formatIsoToDisplay = (iso?: string) => {
    if (!iso) return "";
    const [year, month, day] = iso.split("-");
    if (!year || !month || !day) return "";
    return `${day}/${month}/${year}`;
  };
  const parseDisplayToIso = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
    if (!match) return "";
    const [, day, month, year] = match;
    const iso = `${year}-${month}-${day}`;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return "";
    if (
      parsed.getUTCFullYear() !== Number(year) ||
      parsed.getUTCMonth() + 1 !== Number(month) ||
      parsed.getUTCDate() !== Number(day)
    ) {
      return "";
    }
    return iso;
  };
  const todayDisplay = formatIsoToDisplay(todayIso);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [clientInput, setClientInput] = useState("");
  const [designationInput, setDesignationInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState(todayDisplay);
  const [clientQuery, setClientQuery] = useState("");
  const [designationQuery, setDesignationQuery] = useState("");
  const [startDateQuery, setStartDateQuery] = useState("");
  const [endDateQuery, setEndDateQuery] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const chartRef = useRef<ChartJS<"line"> | null>(null);
  const startDatePickerRef = useRef<HTMLInputElement>(null);
  const endDatePickerRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ProductionStatistic | null>(null);
  const [activeMetric, setActiveMetric] = useState<MetricKey>("length");
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showDesignationSuggestions, setShowDesignationSuggestions] = useState(false);
  const [activeClientIndex, setActiveClientIndex] = useState(-1);
  const [activeDesignationIndex, setActiveDesignationIndex] = useState(-1);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "articleStatistics",
      page,
      limit,
      clientQuery,
      designationQuery,
      startDateQuery,
      endDateQuery,
    ],
    queryFn: () =>
      fetchStatistics({
        page,
        limit,
        client: clientQuery,
        designation: designationQuery,
        startDate: startDateQuery,
        endDate: endDateQuery,
      }),
    enabled: Boolean(clientQuery && designationQuery),
  });

  const {
    data: analysisData,
    isLoading: isAnalysisLoading,
    isError: isAnalysisError,
  } = useQuery({
    queryKey: [
      "articleStatisticsAnalysis",
      clientQuery,
      designationQuery,
      startDateQuery,
      endDateQuery,
    ],
    queryFn: () =>
      fetchAnalysis({
        client: clientQuery,
        designation: designationQuery,
        startDate: startDateQuery,
        endDate: endDateQuery,
      }),
    enabled: Boolean(isModalOpen && clientQuery && designationQuery),
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ["searchSuggestions"],
    queryFn: fetchSuggestions,
    staleTime: 5 * 60 * 1000,
  });

  const rows = data?.data ?? [];
  const totalCount = useMemo(() => data?.total_count ?? rows.length, [data, rows.length]);

  const filteredClientSuggestions = useMemo(() => {
    const input = clientInput.trim().toLowerCase();
    if (!input) return [];
    return (suggestionsData?.clients ?? [])
      .filter((client) => client.toLowerCase().startsWith(input))
      .slice(0, 8);
  }, [clientInput, suggestionsData?.clients]);

  const filteredDesignationSuggestions = useMemo(() => {
    const input = designationInput.trim().toLowerCase();
    if (!input) return [];
    return (suggestionsData?.designations ?? [])
      .filter((designation) => designation.toLowerCase().startsWith(input))
      .slice(0, 8);
  }, [designationInput, suggestionsData?.designations]);

  const metricConfig = useMemo(
    () => ({
      length: {
        label: "Length",
        unit: "mm",
        nominal: parseNumber(selectedRow?.length_p),
        min: parseNumber(selectedRow?.length_min),
        max: parseNumber(selectedRow?.length_max),
      },
      inside_diameter: {
        label: "Inside diameter",
        unit: "mm",
        nominal: parseNumber(selectedRow?.inside_diameter_p),
        min: parseNumber(selectedRow?.inside_diameter_min),
        max: parseNumber(selectedRow?.inside_diameter_max),
      },
      outside_diameter: {
        label: "Outside diameter",
        unit: "mm",
        nominal: parseNumber(selectedRow?.outside_diameter_p),
        min: parseNumber(selectedRow?.outside_diameter_min),
        max: parseNumber(selectedRow?.outside_diameter_max),
      },
      flat_crush: {
        label: "Flat crush",
        unit: "kN",
        nominal: parseNumber(selectedRow?.flat_crush_p),
        min: parseNumber(selectedRow?.flat_crush_min),
        max: parseNumber(selectedRow?.flat_crush_max),
      },
      h2o: {
        label: "H₂O",
        unit: "%",
        nominal: parseNumber(selectedRow?.h2o_p),
        min: parseNumber(selectedRow?.h2o_min),
        max: parseNumber(selectedRow?.h2o_max),
      },
    }),
    [selectedRow]
  );

  const analysisRows = useMemo(() => analysisData?.data ?? [], [analysisData]);
  const measurementRows = useMemo(
    () => (analysisData?.measurements ?? []) as MeasurementRecord[],
    [analysisData]
  );

  const activeSpecifications = useMemo(() => {
    if (!selectedRow) {
      return { nominal: null as number | null, min: null as number | null, max: null as number | null };
    }

    const minValues: number[] = [];
    const maxValues: number[] = [];

    analysisRows.forEach((row) => {
      const minValue = getProdMetricValue(row, activeMetric, "min");
      const maxValue = getProdMetricValue(row, activeMetric, "max");
      if (minValue !== null && minValue !== 0) minValues.push(minValue);
      if (maxValue !== null && maxValue !== 0) maxValues.push(maxValue);
    });

    return {
      nominal: getProdMetricValue(selectedRow, activeMetric, "p"),
      min: minValues.length ? Math.min(...minValues) : null,
      max: maxValues.length ? Math.max(...maxValues) : null,
    };
  }, [selectedRow, activeMetric, analysisRows]);

  const measurementStats = useMemo(() => {
    const valuesByMetric = {
      length: [] as number[],
      inside_diameter: [] as number[],
      outside_diameter: [] as number[],
      flat_crush: [] as number[],
      h2o: [] as number[],
    };

    measurementRows.forEach((row) => {
      (Object.keys(valuesByMetric) as MetricKey[]).forEach((metric) => {
        const value = getMeasurementMetricValue(row, metric);
        if (value !== null) valuesByMetric[metric].push(value);
      });
    });

    const buildMetricStats = (
      metricValues: number[],
      specMin: number | null,
      specMax: number | null
    ) => {
      const stats = getStats(metricValues);
      const minValue = metricValues.length ? Math.min(...metricValues) : null;
      const maxValue = metricValues.length ? Math.max(...metricValues) : null;
      const capabilityUpper =
        stats.avg !== null &&
        stats.stdDev !== null &&
        stats.stdDev !== 0 &&
        specMax !== null
          ? Math.abs(specMax - stats.avg) / stats.stdDev
          : null;
      const capabilityLower =
        stats.avg !== null &&
        stats.stdDev !== null &&
        stats.stdDev !== 0 &&
        specMin !== null
          ? Math.abs(stats.avg - specMin) / stats.stdDev
          : null;
      const capabilityCandidates = [capabilityUpper, capabilityLower].filter(
        (value): value is number => typeof value === "number"
      );
      const capability = capabilityCandidates.length
        ? Math.min(...capabilityCandidates)
        : null;
      return {
        avg: stats.avg,
        min: minValue,
        max: maxValue,
        stdDev: stats.stdDev,
        capability,
        count: stats.count,
      };
    };

    return {
      length: buildMetricStats(measurementRows.length ? valuesByMetric.length : [], metricConfig.length.min, metricConfig.length.max),
      inside_diameter: buildMetricStats(
        measurementRows.length ? valuesByMetric.inside_diameter : [],
        metricConfig.inside_diameter.min,
        metricConfig.inside_diameter.max
      ),
      outside_diameter: buildMetricStats(
        measurementRows.length ? valuesByMetric.outside_diameter : [],
        metricConfig.outside_diameter.min,
        metricConfig.outside_diameter.max
      ),
      flat_crush: buildMetricStats(
        measurementRows.length ? valuesByMetric.flat_crush : [],
        metricConfig.flat_crush.min,
        metricConfig.flat_crush.max
      ),
      h2o: buildMetricStats(
        measurementRows.length ? valuesByMetric.h2o : [],
        metricConfig.h2o.min,
        metricConfig.h2o.max
      ),
    };
  }, [measurementRows, metricConfig]);

  const chartPoints = useMemo(() => {
    const buckets = new Map<string, { sum: number; count: number; date: Date }>();
    const fallbackStart = new Date();
    fallbackStart.setFullYear(fallbackStart.getFullYear() - 1);
    const startDate = startDateQuery ? new Date(startDateQuery) : fallbackStart;
    const endDate = endDateQuery ? new Date(endDateQuery) : new Date();
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endCursor = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (cursor <= endCursor) {
      const key = formatMonthKey(cursor);
      buckets.set(key, { sum: 0, count: 0, date: new Date(cursor) });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    measurementRows.forEach((row) => {
      if (!row.import_datetime) return;
      const date = new Date(row.import_datetime);
      if (Number.isNaN(date.getTime())) return;
      const monthKey = formatMonthKey(date);
      const value = getMeasurementMetricValue(row, activeMetric);
      if (value === null) return;

      const entry =
        buckets.get(monthKey) ?? {
          sum: 0,
          count: 0,
          date: new Date(date.getFullYear(), date.getMonth(), 1),
        };
      entry.sum += value;
      entry.count += 1;
      buckets.set(monthKey, entry);
    });

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, entry]) => {
        const label = entry.date.toLocaleString("en-US", { month: "short", year: "numeric" });
        const average = entry.count ? entry.sum / entry.count : null;
        const rounded = average === null ? null : Number(average.toFixed(2));
        return { label, value: rounded };
      });
  }, [measurementRows, activeMetric, startDateQuery, endDateQuery]);

  const chartYAxis = useMemo(() => {
    const numericValues = chartPoints
      .map((point) => point.value)
      .filter((value): value is number => typeof value === "number");
    const candidates = [
      ...numericValues,
      measurementStats[activeMetric].min,
      measurementStats[activeMetric].max,
    ].filter((value): value is number => typeof value === "number");

    if (!candidates.length) return {};
    const rawMin = Math.min(...candidates);
    const rawMax = Math.max(...candidates);
    const range = rawMax - rawMin;
    const buffer = range === 0 ? Math.max(Math.abs(rawMax) * 0.05, 1) : range * 0.1;
    return {
      suggestedMin: rawMin - buffer,
      suggestedMax: rawMax + buffer,
    };
  }, [chartPoints, measurementStats, activeMetric]);

  const chartData = useMemo(
    () => ({
      labels: chartPoints.map((point) => String(point.label)),
      datasets: [
        {
          label: `${metricConfig[activeMetric].label} (${metricConfig[activeMetric].unit})`,
          data: chartPoints.map((point) => point.value),
          borderColor: "#1D4ED8",
          backgroundColor: "rgba(29, 78, 216, 0.12)",
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: "Upper limit",
          data: chartPoints.map(() => measurementStats[activeMetric].max ?? null),
          borderColor: "#EF4444",
          backgroundColor: "transparent",
          borderWidth: 1,
          borderDash: [6, 4],
          pointRadius: 0,
        },
        {
          label: "Lower limit",
          data: chartPoints.map(() => measurementStats[activeMetric].min ?? null),
          borderColor: "#EF4444",
          backgroundColor: "transparent",
          borderWidth: 1,
          borderDash: [6, 4],
          pointRadius: 0,
        },
      ],
    }),
    [chartPoints, metricConfig, activeMetric, measurementStats]
  );

  const chartFontSize = 9;

  const getAverageDeviation = (avg: number | null, nominal: number | null) =>
    avg === null || nominal === null ? null : Math.abs(avg - nominal);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context: TooltipItem<"line">) => {
              const rawValue =
                context.raw === null || context.raw === undefined
                  ? null
                  : typeof context.raw === "number"
                    ? context.raw
                    : Number(context.raw);
              return `${formatFixed2(rawValue)} ${metricConfig[activeMetric].unit}`;
            },
          },
        },
        datalabels: {
          display: false,
          formatter: (value: number | null) => formatFixed2(value),
        },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x" as const,
          },
          pan: {
            enabled: true,
            mode: "x" as const,
          },
          limits: {
            x: { min: "original" as const, max: "original" as const },
            y: { min: "original" as const, max: "original" as const },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Month", font: { size: chartFontSize } },
          ticks: { maxRotation: 0, font: { size: chartFontSize } },
        },
        y: {
          title: { display: true, text: metricConfig[activeMetric].unit, font: { size: chartFontSize } },
          ticks: {
            font: { size: chartFontSize },
            callback: (value: string | number) => formatFixed2(Number(value)),
          },
          ...chartYAxis,
        },
      },
    }),
    [metricConfig, activeMetric, chartYAxis]
  );

  const buildChartPoints = (metric: MetricKey) => {
    const buckets = new Map<string, { sum: number; count: number; date: Date }>();
    const fallbackStart = new Date();
    fallbackStart.setFullYear(fallbackStart.getFullYear() - 1);
    const startDate = startDateQuery ? new Date(startDateQuery) : fallbackStart;
    const endDate = endDateQuery ? new Date(endDateQuery) : new Date();
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endCursor = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (cursor <= endCursor) {
      const key = formatMonthKey(cursor);
      buckets.set(key, { sum: 0, count: 0, date: new Date(cursor) });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    measurementRows.forEach((row) => {
      if (!row.import_datetime) return;
      const date = new Date(row.import_datetime);
      if (Number.isNaN(date.getTime())) return;
      const monthKey = formatMonthKey(date);
      const value = getMeasurementMetricValue(row, metric);
      if (value === null) return;

      const entry =
        buckets.get(monthKey) ?? {
          sum: 0,
          count: 0,
          date: new Date(date.getFullYear(), date.getMonth(), 1),
        };
      entry.sum += value;
      entry.count += 1;
      buckets.set(monthKey, entry);
    });

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, entry]) => {
        const label = entry.date.toLocaleString("en-US", { month: "short", year: "numeric" });
        const average = entry.count ? entry.sum / entry.count : null;
        const rounded = average === null ? null : Number(average.toFixed(2));
        return { label, value: rounded };
      });
  };

  const getMetricSpecifications = (metric: MetricKey) => ({
    nominal: getProdMetricValue(selectedRow ?? ({} as ProductionStatistic), metric, "p"),
    min: measurementStats[metric].min ?? null,
    max: measurementStats[metric].max ?? null,
  });

  const buildChartYAxis = (
    points: Array<{ label: string; value: number | null }>,
    specs: { min: number | null; max: number | null }
  ) => {
    const numericValues = points
      .map((point) => point.value)
      .filter((value): value is number => typeof value === "number");
    const candidates = [...numericValues, specs.min, specs.max].filter(
      (value): value is number => typeof value === "number"
    );

    if (!candidates.length) return {};
    const rawMin = Math.min(...candidates);
    const rawMax = Math.max(...candidates);
    const range = rawMax - rawMin;
    const buffer = range === 0 ? Math.max(Math.abs(rawMax) * 0.05, 1) : range * 0.1;
    return {
      suggestedMin: rawMin - buffer,
      suggestedMax: rawMax + buffer,
    };
  };

  const buildChartImage = (metric: MetricKey) => {
    const points = buildChartPoints(metric);
    const specs = getMetricSpecifications(metric);
    const yAxis = buildChartYAxis(points, { min: specs.min, max: specs.max });

    const chartData = {
      labels: points.map((point) => String(point.label)),
      datasets: [
        {
          label: `${metricConfig[metric].label} (${metricConfig[metric].unit})`,
          data: points.map((point) => point.value),
          borderColor: "#1D4ED8",
          backgroundColor: "rgba(29, 78, 216, 0.12)",
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
        {
          label: "Upper limit",
          data: points.map(() => specs.max ?? null),
          borderColor: "#EF4444",
          backgroundColor: "transparent",
          borderWidth: 1,
          borderDash: [6, 4],
          pointRadius: 0,
        },
        {
          label: "Lower limit",
          data: points.map(() => specs.min ?? null),
          borderColor: "#EF4444",
          backgroundColor: "transparent",
          borderWidth: 1,
          borderDash: [6, 4],
          pointRadius: 0,
        },
      ],
    };

    const chartOptions = {
      responsive: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        datalabels: { display: false },
        zoom: { zoom: { wheel: { enabled: false }, pinch: { enabled: false } }, pan: { enabled: false } },
      },
      scales: {
        x: {
          ticks: { maxRotation: 0, font: { size: 8 } },
        },
        y: {
          ticks: {
            font: { size: 8 },
            callback: (value: string | number) => formatFixed2(Number(value)),
          },
          ...yAxis,
        },
      },
    };

    const canvas = document.createElement("canvas");
    canvas.width = 820;
    canvas.height = 210;
    const chart = new ChartJS(canvas, {
      type: "line",
      data: chartData,
      options: chartOptions,
    } as any);
    const image = chart.toBase64Image();
    chart.destroy();
    return image;
  };

  const handleSearch = () => {
    const nextClient = clientInput.trim();
    const nextDesignation = designationInput.trim();
    const hasRequired = Boolean(nextClient && nextDesignation);
    setShowValidation(!hasRequired);
    if (!hasRequired) return;
    setPage(1);
    setClientQuery(nextClient);
    setDesignationQuery(nextDesignation);
    setStartDateQuery(parseDisplayToIso(startDateInput));
    setEndDateQuery(parseDisplayToIso(endDateInput));
  };

  const handleClientSuggestionSelect = (value: string) => {
    setClientInput(value);
    setShowClientSuggestions(false);
    setActiveClientIndex(-1);
  };

  const handleDesignationSuggestionSelect = (value: string) => {
    setDesignationInput(value);
    setShowDesignationSuggestions(false);
    setActiveDesignationIndex(-1);
  };

  const handleZoomIn = () => {
    chartRef.current?.zoom(1.2);
  };

  const handleZoomOut = () => {
    chartRef.current?.zoom(0.8);
  };

  const handleResetZoom = () => {
    chartRef.current?.resetZoom();
  };

  const handlePrint = async () => {
    if (!selectedRow) return;

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageHeight = doc.internal.pageSize.getHeight();
    const brandBlue: [number, number, number] = [30, 58, 138];
    const accentBlue: [number, number, number] = [30, 58, 138];
    let cursorY = margin;

    const nominalSummary = [
      formatFixed2(selectedRow.length_p),
      formatFixed2(selectedRow.inside_diameter_p),
      formatFixed2(selectedRow.outside_diameter_p),
      formatFixed2(selectedRow.flat_crush_p),
      formatFixed2(selectedRow.h2o_p),
    ].join(" / ");
    const parsedDates = analysisRows
      .map((row) => row.prod_start_date)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()));
    const dateRangeLabel = parsedDates.length
      ? (() => {
          const minDate = new Date(Math.min(...parsedDates.map((date) => date.getTime())));
          const maxDate = new Date(Math.max(...parsedDates.map((date) => date.getTime())));
          return `${minDate.toLocaleDateString("en-GB")} to ${maxDate.toLocaleDateString("en-GB")}`;
        })()
      : startDateQuery || endDateQuery
        ? `${formatIsoToDisplay(startDateQuery) || "Start"} to ${formatIsoToDisplay(endDateQuery) || "Today"}`
        : "";

    // Header layout shared across pages (compact)
    DrawHorizontalLine(doc, margin, 0);
    cursorY = margin + 18;

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Statistical Analysis Report", margin, cursorY);
    cursorY += 14;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    const clientLabel = `Client: ${selectedRow.client || "—"}`;
    const metaLabel = dateRangeLabel ? `${clientLabel}  •  Date range: ${dateRangeLabel}` : clientLabel;
    doc.text(metaLabel, margin, cursorY);
    cursorY += 12;
    DrawHorizontalLine(doc, margin, cursorY - margin);
    cursorY += 12;

                    autoTable(doc, {
                      startY: cursorY,
                      head: [["Specifications", "Value"]],
                      body: [
                        ["Nominal metrics", nominalSummary],
                        ["Nominal", formatFixed2(activeSpecifications.nominal)],
                        ["Upper limit", formatFixed2(activeSpecifications.max)],
                        ["Lower limit", formatFixed2(activeSpecifications.min)],
                      ],
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 4 },
      headStyles: { fillColor: accentBlue, textColor: 255, fontSize: 11 },
    });
    cursorY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 14 : cursorY + 14;

    autoTable(doc, {
      startY: cursorY,
      head: [["Measurements", "Value"]],
      body: [
        ["Average", formatFixed2(measurementStats[activeMetric].avg)],
        ["Minimum", formatFixed2(measurementStats[activeMetric].min)],
        ["Maximum", formatFixed2(measurementStats[activeMetric].max)],
      ],
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 4 },
      headStyles: { fillColor: accentBlue, textColor: 255, fontSize: 11 },
    });
    cursorY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 14 : cursorY + 14;

    autoTable(doc, {
      startY: cursorY,
      head: [["Variability", "Value"]],
      body: [["Standard deviation", formatFixed2(measurementStats[activeMetric].stdDev)]],
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 4 },
      headStyles: { fillColor: accentBlue, textColor: 255, fontSize: 11 },
    });
    cursorY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 14 : cursorY + 14;

    autoTable(doc, {
      startY: cursorY,
      head: [["Metric", "Length", "Inside dia", "Outside dia", "Flat crush", "H₂O"]],
      body: [
        [
          "Average",
          formatFixed2(measurementStats.length.avg),
          formatFixed2(measurementStats.inside_diameter.avg),
          formatFixed2(measurementStats.outside_diameter.avg),
          formatFixed2(measurementStats.flat_crush.avg),
          formatFixed2(measurementStats.h2o.avg),
        ],
        [
          "Average std dev",
          formatFixed2(measurementStats.length.stdDev),
          formatFixed2(measurementStats.inside_diameter.stdDev),
          formatFixed2(measurementStats.outside_diameter.stdDev),
          formatFixed2(measurementStats.flat_crush.stdDev),
          formatFixed2(measurementStats.h2o.stdDev),
        ],
        [
          "Average capability",
          formatFixed2(measurementStats.length.capability),
          formatFixed2(measurementStats.inside_diameter.capability),
          formatFixed2(measurementStats.outside_diameter.capability),
          formatFixed2(measurementStats.flat_crush.capability),
          formatFixed2(measurementStats.h2o.capability),
        ],
        [
          "Sample size",
          formatCount(measurementStats.length.count),
          formatCount(measurementStats.inside_diameter.count),
          formatCount(measurementStats.outside_diameter.count),
          formatCount(measurementStats.flat_crush.count),
          formatCount(measurementStats.h2o.count),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: brandBlue, textColor: 255, fontSize: 10 },
    });

    doc.setFont("times", "italic");
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, margin, pageHeight - 20);

    // Charts page (match page 1 header layout)
    doc.addPage();
    const chartsPage = doc.getNumberOfPages();
    doc.setPage(chartsPage);

    DrawHorizontalLine(doc, margin, 0);
    cursorY = margin + 18;

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Statistical Analysis Report", margin, cursorY);
    cursorY += 14;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    const chartMetaLabel = dateRangeLabel
      ? `Client: ${selectedRow.client || "—"}  •  Date range: ${dateRangeLabel}`
      : `Client: ${selectedRow.client || "—"}`;
    doc.text(chartMetaLabel, margin, cursorY);
    cursorY += 12;
    DrawHorizontalLine(doc, margin, cursorY - margin);

    const chartImages = {
      length: buildChartImage("length"),
      inside_diameter: buildChartImage("inside_diameter"),
      outside_diameter: buildChartImage("outside_diameter"),
      flat_crush: buildChartImage("flat_crush"),
      h2o: buildChartImage("h2o"),
    };

    DrawGraphLabel(doc, "length", margin, chartImages.length);
    DrawGraphLabel(doc, "inside", margin, chartImages.inside_diameter);
    DrawGraphLabel(doc, "outside", margin, chartImages.outside_diameter);
    DrawGraphLabel(doc, "flat_crush", margin, chartImages.flat_crush);
    DrawGraphLabel(doc, "h2o", margin, chartImages.h2o);

    const footerY = margin + 710;
    DrawHorizontalLine(doc, margin, footerY);

    const safeClient = (selectedRow.client || "report")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "");
    doc.save(`statistical_analysis_${safeClient || "report"}.pdf`);
  };

  return (
    <div className="overflow-visible w-full text-black">
      <div className="flex-1 flex flex-col gap-y-3 h-full min-w-0 px-6 py-4">
        <div className="w-full bg-gradient-to-br from-blue-50/70 to-blue-100/40 p-4 rounded-xl shadow-lg border border-blue-200/30 overflow-visible">
          <div className="flex flex-nowrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <input
                type="text"
                value={clientInput}
                onChange={(event) => {
                  setClientInput(event.target.value);
                  setShowClientSuggestions(true);
                  setActiveClientIndex(-1);
                }}
                onFocus={() => setShowClientSuggestions(true)}
                onBlur={() => setTimeout(() => setShowClientSuggestions(false), 150)}
                className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 tracking-wide focus:border-blue-600 focus:outline-none shadow-sm"
                placeholder="Client"
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && filteredClientSuggestions.length) {
                    event.preventDefault();
                    setShowClientSuggestions(true);
                    setActiveClientIndex((prev) =>
                      prev < filteredClientSuggestions.length - 1 ? prev + 1 : 0
                    );
                    return;
                  }
                  if (event.key === "ArrowUp" && filteredClientSuggestions.length) {
                    event.preventDefault();
                    setShowClientSuggestions(true);
                    setActiveClientIndex((prev) =>
                      prev > 0 ? prev - 1 : filteredClientSuggestions.length - 1
                    );
                    return;
                  }
                  if (event.key === "Enter") {
                    if (showClientSuggestions && activeClientIndex >= 0) {
                      event.preventDefault();
                      handleClientSuggestionSelect(filteredClientSuggestions[activeClientIndex]);
                      return;
                    }
                    handleSearch();
                  }
                  if (event.key === "Escape") {
                    setShowClientSuggestions(false);
                    setActiveClientIndex(-1);
                  }
                }}
              />
              {showClientSuggestions && filteredClientSuggestions.length > 0 && (
                <ul className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg text-xs text-slate-700 max-h-48 overflow-auto">
                  {filteredClientSuggestions.map((client, index) => (
                    <li
                      key={`${client}-${index}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleClientSuggestionSelect(client);
                      }}
                      className={`px-3 py-2 cursor-pointer transition ${
                        index === activeClientIndex ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50"
                      }`}
                    >
                      {client}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <input
                type="text"
                value={designationInput}
                onChange={(event) => {
                  setDesignationInput(event.target.value);
                  setShowDesignationSuggestions(true);
                  setActiveDesignationIndex(-1);
                }}
                onFocus={() => setShowDesignationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDesignationSuggestions(false), 150)}
                className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 tracking-wide focus:border-blue-600 focus:outline-none shadow-sm"
                placeholder="Designation"
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && filteredDesignationSuggestions.length) {
                    event.preventDefault();
                    setShowDesignationSuggestions(true);
                    setActiveDesignationIndex((prev) =>
                      prev < filteredDesignationSuggestions.length - 1 ? prev + 1 : 0
                    );
                    return;
                  }
                  if (event.key === "ArrowUp" && filteredDesignationSuggestions.length) {
                    event.preventDefault();
                    setShowDesignationSuggestions(true);
                    setActiveDesignationIndex((prev) =>
                      prev > 0 ? prev - 1 : filteredDesignationSuggestions.length - 1
                    );
                    return;
                  }
                  if (event.key === "Enter") {
                    if (showDesignationSuggestions && activeDesignationIndex >= 0) {
                      event.preventDefault();
                      handleDesignationSuggestionSelect(
                        filteredDesignationSuggestions[activeDesignationIndex]
                      );
                      return;
                    }
                    handleSearch();
                  }
                  if (event.key === "Escape") {
                    setShowDesignationSuggestions(false);
                    setActiveDesignationIndex(-1);
                  }
                }}
              />
              {showDesignationSuggestions && filteredDesignationSuggestions.length > 0 && (
                <ul className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg text-xs text-slate-700 max-h-48 overflow-auto">
                  {filteredDesignationSuggestions.map((designation, index) => (
                    <li
                      key={`${designation}-${index}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleDesignationSuggestionSelect(designation);
                      }}
                      className={`px-3 py-2 cursor-pointer transition ${
                        index === activeDesignationIndex
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-blue-50"
                      }`}
                    >
                      {designation}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 rounded-full bg-blue-700 text-white text-xs font-semibold shadow-md hover:bg-blue-800 transition-all duration-300"
          >
            Search
          </button>
          <div className="flex flex-col min-w-[120px] shrink-0">
            <label className="text-[10px] font-semibold text-blue-700 mb-1 uppercase tracking-wide">
              Start Date:
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                value={startDateInput}
                onChange={(event) => setStartDateInput(event.target.value)}
                className="w-full px-2.5 py-2 pr-9 rounded-lg border border-blue-200/60 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
              />
              <input
                ref={startDatePickerRef}
                type="date"
                value={parseDisplayToIso(startDateInput)}
                onChange={(event) => setStartDateInput(formatIsoToDisplay(event.target.value))}
                className="absolute inset-0 opacity-0"
                aria-hidden="true"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => {
                  const picker = startDatePickerRef.current;
                  if (!picker) return;
                  if (picker.showPicker) {
                    picker.showPicker();
                  } else {
                    picker.focus();
                    picker.click();
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700 transition"
                aria-label="Open start date picker"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-col min-w-[120px] shrink-0">
            <label className="text-[10px] font-semibold text-blue-700 mb-1 uppercase tracking-wide">
              End Date:
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                value={endDateInput}
                onChange={(event) => setEndDateInput(event.target.value)}
                className="w-full px-2.5 py-2 pr-9 rounded-lg border border-blue-200/60 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
              />
              <input
                ref={endDatePickerRef}
                type="date"
                value={parseDisplayToIso(endDateInput)}
                onChange={(event) => setEndDateInput(formatIsoToDisplay(event.target.value))}
                className="absolute inset-0 opacity-0"
                aria-hidden="true"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={() => {
                  const picker = endDatePickerRef.current;
                  if (!picker) return;
                  if (picker.showPicker) {
                    picker.showPicker();
                  } else {
                    picker.focus();
                    picker.click();
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700 transition"
                aria-label="Open end date picker"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>
          </div>
        </div>
        {showValidation && (!clientInput.trim() || !designationInput.trim()) && (
          <div className="text-[11px] font-semibold text-red-600">
            Client and designation are required.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-blue-200/30 overflow-hidden">
          <div className="overflow-y-visible">
            <table className="w-full text-center table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <th className="px-3 py-2.5 font-bold text-xs uppercase tracking-wide">Client</th>
                  <th className="px-3 py-2.5 font-bold text-xs uppercase tracking-wide">Length</th>
                  <th className="px-3 py-2.5 font-bold text-xs uppercase tracking-wide">Inside Diameter</th>
                  <th className="px-3 py-2.5 font-bold text-xs uppercase tracking-wide">Outside Diameter</th>
                  <th className="px-3 py-2.5 font-bold text-xs uppercase tracking-wide">Flat Crush</th>
                  <th className="px-3 py-2.5 font-bold text-xs uppercase tracking-wide">H2O</th>
                  <th className="px-3 py-2.5 font-bold text-xs uppercase tracking-wide">Options</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-sm text-slate-500">
                      Loading statistical data...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-sm text-red-600 font-semibold">
                      Unable to load data. Please try again.
                    </td>
                  </tr>
                ) : !clientQuery || !designationQuery ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-sm text-slate-500">
                      Enter a client and designation to search.
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-sm text-slate-500">
                      No production data available.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id ?? row.ofid ?? row.client} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-3 py-2 text-xs font-semibold text-slate-700">{row.client || "Unknown"}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{formatFixed2(row.length_p)}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {formatFixed2(row.inside_diameter_p)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {formatFixed2(row.outside_diameter_p)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{formatFixed2(row.flat_crush_p)}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{formatFixed2(row.h2o_p)}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700 transition"
                          onClick={() => {
                            setSelectedRow(row);
                            setActiveMetric("length");
                            setIsModalOpen(true);
                          }}
                        >
                          Analyze
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-t-2 border-blue-200/50">
                  <td colSpan={7} className="px-4 py-2.5 text-center">
                    <span className="text-xs font-medium text-blue-900">
                      {totalCount
                        ? `${(page - 1) * limit + 1}-${Math.min(
                            page * limit,
                            totalCount
                          )} of ${totalCount} Records Found`
                        : "No Results"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 py-2">
          <ImprovedPagination
            currentPage={page}
            totalCount={totalCount}
            limit={limit}
            onPageChange={(next) => setPage(next)}
            className=""
          />
        </div>
        {isModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-4xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Statistical Analysis</h3>
                  <p className="text-sm text-slate-500">
                      {selectedRow?.client || "Selected client"}
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {[
                      formatFixed2(selectedRow?.length_p),
                      formatFixed2(selectedRow?.inside_diameter_p),
                      formatFixed2(selectedRow?.outside_diameter_p),
                      formatFixed2(selectedRow?.flat_crush_p),
                      formatFixed2(selectedRow?.h2o_p),
                    ].join(" / ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handlePrint}
                    disabled={isAnalysisLoading || isAnalysisError}
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedRow(null);
                    }}
                    className="btn btn-sm btn-circle btn-ghost"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-6">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                      <span>Client:</span>
                    <span className="font-semibold text-slate-700">{selectedRow?.client || "—"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>Parameter:</span>
                    {(Object.keys(metricConfig) as MetricKey[]).map((metric) => (
                      <button
                        key={metric}
                        type="button"
                        onClick={() => setActiveMetric(metric)}
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${
                          activeMetric === metric
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {metricConfig[metric].label}
                      </button>
                    ))}
                  </div>
                </div>

                {isAnalysisLoading ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                      Loading analysis data...
                  </div>
                ) : isAnalysisError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                      Unable to load analysis data for this product set.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <div className="space-y-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Specifications
                          </h4>
                          <div className="mt-3 space-y-1 text-sm text-slate-700">
                            <div className="flex justify-between">
                                <span>Nominal</span>
                              <span className="font-semibold">
                                {formatFixed2(activeSpecifications.nominal)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Upper limit</span>
                              <span className="font-semibold">
                                {formatFixed2(activeSpecifications.max)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Lower limit</span>
                              <span className="font-semibold">
                                {formatFixed2(activeSpecifications.min)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Measurements
                          </h4>
                          <div className="mt-3 space-y-1 text-sm text-slate-700">
                            <div className="flex justify-between">
                                <span>Average</span>
                              <span className="font-semibold">
                                {formatFixed2(measurementStats[activeMetric].avg)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Minimum</span>
                              <span className="font-semibold">
                                {formatFixed2(measurementStats[activeMetric].min)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Maximum</span>
                              <span className="font-semibold">
                                {formatFixed2(measurementStats[activeMetric].max)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Variability
                          </h4>
                          <div className="mt-3 flex justify-between text-sm text-slate-700">
                              <span>Standard deviation</span>
                            <span className="font-semibold">
                              {formatFixed2(measurementStats[activeMetric].stdDev)}
                            </span>
                          </div>
                        </div>


                      </div>

                      <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Measurement trend
                          </h4>
                          <div className="flex items-center gap-2">
                            <button type="button" className="btn btn-xs btn-outline" onClick={handleZoomOut}>
                              Zoom out
                            </button>
                            <button type="button" className="btn btn-xs btn-outline" onClick={handleZoomIn}>
                              Zoom in
                            </button>
                            <button type="button" className="btn btn-xs btn-ghost" onClick={handleResetZoom}>
                              Reset
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 h-64">
                          {chartPoints.length ? (
                            <Line ref={chartRef} data={chartData} options={chartOptions} />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                No measurement data available for this parameter.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Overall product statistics
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-center text-xs">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-3 py-2 text-left">Metric</th>
                              <th className="px-3 py-2">Length</th>
                              <th className="px-3 py-2">Inside dia</th>
                              <th className="px-3 py-2">Outside dia</th>
                              <th className="px-3 py-2">Flat crush</th>
                              <th className="px-3 py-2">H₂O</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-700">
                            <tr>
                              <td className="px-3 py-2 text-left font-semibold">Average deviation</td>
                              <td className="px-3 py-2">
                                {formatFixed2(
                                  getAverageDeviation(
                                    measurementStats.length.avg,
                                    metricConfig.length.nominal
                                  )
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {formatFixed2(
                                  getAverageDeviation(
                                    measurementStats.inside_diameter.avg,
                                    metricConfig.inside_diameter.nominal
                                  )
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {formatFixed2(
                                  getAverageDeviation(
                                    measurementStats.outside_diameter.avg,
                                    metricConfig.outside_diameter.nominal
                                  )
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {formatFixed2(
                                  getAverageDeviation(
                                    measurementStats.flat_crush.avg,
                                    metricConfig.flat_crush.nominal
                                  )
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {formatFixed2(
                                  getAverageDeviation(
                                    measurementStats.h2o.avg,
                                    metricConfig.h2o.nominal
                                  )
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 text-left font-semibold">Average std dev</td>
                              <td className="px-3 py-2">{formatFixed2(measurementStats.length.stdDev)}</td>
                              <td className="px-3 py-2">
                                {formatFixed2(measurementStats.inside_diameter.stdDev)}
                              </td>
                              <td className="px-3 py-2">
                                {formatFixed2(measurementStats.outside_diameter.stdDev)}
                              </td>
                              <td className="px-3 py-2">{formatFixed2(measurementStats.flat_crush.stdDev)}</td>
                              <td className="px-3 py-2">{formatFixed2(measurementStats.h2o.stdDev)}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 text-left font-semibold">Average capability</td>
                              <td className="px-3 py-2">{formatFixed2(measurementStats.length.capability)}</td>
                              <td className="px-3 py-2">
                                {formatFixed2(measurementStats.inside_diameter.capability)}
                              </td>
                              <td className="px-3 py-2">
                                {formatFixed2(measurementStats.outside_diameter.capability)}
                              </td>
                              <td className="px-3 py-2">{formatFixed2(measurementStats.flat_crush.capability)}</td>
                              <td className="px-3 py-2">{formatFixed2(measurementStats.h2o.capability)}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 text-left font-semibold">Sample size</td>
                              <td className="px-3 py-2">{formatCount(measurementStats.length.count)}</td>
                              <td className="px-3 py-2">
                                {formatCount(measurementStats.inside_diameter.count)}
                              </td>
                              <td className="px-3 py-2">
                                {formatCount(measurementStats.outside_diameter.count)}
                              </td>
                              <td className="px-3 py-2">{formatCount(measurementStats.flat_crush.count)}</td>
                              <td className="px-3 py-2">{formatCount(measurementStats.h2o.count)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-action" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
