"use client";
import React from "react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { create } from "domain";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar } from "lucide-react";

import { useMutation, useQuery } from "@tanstack/react-query";

// packages to generate the different charts
import { Chart } from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
Chart.register(ChartDataLabels);

// necessary functions in building the PDF files
import {
  drawH2OLabel,
  DrawGraphLabel,
  DrawHorizontalLine,
  DrawLeftHeader,
  DrawMainHeader,
  DrawRightHeader,
  DrawMeasurementTables,
  DrawFlatCrushH2OTable,
  DrawPage1StyleFooter,
  WriteH2OItalic,
} from "./PDFBuilder";
import { formatNumberWithDecimals } from "@/utils/formatNumber";

// necessary packages for exporting zip files
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface DownloadOrderListViewProps {
  label?: string;
  className?: string;
  fileName?: string;
  onPDFGenerated?: (blob: Blob) => void;
  mode?: "download" | "preview" | "both";
  selectedOrders?: any[]; // Array of selected order objects
}

type Measurement = {
  length?: number;
  inside_diameter?: number;
  outside_diameter?: number;
  flat_crush?: number;
  h2o?: number;
  [key: string]: any;
};

type chartData = {
  // declaration type will be used for the charts
  data: number;
  palette_count: number;
};

export default function DownloadOrderListView({
  label = "Download",
  className = "",
  fileName = "quality_control_report.pdf",
  onPDFGenerated,
  mode = "preview",
  selectedOrders = [], // Array of selected order objects from the rows
}: DownloadOrderListViewProps) {
  const [isDisabled, setIsDisabled] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("Download");
  const [isLoading, setIsLoading] = useState(false);
  
  // State for modal and matching articles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchingArticlesByOfid, setMatchingArticlesByOfid] = useState<Record<string, any[]>>({});
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  const [mounted, setMounted] = useState(false);
  // State for selected articles: { ofid: { articleId: articleData } }
  const [selectedArticlesByOfid, setSelectedArticlesByOfid] = useState<Record<string, Record<number, any>>>({});

  // Order details modal (Order Number + Delivery Date) before PDF download
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [orderDetailsForm, setOrderDetailsForm] = useState<Record<string, { orderNumber: string; deliveryDate: string }>>({});
  const [orderDetailsOverrides, setOrderDetailsOverrides] = useState<Record<string, { orderNumber: string; deliveryDate: string }>>({});
  const [isOrderDetailsEditing, setIsOrderDetailsEditing] = useState(false);
  const deliveryDatePickerRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Ensure we're on the client side for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null); // used to refer to the canvas element containing the chart

  // function to get customer specifications data from tbl_article_prod
  const GetCustomerSpecificationsData = async (
    articleProdId: number | string | null | undefined
  ) => {
    const customerSpecificationsDataAggregated = [];

    // Fetch from tbl_article_prod if we have a valid ID
    if (articleProdId && articleProdId !== "***" && !isNaN(Number(articleProdId))) {
      try {
        const response = await fetch(
          `/api/v1/getonearticleprod?id=${encodeURIComponent(articleProdId)}`,
          {
            method: "GET",
            headers: {
              Accept: "*/*",
              "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            },
          }
        );

        if (response.ok) {
          const articleProdResult = await response.json();
          const articleData = articleProdResult[0] || {};
          
          if (articleData) {
            // Helper function to parse text numbers that may have commas (e.g., "1,500.00")
            const parseNumber = (value: any): number | null => {
              if (!value || value === "") return null;
              // Convert to string, remove commas, then parse
              const cleaned = String(value).replace(/,/g, "");
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) ? null : parsed;
            };

            // Same as article creation: display flat crush in kN (divide by 1000 if stored in large form)
            const normalizeFlatCrushForDisplay = (value: number | null): number | null => {
              if (value == null) return null;
              return value > 1000 ? value / 1000 : value;
            };
            // Treat 0 and 0.000 as no value so single-value rule applies (use that value for nominal, min, and max)
            const treatZeroAsNoValue = (value: number | null): number | null => {
              if (value == null) return null;
              if (typeof value === "number" && (value === 0 || Math.abs(value) < 1e-9)) return null;
              return value;
            };

            // Use the direct length/inside_diameter/outside_diameter values from tbl_article_prod for nominal
            // Handle comma-separated numbers properly
            const nominalLength = parseNumber(articleData.length);
            
            const nominalInsideDiameter = parseNumber(articleData.inside_diameter);
            
            const nominalOutsideDiameter = parseNumber(articleData.outside_diameter);
            
            // Resistance: if only one value (min or max), use it for min, max, and nominal; if both min and max, leave nominal blank. Treat 0 as no value.
            const resistanceMin = treatZeroAsNoValue(normalizeFlatCrushForDisplay(parseNumber(articleData.resistance_min)));
            const resistanceMax = treatZeroAsNoValue(normalizeFlatCrushForDisplay(parseNumber(articleData.resistance_max)));
            const hasMin = resistanceMin != null;
            const hasMax = resistanceMax != null;
            const nominalResistance =
              hasMin && hasMax
                ? null
                : hasMin
                  ? resistanceMin
                  : hasMax
                    ? resistanceMax
                    : null;
            const resistanceMinForTable = hasMin ? resistanceMin : (hasMax ? resistanceMax : null);
            const resistanceMaxForTable = hasMax ? resistanceMax : (hasMin ? resistanceMin : null);
            
            // Humidity (H2O): same logic as resistance - single value → use for nominal/min/max; both → nominal blank; treat 0 as no value
            const humidityMinRaw = parseNumber(articleData.humidty_min);
            const humidityMaxRaw = parseNumber(articleData.humidity_max);
            const humidityMin = treatZeroAsNoValue(humidityMinRaw);
            const humidityMax = treatZeroAsNoValue(humidityMaxRaw);
            const hasHumidityMin = humidityMin != null;
            const hasHumidityMax = humidityMax != null;
            const nominalHumidity =
              hasHumidityMin && hasHumidityMax
                ? null
                : hasHumidityMin
                  ? humidityMin
                  : hasHumidityMax
                    ? humidityMax
                    : null;
            const humidityMinForTable = hasHumidityMin ? humidityMin : (hasHumidityMax ? humidityMax : null);
            const humidityMaxForTable = hasHumidityMax ? humidityMax : (hasHumidityMin ? humidityMin : null);

            // Build nominal data (index [0]) - all values are averages
            const nominalData = {
              length: nominalLength,
              inside_diameter: nominalInsideDiameter,
              outside_diameter: nominalOutsideDiameter,
              resistance: nominalResistance,
              humidity: nominalHumidity,
            };

            // Build max data (index [1]) - also parse numbers to handle commas
            const maxData = {
              length: parseNumber(articleData.length_max),
              inside_diameter: parseNumber(articleData.inside_diameter_max),
              outside_diameter: parseNumber(articleData.outside_diameter_max),
              resistance: resistanceMaxForTable,
              humidity: humidityMaxForTable,
            };

            // Build min data (index [2]) - also parse numbers to handle commas
            const minData = {
              length: parseNumber(articleData.length_min),
              inside_diameter: parseNumber(articleData.inside_diameter_min),
              outside_diameter: parseNumber(articleData.outside_diameter_min),
              resistance: resistanceMinForTable,
              humidity: humidityMinForTable,
            };

            customerSpecificationsDataAggregated.push(nominalData, maxData, minData);
          } else {
            customerSpecificationsDataAggregated.push({}, {}, {});
          }
        } else {
          customerSpecificationsDataAggregated.push({}, {}, {});
        }
      } catch (error) {
        console.error("Error fetching article_prod:", error);
        customerSpecificationsDataAggregated.push({}, {}, {});
      }
    } else {
      customerSpecificationsDataAggregated.push({}, {}, {});
    }

    return customerSpecificationsDataAggregated;
  };

  const GetMeasurementData = async (ofid: string) => {
    // Validate ofid
    if (!ofid || ofid === "***" || ofid.trim() === "") {
      console.error("GetMeasurementData: Invalid ofid provided:", ofid);
      toast.error("Invalid order fabrication control number");
      return [] as Measurement[];
    }

    const trimmedOfid = ofid.trim();
    
    console.log("=".repeat(80));
    console.log("GetMeasurementData: Fetching measurements for ofid:", {
      originalOfid: ofid,
      trimmedOfid: trimmedOfid,
      ofidType: typeof ofid,
      ofidLength: ofid.length,
      trimmedLength: trimmedOfid.length,
      hasWhitespace: ofid !== trimmedOfid,
    });
    
    try {
      const url = `/api/v1/getonemeasurementprod?ofid=${encodeURIComponent(trimmedOfid)}`;
      console.log("GetMeasurementData: Request URL:", url);
      
      const responseMeasurementData = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "*/*",
          "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        },
      });

      console.log("GetMeasurementData: Response status:", {
        status: responseMeasurementData.status,
        ok: responseMeasurementData.ok,
        statusText: responseMeasurementData.statusText,
        headers: Object.fromEntries(responseMeasurementData.headers.entries()),
      });

      if (!responseMeasurementData.ok) {
        const errorText = await responseMeasurementData.text();
        console.error("GetMeasurementData: API error response:", {
          status: responseMeasurementData.status,
          statusText: responseMeasurementData.statusText,
          errorText: errorText,
        });
        
        let errorMessage = "Failed to fetch measurement data";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
          console.error("GetMeasurementData: Parsed error JSON:", errorJson);
        } catch (e) {
          console.error("GetMeasurementData: Error text is not JSON:", errorText);
        }
        
        toast.error(errorMessage);
        return [] as Measurement[];
      }

      const measurementData = await responseMeasurementData.json();
      
      console.log("GetMeasurementData: Received data:", {
        ofid: trimmedOfid,
        count: Array.isArray(measurementData) ? measurementData.length : 0,
        isArray: Array.isArray(measurementData),
        firstItem: Array.isArray(measurementData) && measurementData.length > 0 ? {
          id: measurementData[0].id,
          ofid: measurementData[0].ofid,
          palette_num: measurementData[0].palette_num,
          length: measurementData[0].length,
          inside_diameter: measurementData[0].inside_diameter,
          outside_diameter: measurementData[0].outside_diameter,
        } : null,
        fullData: measurementData,
      });

      // Validate that we got an array
      if (!Array.isArray(measurementData)) {
        console.error("GetMeasurementData: Response is not an array:", measurementData);
        toast.error("Invalid measurement data format received");
        return [] as Measurement[];
      }

      // Check if data is empty
      if (measurementData.length === 0) {
        console.warn("GetMeasurementData: No measurements found for ofid:", trimmedOfid);
        toast.error(`No measurements found for order ${trimmedOfid}`);
        return [] as Measurement[];
      }

      console.log("GetMeasurementData: Successfully retrieved", measurementData.length, "measurements");
      console.log("=".repeat(80));
      
      return measurementData as Measurement[];
    } catch (error) {
      console.error("=".repeat(80));
      console.error("GetMeasurementData: Exception occurred:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      console.error("=".repeat(80));
      toast.error("Error fetching measurement data");
      return [] as Measurement[];
    }
  };

  // Function to fetch matching articles for an OFID
  const fetchMatchingArticles = async (ofid: string) => {
    try {
      const response = await fetch(
        `/api/v1/test_resolve_by_ofid?ofid=${encodeURIComponent(ofid)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("API Error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        return [];
      }

      const data = await response.json();
      
      // Debug: Log the full response
      console.log("=== OFID Matching Response ===", {
        ofid: ofid,
        matchCount: data.match_count || 0,
        matchingArticles: data.matching_articles || [],
        productionRecord: data.production_record,
        debug: data.debug,
      });
      
      return data.matching_articles || [];
    } catch (error) {
      console.error("Error fetching matching articles:", error);
      return [];
    }
  };

  // Function to format and log customer specifications in a table
  const logCustomerSpecificationsTable = (
    nominal_data: any,
    min_data: any,
    max_data: any,
    orderNo?: string
  ) => {
    // Helper function to format values (handle null, undefined, and numbers; H2O/humidity → blank when empty)
    const formatValue = (value: any, key?: string): string => {
      if (value === null || value === undefined || value === "") {
        return key === "humidity" ? "" : "No data";
      }
      // If it's a number, format it appropriately
      if (typeof value === "number") {
        return formatNumberWithDecimals(value);
      }
      return String(value);
    };

    const specs = [
      { label: "Length (mm)", key: "length" },
      { label: "Inside Diameter (mm)", key: "inside_diameter" },
      { label: "Outside Diameter (mm)", key: "outside_diameter" },
      { label: "Flat Crush (kN/m)", key: "resistance" },
      { label: "H₂O (%)", key: "humidity" },
    ];

    console.log("\n" + "=".repeat(80));
    console.log(`CUSTOMER SPECIFICATIONS TABLE${orderNo ? ` - Order: ${orderNo}` : ""}`);
    console.log("=".repeat(80));
    console.log(
      "Specification".padEnd(25) +
      "Scoll Nominal".padEnd(18) +
      "Max".padEnd(18) +
      "Min"
    );
    console.log("-".repeat(80));

    specs.forEach((spec) => {
      const nominal = formatValue(nominal_data?.[spec.key], spec.key);
      const max = formatValue(max_data?.[spec.key], spec.key);
      const min = formatValue(min_data?.[spec.key], spec.key);

      console.log(
        spec.label.padEnd(25) +
          nominal.padEnd(18) +
          max.padEnd(18) +
          min
      );
    });

    console.log("=".repeat(80));
    console.log("\n");

    // Also log the raw data structure with foreign key references
    console.log("Raw Data Structure (Foreign Key References):");
    console.log("Article Nominal (tbl_article_prod):", {
      ...nominal_data,
      resistance: nominal_data?.resistance ?? null,
      humidity: nominal_data?.humidity ?? null,
    });
    console.log("Article Max (tbl_article_prod):", {
      ...max_data,
      resistance: max_data?.resistance ?? null,
      humidity: max_data?.humidity ?? null,
    });
    console.log("Article Min (tbl_article_prod):", {
      ...min_data,
      resistance: min_data?.resistance ?? null,
      humidity: min_data?.humidity ?? null,
    });
    
    // Additional info about resistance and humidity
    console.log("\nFlat Crush & H2O Details:");
    console.log("  Nominal - Flat Crush:", nominal_data?.resistance ?? "null/undefined", "| H2O:", nominal_data?.humidity ?? "null/undefined");
    console.log("  Max     - Flat Crush:", max_data?.resistance ?? "null/undefined", "| H2O:", max_data?.humidity ?? "null/undefined");
    console.log("  Min     - Flat Crush:", min_data?.resistance ?? "null/undefined", "| H2O:", min_data?.humidity ?? "null/undefined");
  };

  function calculateStats(data: Measurement[], field: keyof Measurement) {
    // returns the descriptive statistics of the order measurements
    const values = data
      .map((d) => {
        const value = d[field];
        // Convert to number if it's a string
        if (typeof value === "string" && value !== "" && !isNaN(Number(value))) {
          return Number(value);
        }
        return value;
      })
      .filter((v): v is number => typeof v === "number" && !isNaN(v) && v !== 0);


    if (values.length === 0) {
      return { mean: 0, min: 0, max: 0, stdDev: 0 };
    }

    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance =
      values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Helper to fix decimals to 4 places
    const round4 = (num: number) => Number(num.toFixed(4));

    return {
      mean: round4(mean),
      min: round4(min),
      max: round4(max),
      stdDev: round4(stdDev),
    };
  }

  async function generateLineChartImage(
    canvas: HTMLCanvasElement,
    data: chartData[],
    meanValue: number
  ) {
    // Destroy old instance if it exists
    if (canvas && Chart.getChart(canvas)) {
      Chart.getChart(canvas)?.destroy();
    }

    const ctx = canvas.getContext("2d")!;
    
    console.log("DEBUG generateLineChartImage: Received data:", data);
    console.log("DEBUG generateLineChartImage: Data length:", data.length);
    
    // Data should already be filtered and converted, but do a final safety check
    // Only filter if data is still null/undefined/NaN (shouldn't happen if pre-filtered correctly)
    const processedData = data
      .map((d) => {
        // Final conversion check
        let numValue: number | null = null;
        if (d.data != null && d.data !== undefined) {
          if (typeof d.data === 'string' && d.data !== '') {
            numValue = parseFloat(d.data);
          } else if (typeof d.data === 'number') {
            numValue = d.data;
          } else {
            numValue = Number(d.data);
          }
        }
        
        return {
          ...d,
          data: numValue
        };
      })
      .filter((d): d is chartData & { data: number } => {
        const isValid = d.data !== null && 
                        d.data !== undefined && 
                        !isNaN(d.data) && 
                        d.data !== 0 &&
                        typeof d.data === 'number';
        
        if (!isValid) {
          console.log("DEBUG generateLineChartImage: Filtering out:", d);
        }
        
        return isValid;
      });
    
    console.log("DEBUG generateLineChartImage: Processed data:", processedData);
    console.log("DEBUG generateLineChartImage: Processed length:", processedData.length);
    
    // Sort by palette count in ascending order
    const filteredData = processedData.sort((a, b) => a.palette_count - b.palette_count);
    
    console.log("DEBUG generateLineChartImage: Final filtered data:", filteredData);
    
    // Recalculate mean based on filtered data
    const filteredValues = filteredData.map((d) => d.data);
    const recalculatedMean = filteredValues.length > 0 
      ? filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length 
      : meanValue;
    
    const labels = filteredData.map((d) => String(d.palette_count));
    const values = filteredData.map((d) => d.data);

    // Handle single data point case OR all values are the same
    let minVal, maxVal, padding;
    if (values.length === 1) {
      // For single point, create a range around the value
      const singleValue = values[0];
      minVal = singleValue * 0.8; // 20% below
      maxVal = singleValue * 1.2;   // 20% above
      padding = (maxVal - minVal) * 0.1;
    } else if (values.length === 0) {
      // No data case
      minVal = 0;
      maxVal = 1;
      padding = 0.1;
    } else {
      minVal = Math.min(...values);
      maxVal = Math.max(...values);
      
      // Handle case where all values are the same (minVal === maxVal)
      if (minVal === maxVal) {
        // Create a range around the constant value, similar to single point
        const constantValue = minVal;
        minVal = constantValue * 0.8; // 20% below
        maxVal = constantValue * 1.2;   // 20% above
        padding = (maxVal - minVal) * 0.1;
      } else {
        padding = (maxVal - minVal) * 0.1; // 10% headroom
      }
    }
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels, // your x values
        datasets: [
          {
            data: values, // your y values
            borderColor: "rgba(29, 78, 216, 1)",
            backgroundColor: "rgba(29, 78, 216, 0.2)",
            borderWidth: 1,
            tension: 0.3,
            pointRadius: values.length === 1 ? 4 : 1, // Larger point for single data
          },
          // Mean point dataset
          {
            label: "Mean",
            data: new Array(values.length)
              .fill(null)
              .map((_, i) =>
                i === Math.floor(values.length / 2) ? recalculatedMean : null
              ),
            borderColor: "red",
            backgroundColor: "red",
            pointRadius: 1.5,
            pointHoverRadius: 6,
            showLine: false,
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            align: (ctx) => (ctx.dataIndex % 2 === 0 ? "top" : "bottom"), // position above point
            anchor: "center", // attach to the point
            font: {
              size: 8,
            },
            offset: -1,
            formatter: (value: number) =>
              value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }), // show formatted labels too
          },
        },
        scales: {
          y: {
            ticks: {
              font: {
                size: 10,
              },
              stepSize: 5,
              callback: (value) =>
                Number(value).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }), // 1,234.56 style
            },
            min: minVal - padding,
            max: maxVal + padding,
          },
          x: {
            ticks: {
              font: {
                size: 10,
              },
              callback: (value, index) => labels[index],
            },
          },
        },
      },
      plugins: [
        {
          id: "meanLine",
          afterDraw: (chart) => {
            const yScale = chart.scales.y;
            const ctx = chart.ctx;

            // Mean line (always draw when valid)
            const meanToUse = isNaN(recalculatedMean) || recalculatedMean === 0 ? meanValue : recalculatedMean;
            const y = yScale.getPixelForValue(meanToUse);
            if (y >= chart.chartArea.top && y <= chart.chartArea.bottom) {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(chart.chartArea.left, y);
              ctx.lineTo(chart.chartArea.right, y);
              ctx.strokeStyle = "red";
              ctx.lineWidth = 1.5;
              ctx.setLineDash([5, 5]);
              ctx.stroke();
              ctx.restore();
            }

            // Min/max dotted lines only when there are more than 2 points, with allowance (margin) beyond data range
            if (values.length > 2) {
              const dataMin = Math.min(...values);
              const dataMax = Math.max(...values);
              const range = dataMax - dataMin;
              // Allowance: 10% of range on each side; if range is 0 use 1% of value or small constant
              const allowance =
                range > 0 ? range * 0.1 : Math.max(Math.abs(dataMin) * 0.01, 0.01);
              const lowerLine = dataMin - allowance;
              const upperLine = dataMax + allowance;

              const yMin = yScale.getPixelForValue(lowerLine);
              const yMax = yScale.getPixelForValue(upperLine);
              ctx.save();
              ctx.strokeStyle = "red";
              ctx.lineWidth = 1.5;
              ctx.setLineDash([5, 5]);
              if (yMin >= chart.chartArea.top && yMin <= chart.chartArea.bottom) {
                ctx.beginPath();
                ctx.moveTo(chart.chartArea.left, yMin);
                ctx.lineTo(chart.chartArea.right, yMin);
                ctx.stroke();
              }
              if (yMax >= chart.chartArea.top && yMax <= chart.chartArea.bottom && yMax !== yMin) {
                ctx.beginPath();
                ctx.moveTo(chart.chartArea.left, yMax);
                ctx.lineTo(chart.chartArea.right, yMax);
                ctx.stroke();
              }
              ctx.restore();
            }
          },
        },
      ],
    });

    const imageUrl = canvas.toDataURL("image/png");
    chart.destroy(); // free up the canvas for reuse
    return imageUrl;
  }

  // Format YYYY-MM-DD to DD/MM/YYYY for display
  const formatToDDMMYYYY = (yyyyMmDd: string): string => {
    if (!yyyyMmDd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return yyyyMmDd || "—";
    const [y, m, d] = yyyyMmDd.split("-");
    return `${d}/${m}/${y}`;
  };

  // Parse user input in DD/MM/YYYY format to YYYY-MM-DD for storage
  const parseDDMMYYYYToStorage = (input: string): string => {
    const trimmed = (input || "").trim();
    if (!trimmed) return "";
    const parts = trimmed.split("/").map((p) => p.trim());
    if (parts.length !== 3) return "";
    const [d, m, y] = parts.map((p) => parseInt(p, 10));
    if (isNaN(d) || isNaN(m) || isNaN(y)) return "";
    const year = y < 100 ? 2000 + y : y;
    if (m < 1 || m > 12 || d < 1 || d > 31) return "";
    return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  // Parse delivery_date from tbl_prod to YYYY-MM-DD (no fallbacks)
  const parseDeliveryDateToYYYYMMDD = (value: any): string => {
    if (value == null || value === "") return "";
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      const parts = trimmed.split("/").map((p) => p.trim());
      if (parts.length === 3) {
        const [a, b, c] = parts.map((p) => parseInt(p, 10));
        if (c != null && b != null && a != null && !isNaN(a) && !isNaN(b) && !isNaN(c)) {
          const year = c < 100 ? 2000 + c : c;
          const month = a <= 12 ? a : b;
          const day = a <= 12 ? b : a;
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
        }
      }
    }
    return "";
  };

  // Build initial order details from order (tbl_prod order_number and delivery_date only, no fallbacks)
  const getInitialOrderDetails = (order: any) => {
    const orderNumber = order?.order_number != null && order.order_number !== "" ? String(order.order_number) : "";
    const deliveryDate = parseDeliveryDateToYYYYMMDD(order?.delivery_date);
    return { orderNumber, deliveryDate };
  };

  // Function to proceed with PDF generation (extracted from original handleClick)
  const proceedWithPDFGeneration = async (
    overrideSelectedArticles?: Record<string, Record<number, any>>,
    overrides?: Record<string, { orderNumber: string; deliveryDate: string }>
  ) => {
    setIsLoading(true);
    setButtonLabel("Downloading...");
    setIsDisabled(true);
    try {
      const pdfs: any[] = [];

      // Flatten selected orders with their selected articles
      // If multiple articles are selected for an order, generate multiple PDFs
      const ordersToProcess: Array<{ order: any; article: any | null }> = [];
      
      // Use override if provided (for auto-selection), otherwise use state
      const articlesToUse = overrideSelectedArticles || selectedArticlesByOfid;
      
      selectedOrders.forEach((order: any) => {
        const ofid = String(order.order_fabrication_control);
        const selectedArticles = articlesToUse[ofid];
        
        if (selectedArticles && Object.keys(selectedArticles).length > 0) {
          // Generate a PDF for each selected article
          Object.values(selectedArticles).forEach((article: any) => {
            ordersToProcess.push({ order, article });
          });
        } else {
          // No selection made, use order's default article (null means use order.tbl_article)
          ordersToProcess.push({ order, article: null });
        }
      });

      await Promise.all(
        ordersToProcess.map(async ({ order, article }) => {
          // map over orders to process (may include multiple PDFs per order if multiple articles selected)
          const get = (v: any, fallback = "***") =>
            v === null || v === undefined || v === "" ? fallback : String(v);

          // to be placed at the bottom left of the first page
          const current_date = new Date().toLocaleDateString("en-GB");

          // get company name
          const company_name = get(order.tbl_customer.company_name);

          let customer: string = "";

          // get customer name
          if (order.tbl_customer.customer_id == null) {
            customer = "____________________________";
          } else {
            customer = get(
              order.tbl_customer.first_name +
                " " +
                order.tbl_customer.middle_name +
                " " +
                order.tbl_customer.last_name
            ).toUpperCase();
          }

          const ofid = String(order.order_fabrication_control);
          const detailsOverride = (overrides ?? orderDetailsOverrides)[ofid];
          // Order number for PDF: override from modal, else tbl_prod.order_number only (no fallback)
          const orderNo = detailsOverride?.orderNumber?.trim() ?? (order?.order_number != null && order.order_number !== "" ? String(order.order_number) : "");

          // fetch measurements data using OFID (not order number)
          const measurementData = await GetMeasurementData(ofid);

          // Determine which article_prod ID to use
          let articleProdId: number | null = null;
          
          if (article) {
            // Use the selected article's ID from modal
            // The article object from test_resolve_by_ofid has:
            // - article.id: the article_prod_id from the candidate match
            // - article.original_article.id: also the article_prod_id (most reliable)
            articleProdId = article?.original_article?.id || article?.id || article?.article_prod_id || null;
            console.log("PDF Generation - Article selected:", {
              articleId: article?.id,
              originalArticleId: article?.original_article?.id,
              articleProdId: articleProdId,
              articleName: article?.article_name,
              hasOriginalArticle: !!article?.original_article,
            });
          } else {
            // Fallback to order's article_id (assuming it now points to tbl_article_prod)
            articleProdId = order.article_id || order.tbl_article_prod?.id || null;
            console.log("PDF Generation - Using order's article_id:", {
              orderArticleId: order.article_id,
              orderTblArticleProdId: order.tbl_article_prod?.id,
              articleProdId: articleProdId,
            });
          }
          
          console.log("PDF Generation - Fetching customer specifications for article_prod_id:", articleProdId);
          const customerSpecificationsData =
            await GetCustomerSpecificationsData(
              articleProdId ? Number(articleProdId) : null
            );
          console.log("PDF Generation - Customer specifications data:", {
            nominal: customerSpecificationsData[0],
            max: customerSpecificationsData[1],
            min: customerSpecificationsData[2],
          });

          // customer specifications data
          const nominal_data = customerSpecificationsData[0] || {};
          const max_data = customerSpecificationsData[1] || {};
          const min_data = customerSpecificationsData[2] || {};

          // Log formatted table of customer specifications
          logCustomerSpecificationsTable(nominal_data, min_data, max_data, orderNo);

          // get all the descriptive statistics of the order for each measurement
          const orderLengthStats = calculateStats(measurementData, "length");
          const orderInsideDiameterStats = calculateStats(
            measurementData,
            "inside_diameter"
          );
          const orderOutsideDiameterStats = calculateStats(
            measurementData,
            "outside_diameter"
          );
          const orderFlatCrushStats = calculateStats(
            measurementData,
            "flat_crush"
          );
          const orderH2OStats = calculateStats(measurementData, "h2o");

          // format delivery date only: override from modal, else tbl_prod.delivery_date only (no fallback)
          let deliveryDateFormatted: string;
          const dateSource = detailsOverride?.deliveryDate?.trim() || parseDeliveryDateToYYYYMMDD(order?.delivery_date);
          if (dateSource) {
            try {
              const d = new Date(dateSource);
              deliveryDateFormatted = isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB");
            } catch (_) {
              deliveryDateFormatted = "";
            }
          } else {
            deliveryDateFormatted = "";
          }

          // format production date only (no time)
          const productionDate = get(order.created_at);
          const productionDateFormatted = new Date(
            productionDate
          ).toLocaleDateString("en-GB");

          // dynamically import jspdf to reduce bundle size
          const { default: jsPDF } = await import("jspdf");

          // Page 01 start
          const doc = new jsPDF({ unit: "pt", format: "a4" });
          const pageWidth = doc.internal.pageSize.getWidth(); // stores the width for all pages
          const margin = 40;

          // Load logo for header (used on page 1, page 2, and in post-pass for all pages)
          let logo: HTMLImageElement | null = null;
          let logoBase64: string | undefined;
          try {
            const logoImg = new Image();
            logoImg.src = "/Img/corexlogo.png";
            await logoImg.decode();
            logo = logoImg as HTMLImageElement;
            doc.addImage(logo, "PNG", margin, margin, 200, 70);
            const canvas = document.createElement("canvas");
            canvas.width = logo.naturalWidth;
            canvas.height = logo.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(logo, 0, 0);
              logoBase64 = canvas.toDataURL("image/png");
            }
          } catch {}

          // Blue horizontal line at the top (before headers)
          DrawHorizontalLine(doc, margin, 0);

          // Right header text
          DrawRightHeader(doc, "AQ 30", 1, margin);

          // Main header text
          DrawMainHeader(doc, company_name, margin, 1);

          // Horizontal line below headers
          DrawHorizontalLine(doc, margin, 155);

          //Header title: Order
          DrawLeftHeader(doc, "Bestellung / Commande / Order", margin, 175);

          // Table with 3 columns and 3 rows (last column merged)
          const tableY = margin + 185;
          const col1Width = 280; // Wider width for multilingual labels
          const col2Width = 100; // Narrower width for placeholder values
          const col3Width = pageWidth - 2 * margin - col1Width - col2Width; // Remaining width

          // Draw only the vertical line separating column 2 and column 3
          doc.setDrawColor(30, 58, 138); // Dark blue border
          doc.setLineWidth(1);

          // Only the vertical line between column 2 and column 3
          doc.line(
            margin + col1Width + col2Width,
            tableY,
            margin + col1Width + col2Width,
            tableY + 80
          );

          // Add text to cells with better positioning
          doc.setFont("times", "italic");
          doc.setFontSize(10);

          // Row 1
          doc.text(
            "Bestellnummer / Numero de commande / Order number",
            margin + 8,
            tableY + 15
          );
          doc.text(orderNo, margin + col1Width + 15, tableY + 15);

          // Row 2
          doc.text(
            "Liefertermin / Date de livraison / Delivery date",
            margin + 8,
            tableY + 41
          );
          doc.text(deliveryDateFormatted, margin + col1Width + 15, tableY + 43);

          // Row 3
          doc.text(
            "Anfertigungsdatum / Date de production / Production date",
            margin + 8,
            tableY + 67
          );
          doc.text(
            productionDateFormatted,
            margin + col1Width + 15,
            tableY + 67
          );

          // Merged cell in last column (spans all 3 rows) — use OFID, not order number
          doc.setFont("times", "bold");
          doc.setFontSize(10);
          doc.text(
            `N° of ${ofid}`,
            margin + col1Width + col2Width + 60,
            tableY + 40,
            { align: "center" }
          );

          // Horizontal line below Order table
          DrawHorizontalLine(doc, margin, 280);

          //Header title: Customer specifications
          DrawLeftHeader(
            doc,
            "Kudenspezifikationen / Spécifications du client / Customer specifications",
            margin,
            300
          );

          // Customer specifications table: 6 rows x 4 columns
          const specTableY = margin + 315; // place below the "Customer specifications" header
          const tableWidth = pageWidth - 2 * margin;
          const specCol1Width = Math.round(tableWidth * 0.45);
          const specColOtherWidth = Math.floor(
            (tableWidth - specCol1Width) / 3
          );
          const rowHeight = 26;
          const rows = 6;

          // Vertical lines for columns (4 columns total)
          const colX2 = margin + specCol1Width;
          const colX3 = colX2 + specColOtherWidth;
          const colX4 = colX3 + specColOtherWidth;

          // Horizontal lines for rows
          for (let i = 1; i < rows; i++) {
            const y = specTableY + i * rowHeight;
            // doc.line(margin, y, margin + tableWidth, y);
          }

          // Table text
          doc.setFont("times", "italic");
          doc.setFontSize(10);

          // Column headers (row 1)
          // First column header is intentionally blank
          doc.setFont("times", "bold");
          doc.text(
            "Scoll Nominal",
            colX2 + specColOtherWidth / 2,
            specTableY + 16,
            { align: "center" }
          );
          doc.text("Max", colX3 + specColOtherWidth / 2, specTableY + 16, {
            align: "center",
          });
          doc.text("Min", colX4 + specColOtherWidth / 2, specTableY + 16, {
            align: "center",
          });

          // Restore normal style for body rows
          doc.setFont("times", "italic");

          // First column labels
          const col1Labels = [
            "", // row 1 blank
            "Lange (mm) / Longueur (mm) / Length (mm)",
            "Innen (mm) / Interieur (mm) / Inside (mm)",
            "Aussen (mm) / exterieur (mm) / Outside (mm)",
            "Flat Crush (kN/m)",
            "H₂O (%)",
          ];

          doc.setFont("times", "italic");
          doc.setFontSize(10);
          // Fill first column
          for (let r = 0; r < rows; r++) {
            const y = specTableY + r * rowHeight + 16;
            if (r === 5) {
              drawH2OLabel(doc, margin + 8, y, { fontSize: 10, style: "italic" });
            } else {
              doc.text(col1Labels[r], margin + 8, y);
            }
          }

          // Use row number to determine if length row, inside row, outside row, ...
          const placeholderRows = [1, 2, 3, 4, 5];
          placeholderRows.forEach((r) => {
            const y = specTableY + r * rowHeight + 16;
            let data: string = "";

            switch (
              r // switch data values accordingly
            ) {
              case 1:
                data = "length";
                break;
              case 2:
                data = "inside_diameter";
                break;
              case 3:
                data = "outside_diameter";
                break;
              case 4:
                data = "resistance";
                break;
              case 5:
                data = "humidity";
                break;
            }

            // Format the value for display (H2O/humidity: blank when no data; others: "No data")
            const formatValue = (value: any): string => {
              if (value === null || value === undefined || value === "") {
                return data === "humidity" ? "" : "No data";
              }
              const numValue = parseFloat(value);
              if (isNaN(numValue)) {
                return data === "humidity" ? "" : "No data";
              }
              // Format with decimals only if needed (max 2 decimal places)
              return formatNumberWithDecimals(numValue);
            };

            const isEmpty = (v: any) =>
              v === null || v === undefined || v === "";
            const isValidNum = (v: any) =>
              !isEmpty(v) && !isNaN(parseFloat(v));
            const nominalVal = (nominal_data as any)[data];
            const maxVal = (max_data as any)[data];
            const minVal = (min_data as any)[data];
            // Nominal cell: blank when nominal is missing but min and max exist; otherwise format as usual
            const nominalDisplay =
              isEmpty(nominalVal) && isValidNum(maxVal) && isValidNum(minVal)
                ? ""
                : formatValue(nominalVal);

            // customer specs table is generated BY ROW
            doc.text(
              nominalDisplay,
              colX2 + specColOtherWidth / 2,
              y,
              {
                align: "center",
              }
            );
            doc.text(
              formatValue((max_data as any)[data]),
              colX3 + specColOtherWidth / 2,
              y,
              {
                align: "center",
              }
            );
            doc.text(
              formatValue((min_data as any)[data]),
              colX4 + specColOtherWidth / 2,
              y,
              {
                align: "center",
              }
            );
          });

          // Horizontal line separator with dark blue color
          doc.setDrawColor(30, 58, 138); // Dark blue color
          doc.setLineWidth(2);
          doc.line(margin, margin + 480, pageWidth - margin, margin + 480);

          //Header title: Order
          doc.setFont("times", "bolditalic");
          doc.setFontSize(12);

          //Header title: Customer specifications
          DrawLeftHeader(
            doc,
            "Kontrolergebnisse / Resultats de constrole / Control results",
            margin,
            500
          );

          // Control results table: 6 rows x 5 columns (Label + x̄, Min (X), Max (X), σ (X))
          const ctrlTableY = margin + 515; // place below the "Control results" header
          const ctrlTableWidth = pageWidth - 2 * margin;
          const ctrlCol1Width = Math.round(ctrlTableWidth * 0.45);
          const ctrlColOtherWidth = Math.floor(
            (ctrlTableWidth - ctrlCol1Width) / 4
          );
          const ctrlRowHeight = 26;
          const ctrlRows = 6;

          // Column X positions (5 columns total)
          const ctrlColX2 = margin + ctrlCol1Width;
          const ctrlColX3 = ctrlColX2 + ctrlColOtherWidth;
          const ctrlColX4 = ctrlColX3 + ctrlColOtherWidth;
          const ctrlColX5 = ctrlColX4 + ctrlColOtherWidth;

          const ctrlRemaining = ctrlTableWidth - ctrlCol1Width;
          const ctrlColWidthExact = ctrlRemaining / 4; // exact (may be fractional)
          const ctrlCenter2 = margin + ctrlCol1Width + ctrlColWidthExact * 0.5;
          const ctrlCenter3 = margin + ctrlCol1Width + ctrlColWidthExact * 1.5;
          const ctrlCenter4 = margin + ctrlCol1Width + ctrlColWidthExact * 2.5;
          const ctrlCenter5 = margin + ctrlCol1Width + ctrlColWidthExact * 3.5;

          // Table text
          doc.setFont("times", "italic");
          doc.setFontSize(10);

          // Column headers (row 1) — first column blank
          doc.setFont("Helvetica-BoldOblique");
          doc.getFontList();
          try {
            const logo = new Image();
            logo.src = "/Img/xBar.png";
            await logo.decode();
            doc.addImage(
              logo as HTMLImageElement,
              "PNG",
              ctrlCenter2,
              ctrlTableY + 4,
              16,
              16
            );
          } catch {}

          doc.setFont("times", "bolditalic");
          doc.text("Min (X)", ctrlCenter3, ctrlTableY + 16, {
            align: "center",
          });
          doc.text("Max (X)", ctrlCenter4, ctrlTableY + 16, {
            align: "center",
          });
          doc.setFont("symbol", "italic");

          try {
            const logo = new Image();
            logo.src = "/Img/stdV.png";
            await logo.decode();
            doc.addImage(
              logo as HTMLImageElement,
              "PNG",
              ctrlCenter5 - 28,
              ctrlTableY - 7,
              40,
              40
            );
          } catch {}

          try {
            const logo = new Image();
            logo.src = "/Img/xBar.png";
            await logo.decode();
            doc.addImage(
              logo as HTMLImageElement,
              "PNG",
              ctrlCenter5 - 4,
              ctrlTableY + 4,
              16,
              16
            );
          } catch {}

          doc.text("", ctrlCenter5, ctrlTableY + 16, { align: "center" });

          // Restore normal style for body rows
          doc.setFont("times", "italic");
          doc.setFontSize(10);

          // First column labels
          const ctrlCol1Labels = [
            "", // row 1 blank
            "Lange (mm) / Longueur (mm) / Length (mm)",
            "Innen (mm) / Interieur (mm) / Inside (mm)",
            "Aussen (mm) / exterieur (mm) / Outside (mm)",
            "Flat Crush (kN/m)",
            "",
          ];

          // Fill first column
          for (let r = 0; r < ctrlRows; r++) {
            const y = ctrlTableY + r * ctrlRowHeight + 16;
            doc.text(ctrlCol1Labels[r], margin + 8, y);
          }

          WriteH2OItalic(doc, margin + 8, ctrlTableY + 5 * ctrlRowHeight + 16);

          // Map row index to corresponding stats object
          const ctrlStatsMap = [
            null, // row 0 = header
            orderLengthStats, // row 1
            orderInsideDiameterStats, // row 2
            orderOutsideDiameterStats, // row 3
            orderFlatCrushStats, // row 4
            orderH2OStats, // row 5
          ];

          // Control results: only null/undefined are blank. Show "0" for zero (e.g. H2O deviation).
          // (Leave-blank-when-zero applies only to Flat Crush in the customer specification table.)
          const formatCtrlValue = (value: number | undefined | null, rowIndex: number): string => {
            if (value === null || value === undefined) {
              return "";
            }
            // Flat Crush (row 4): display as kN/m by multiplying by 10 (scale from per-10000 to per-1000)
            const displayValue = rowIndex === 4 ? value * 10 : value;
            return formatNumberWithDecimals(displayValue) ?? "";
          };

          const ctrlPlaceholderRows = [1, 2, 3, 4, 5]; // body rows
          ctrlPlaceholderRows.forEach((r) => {
            const toUse = ctrlStatsMap[r];
            const y = ctrlTableY + r * ctrlRowHeight + 16;

            if (toUse) {
              doc.text(formatCtrlValue(toUse.mean, r), ctrlCenter2, y, {
                align: "center",
              });
              doc.text(formatCtrlValue(toUse.min, r), ctrlCenter3, y, {
                align: "center",
              });
              doc.text(formatCtrlValue(toUse.max, r), ctrlCenter4, y, {
                align: "center",
              });
              doc.text(formatCtrlValue(toUse.stdDev, r), ctrlCenter5, y, {
                align: "center",
              });
            }
          });

          // Horizontal line above footer (page-1 style)
          DrawHorizontalLine(doc, margin, 680);
          DrawPage1StyleFooter(doc, margin, current_date, customer);

          // Page 02 start - ensure proper page break
          const page1Number = doc.getNumberOfPages();
          doc.addPage();
          doc.setPage(page1Number + 1); // Explicitly set to the new page (page 2)

          // LENGTH DATA - sort by palette count in ascending order
          const lengthData: chartData[] = measurementData // use the length data in the measurements table of the order ID
            .map((lengthInstance: any) => {
              // Ensure length is properly converted to number
              const length = lengthInstance["length"];
              let numValue: number | null = null;
              
              if (length != null && length !== undefined && length !== '') {
                if (typeof length === 'string') {
                  numValue = parseFloat(length);
                } else {
                  numValue = Number(length);
                }
              }
              
              return {
                data: numValue,
                palette_count: Number(lengthInstance["palette_num"]) || 0,
              };
            })
            .filter((item): item is chartData => item.data != null && !isNaN(item.data) && item.data !== 0) // Filter out invalid values
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);


          const lengthLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            lengthData,
            orderLengthStats["mean"]
          ).then();

          // INSIDE DATA - sort by palette count in ascending order
          console.log("DEBUG: Raw measurementData for inside_diameter:", measurementData.map((m: any) => ({
            id: m.id,
            palette_num: m.palette_num,
            inside_diameter: m.inside_diameter,
            inside_diameter_type: typeof m.inside_diameter,
            inside_diameter_value: m.inside_diameter
          })));

          const insideData = measurementData // use the inside diameter data in the measurements table of the order ID
            .map((insideInstance: any) => {
              // Ensure inside_diameter is properly converted to number
              const insideDiameter = insideInstance["inside_diameter"];
              let numValue: number | null = null;
              
              console.log("DEBUG: Processing inside_diameter:", {
                raw: insideDiameter,
                type: typeof insideDiameter,
                isNull: insideDiameter === null,
                isUndefined: insideDiameter === undefined,
                isString: typeof insideDiameter === 'string',
                isNumber: typeof insideDiameter === 'number',
                palette_num: insideInstance["palette_num"]
              });
              
              if (insideDiameter != null && insideDiameter !== undefined && insideDiameter !== '') {
                if (typeof insideDiameter === 'string') {
                  numValue = parseFloat(insideDiameter);
                } else {
                  numValue = Number(insideDiameter);
                }
              }
              
              const result = {
                data: numValue,
                palette_count: Number(insideInstance["palette_num"]) || 0,
              };
              
              console.log("DEBUG: Mapped result:", result);
              
              return result;
            });

          console.log("DEBUG: insideData before filter:", insideData);

          const filteredInsideData: chartData[] = insideData
            .filter((item): item is chartData => {
              const keep = item.data != null && !isNaN(item.data) && item.data !== 0;
              if (!keep) {
                console.log("DEBUG: Filtering out item:", item);
              }
              return keep;
            })
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);

          console.log("DEBUG: insideData after filter:", filteredInsideData);
          console.log("DEBUG: insideData count:", filteredInsideData.length);


          const insideLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            filteredInsideData,
            orderInsideDiameterStats["mean"]
          ).then();

          // OUTSIDE DATA - sort by palette count in ascending order
          const outsideData: chartData[] = measurementData // use the outside diameter data in the measurements table of the order ID
            .map((outsideInstance: any) => {
              // Ensure outside_diameter is properly converted to number
              const outsideDiameter = outsideInstance["outside_diameter"];
              let numValue: number | null = null;
              
              if (outsideDiameter != null && outsideDiameter !== undefined && outsideDiameter !== '') {
                if (typeof outsideDiameter === 'string') {
                  numValue = parseFloat(outsideDiameter);
                } else {
                  numValue = Number(outsideDiameter);
                }
              }
              
              return {
                data: numValue,
                palette_count: Number(outsideInstance["palette_num"]) || 0,
              };
            })
            .filter((item): item is chartData => item.data != null && !isNaN(item.data) && item.data !== 0) // Filter out invalid values
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);


          const outsideLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            outsideData,
            orderOutsideDiameterStats["mean"]
          ).then();

          // FLAT CRUSH DATA - sort by palette count in ascending order
          console.log("DEBUG: Raw measurementData for flat_crush:", measurementData.map((m: any) => ({
            id: m.id,
            palette_num: m.palette_num,
            flat_crush: m.flat_crush,
            flat_crush_type: typeof m.flat_crush
          })));

          const flatCrushData: chartData[] = measurementData // use the flat crush data in the measurements table of the order ID
            .map((flatCrushInstance: any) => {
              // Ensure flat_crush is properly converted to number
              const flatCrush = flatCrushInstance["flat_crush"];
              let numValue: number | null = null;
              
              if (flatCrush != null && flatCrush !== undefined && flatCrush !== '') {
                if (typeof flatCrush === 'string') {
                  numValue = parseFloat(flatCrush);
                } else {
                  numValue = Number(flatCrush);
                }
              }
              
              return {
                data: numValue,
                palette_count: Number(flatCrushInstance["palette_num"]) || 0,
              };
            })
            .filter((item): item is chartData => item.data != null && !isNaN(item.data) && item.data !== 0) // Filter out invalid values
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);

          console.log("DEBUG: flatCrushData after filter:", flatCrushData);
          console.log("DEBUG: flatCrushData count:", flatCrushData.length);

          const flatCrushLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            flatCrushData,
            orderFlatCrushStats["mean"]
          );

          console.log("DEBUG: flatCrushLineChartImage generated:", flatCrushLineChartImage ? "YES" : "NO", flatCrushLineChartImage?.substring(0, 50));

          // H2O DATA - sort by palette count in ascending order
          console.log("DEBUG: Raw measurementData for h2o:", measurementData.map((m: any) => ({
            id: m.id,
            palette_num: m.palette_num,
            h2o: m.h2o,
            h2o_type: typeof m.h2o
          })));

          const h2oData: chartData[] = measurementData // use the h2O data in the measurements table of the order ID
            .map((h2oInstance: any) => {
              // Ensure h2o is properly converted to number
              const h2o = h2oInstance["h2o"];
              let numValue: number | null = null;
              
              if (h2o != null && h2o !== undefined && h2o !== '') {
                if (typeof h2o === 'string') {
                  numValue = parseFloat(h2o);
                } else {
                  numValue = Number(h2o);
                }
              }
              
              return {
                data: numValue,
                palette_count: Number(h2oInstance["palette_num"]) || 0,
              };
            })
            .filter((item): item is chartData => item.data != null && !isNaN(item.data) && item.data !== 0) // Filter out invalid values
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);

          console.log("DEBUG: h2oData after filter:", h2oData);
          console.log("DEBUG: h2oData count:", h2oData.length);

          const h2oLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            h2oData,
            orderH2OStats["mean"]
          );

          console.log("DEBUG: h2oLineChartImage generated:", h2oLineChartImage ? "YES" : "NO", h2oLineChartImage?.substring(0, 50));

          // Try to load logo from public path and place it on the PDF
          try {
            const logo = new Image();
            logo.src = "/Img/corexlogo.png";
            await logo.decode();
            doc.addImage(
              logo as HTMLImageElement,
              "PNG",
              margin,
              margin,
              200,
              70
            );
          } catch {}

          // Page-1 style header (uniform with page 1)
          if (logo) {
            doc.addImage(logo, "PNG", margin, margin, 200, 70);
          }
          DrawHorizontalLine(doc, margin, 0);
          DrawRightHeader(doc, "AQ 30", 1, margin);
          DrawMainHeader(doc, company_name, margin, 1);
          DrawHorizontalLine(doc, margin, 155);

          // Draw the first graph [Length]
          DrawGraphLabel(doc, "length", margin, lengthLineChartImage);

          // Draw the second graph [Inside diameter]
          DrawGraphLabel(doc, "inside", margin, insideLineChartImage);

          // Draw the third graph [Outside diameter]
          DrawGraphLabel(doc, "outside", margin, outsideLineChartImage);

          // Draw the fourth graph [Flat Crush]
          DrawGraphLabel(doc, "flat_crush", margin, flatCrushLineChartImage);

          // Draw the fifth graph [H2O]
          DrawGraphLabel(doc, "h2o", margin, h2oLineChartImage);

          // Page-1 style footer (uniform with page 1)
          DrawHorizontalLine(doc, margin, 710);
          DrawPage1StyleFooter(doc, margin, current_date, customer);

          // Page 03 start
          const currentPageBeforeAdd = doc.getNumberOfPages();
          doc.addPage();
          const page3Number = currentPageBeforeAdd + 1;
          
          // DrawMeasurementTables will handle headers and footers internally
          // So we don't need to draw them here to avoid duplication
          
          // Draw the tables in page 03 (pass the correct page number)
          // DrawMeasurementTables handles headers and footers internally, so no need to draw them again
          DrawMeasurementTables(
            doc,
            180,
            measurementData,
            company_name,
            orderNo,
            current_date,
            page3Number, // Correct page number (3)
            logoBase64,
            customer
          );

          // Draw Flat Crush and H2O table below the measurement tables on page 3
          // Get the final Y position after the measurement tables
          const measurementTablesFinalY = (doc as any).lastAutoTable?.finalY || 0;
          
          // Check if we have enough space on current page
          const pageH = doc.internal.pageSize.getHeight();
          const footerArea = 100;
          const labelHeight = 20;
          const tableMinHeight = 50;
          const spacing = 30;
          const requiredSpace = labelHeight + spacing + tableMinHeight;
          const availableSpace = pageH - measurementTablesFinalY - footerArea;
          
          let flatCrushH2OTableLabelY: number;
          
          if (availableSpace < requiredSpace) {
            // Not enough space, move to next page — use page-1 style header/footer
            doc.addPage();
            const currentPage = doc.getNumberOfPages();
            doc.setPage(currentPage);
            const m = 40;
            if (logo) {
              doc.addImage(logo, "PNG", m, m, 200, 70);
            }
            DrawHorizontalLine(doc, m, 0);
            DrawRightHeader(doc, "AQ 30", 1, m);
            DrawMainHeader(doc, company_name, m, 1);
            DrawHorizontalLine(doc, m, 155);
            DrawHorizontalLine(doc, m, 710);
            DrawPage1StyleFooter(doc, m, current_date, customer);
            flatCrushH2OTableLabelY = m + 120;
          } else {
            // Enough space, add spacing after measurement tables
            flatCrushH2OTableLabelY = measurementTablesFinalY + spacing;
          }
          
          // Start table below the label
          const flatCrushH2OTableStartY = flatCrushH2OTableLabelY + labelHeight;
          DrawFlatCrushH2OTable(doc, measurementData, 40, flatCrushH2OTableStartY);
          
          // Generate filename with article designation if article was selected
          let pdfFileName = `quality_control_report_order_${orderNo}`;
          if (article?.designated_article) {
            // Sanitize the designated_article for filename (remove special chars, limit length)
            const sanitizedDesignation = article.designated_article
              .replace(/[^a-zA-Z0-9\s]/g, '_')
              .replace(/\s+/g, '_')
              .substring(0, 50);
            pdfFileName = `quality_control_report_order_${orderNo}_${sanitizedDesignation}`;
          }

          // Post-pass: draw page-1 style header and footer on every page 2..N (covers continuation pages)
          const totalPages = doc.getNumberOfPages();
          const m = 40;
          for (let p = 2; p <= totalPages; p++) {
            doc.setPage(p);
            if (logo) {
              doc.addImage(logo, "PNG", m, m, 200, 70);
            }
            DrawHorizontalLine(doc, m, 0);
            DrawRightHeader(doc, "AQ 30", 1, m);
            DrawMainHeader(doc, company_name, m, 1);
            DrawHorizontalLine(doc, m, 155);
            DrawPage1StyleFooter(doc, m, current_date, customer);
          }

          pdfs.push({ doc, filename: pdfFileName }); // collect blobs for zip
        })
      );

      if (pdfs.length > 1) {
        // more than 1 file to download - create zip
        const zip = new JSZip();

        pdfs.forEach(({ doc, filename }) => {
          const pdfBlob = doc.output("blob");
          zip.file(`${filename}.pdf`, pdfBlob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "quality_control_reports.zip");
        toast.success("ZIP with PDFs downloaded");
      } else {
        // isa lang ka file ang idownload or preview
        // Generate PDF blob for preview
        const { doc, filename } = pdfs[0];
        const pdfBlob = doc.output("blob");
        const baseName = filename || fileName;
        const normalizedName = baseName.toLowerCase().endsWith(".pdf")
          ? baseName
          : `${baseName}.pdf`;

        const shouldDownloadFile =
          mode === "download" ||
          mode === "both" ||
          (mode === "preview" && !onPDFGenerated);

        // Handle different modes
        if (mode === "preview") {
          onPDFGenerated?.(pdfBlob);
          if (shouldDownloadFile) {
            saveAs(pdfBlob, normalizedName);
          }
          toast.success(
            shouldDownloadFile ? "PDF downloaded" : "PDF generated for preview"
          );
          return;
        } else if (mode === "download") {
          saveAs(pdfBlob, normalizedName);
          toast.success("PDF downloaded");
        } else {
          onPDFGenerated?.(pdfBlob);
          saveAs(pdfBlob, normalizedName);
          toast.success("PDF downloaded");
          return;
        }
      }
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsLoading(false);
      setIsDisabled(false);
      setButtonLabel("Download");
    }
  };

  // Open Order details modal first (Order Number + Delivery Date), then fetch articles and proceed
  const handleClick = () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select an order", { duration: 1000 });
      return;
    }
    const initial: Record<string, { orderNumber: string; deliveryDate: string }> = {};
    selectedOrders.forEach((order: any) => {
      const ofid = String(order?.order_fabrication_control ?? "");
      if (ofid) initial[ofid] = getInitialOrderDetails(order);
    });
    setOrderDetailsForm(initial);
    setOrderDetailsOverrides({});
    setIsOrderDetailsEditing(false);
    setIsOrderDetailsModalOpen(true);
  };

  const handleOrderDetailsCancel = () => {
    setIsOrderDetailsModalOpen(false);
  };

  const handleOrderDetailsConfirm = async () => {
    const overrides = { ...orderDetailsForm };
    setOrderDetailsOverrides(overrides);
    setIsOrderDetailsModalOpen(false);

    // Persist order_number and delivery_date to tbl_prod for each order (by ofid so we always match the right row)
    for (const order of selectedOrders) {
      const ofid = String(order?.order_fabrication_control ?? "").trim();
      if (!ofid) continue;
      const details = overrides[ofid];
      const orderNumberRaw = details?.orderNumber?.trim();
      const orderNumber = orderNumberRaw === "" || orderNumberRaw == null ? null : (() => {
        const n = parseInt(orderNumberRaw, 10);
        return isNaN(n) ? null : n;
      })();
      const deliveryDate = details?.deliveryDate?.trim() || null;
      try {
        const res = await fetch("/api/v1/update_order_details", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ofid,
            id: order?.id != null && order.id !== "" ? Number(order.id) : undefined,
            order_number: orderNumber,
            delivery_date: deliveryDate,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.error ?? `Failed to save order details for OFID ${ofid}`);
        }
      } catch (e) {
        console.error("Failed to update order details:", e);
        toast.error(`Failed to save order details for OFID ${ofid}`);
      }
    }

    fetchArticlesAndProceed(overrides);
  };

  const setOrderDetail = (ofid: string, field: "orderNumber" | "deliveryDate", value: string) => {
    setOrderDetailsForm((prev) => ({
      ...prev,
      [ofid]: { ...(prev[ofid] ?? { orderNumber: "", deliveryDate: "" }), [field]: value },
    }));
  };

  // After Order details are confirmed: fetch matching articles, then either proceed or show article modal
  const fetchArticlesAndProceed = async (
    orderDetailsConfirmed?: Record<string, { orderNumber: string; deliveryDate: string }>
  ) => {
    setIsFetchingMatches(true);
    setIsLoading(true);
    setButtonLabel("Checking matches...");

    try {
      const matchesByOfid: Record<string, any[]> = {};

      await Promise.all(
        selectedOrders.map(async (order: any) => {
          const ofid = order.order_fabrication_control;
          if (ofid) {
            const matches = await fetchMatchingArticles(String(ofid));
            matchesByOfid[ofid] = matches;
          }
        })
      );

      const allHaveSingleArticle = Object.values(matchesByOfid).every(
        (articles) => articles && articles.length === 1
      );

      if (allHaveSingleArticle) {
        const autoSelected: Record<string, Record<number, any>> = {};
        Object.entries(matchesByOfid).forEach(([ofid, articles]) => {
          if (articles && articles.length === 1) {
            const article = articles[0];
            autoSelected[ofid] = { [article.id]: article };
          }
        });
        setSelectedArticlesByOfid(autoSelected);
        setIsFetchingMatches(false);
        proceedWithPDFGeneration(autoSelected, orderDetailsConfirmed ?? orderDetailsOverrides);
        return;
      }

      setSelectedArticlesByOfid({});
      setMatchingArticlesByOfid(matchesByOfid);
      setIsModalOpen(true);
      setIsLoading(false);
      setButtonLabel("Download");
      setIsFetchingMatches(false);
    } catch (error) {
      console.error("Error fetching matching articles:", error);
      toast.error("Failed to check matching articles");
      setIsLoading(false);
      setButtonLabel("Download");
      setIsFetchingMatches(false);
    }
  };

  // Function to handle article selection/deselection
  const handleArticleToggle = (ofid: string, article: any) => {
    setSelectedArticlesByOfid((prev) => {
      const ofidSelections = prev[ofid] || {};
      const articleId = article.id;
      
      if (ofidSelections[articleId]) {
        // Deselect: remove from selection
        const { [articleId]: _, ...newOfidSelections } = ofidSelections;
        
        if (Object.keys(newOfidSelections).length > 0) {
          // Keep the ofid key with remaining selections
          return {
            ...prev,
            [ofid]: newOfidSelections,
          };
        } else {
          // Remove the ofid key entirely if no selections remain
          const { [ofid]: __, ...rest } = prev;
          return rest;
        }
      } else {
        // Select: add to selection
        return {
          ...prev,
          [ofid]: {
            ...ofidSelections,
            [articleId]: article,
          },
        };
      }
    });
  };

  // Function to handle modal close and proceed with download
  const handleModalProceed = () => {
    setIsModalOpen(false);
    // Clear selections after proceeding
    setSelectedArticlesByOfid({});
    proceedWithPDFGeneration();
  };

  // Function to handle modal cancel
  const handleModalCancel = () => {
    setIsModalOpen(false);
    setIsLoading(false);
    setButtonLabel("Download");
    setIsFetchingMatches(false);
    // Clear selections when canceling
    setSelectedArticlesByOfid({});
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isDisabled || isFetchingMatches}
        className={`w-full px-3 py-2 rounded-lg font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg shrink-0 whitespace-nowrap transform hover:scale-105 active:scale-95 border ${className} ${
          isDisabled || isFetchingMatches
            ? "bg-gradient-to-r from-blue-900/50 to-blue-800/50 cursor-not-allowed text-white/70 border-blue-900/20"
            : "bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white border-blue-700/30"
        }`}
      >
        {isLoading && (
          <svg
            className="inline mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {isLoading ? "Generating PDF..." : isFetchingMatches ? "Checking matches..." : buttonLabel}
      </button>

      {/* Order details modal: Order Number + Delivery Date before PDF download */}
      {isOrderDetailsModalOpen && mounted && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          onClick={handleOrderDetailsCancel}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Order details for PDF</h3>
              <p className="text-sm text-gray-500 mt-1">
                Review or edit Order number and Delivery date. These will appear on the generated PDF.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {selectedOrders.map((order: any) => {
                  const ofid = String(order?.order_fabrication_control ?? "");
                  const details = orderDetailsForm[ofid] ?? getInitialOrderDetails(order);
                  return (
                    <div key={ofid} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <span className="font-medium text-gray-700">OFID: {ofid}</span>
                      </div>
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="min-w-0 flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Order number</label>
                          {isOrderDetailsEditing ? (
                            <input
                              type="text"
                              value={details.orderNumber}
                              onChange={(e) => setOrderDetail(ofid, "orderNumber", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                            />
                          ) : (
                            <p className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">{details.orderNumber || "—"}</p>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Delivery date</label>
                          {isOrderDetailsEditing ? (
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="dd/mm/yyyy"
                                value={details.deliveryDate ? formatToDDMMYYYY(details.deliveryDate) : ""}
                                onChange={(e) => {
                                  const raw = e.target.value.trim();
                                  const stored = parseDDMMYYYYToStorage(raw);
                                  if (raw === "") setOrderDetail(ofid, "deliveryDate", "");
                                  else if (stored) setOrderDetail(ofid, "deliveryDate", stored);
                                }}
                                className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                              />
                              <input
                                ref={(el) => {
                                  deliveryDatePickerRefs.current[ofid] = el;
                                }}
                                type="date"
                                value={details.deliveryDate}
                                onChange={(e) => setOrderDetail(ofid, "deliveryDate", e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                aria-hidden
                                tabIndex={-1}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const picker = deliveryDatePickerRefs.current[ofid];
                                  if (!picker) return;
                                  if (typeof picker.showPicker === "function") {
                                    picker.showPicker();
                                  } else {
                                    picker.focus();
                                    picker.click();
                                  }
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700 transition z-10"
                                aria-label="Open delivery date picker"
                              >
                                <Calendar className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <p className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">{formatToDDMMYYYY(details.deliveryDate)}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsOrderDetailsEditing((e) => !e)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 shrink-0 shadow-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-end gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleOrderDetailsCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOrderDetailsConfirm}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal for showing matching articles - rendered via portal outside flex container */}
      {isModalOpen && mounted && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleModalCancel}>
          <div 
            className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Select Article Designations</h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose which article designations to include in the PDF reports
              </p>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {Object.entries(matchingArticlesByOfid).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No orders to process</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(matchingArticlesByOfid).map(([ofid, articles]) => (
                    <div key={ofid} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <h4 className="font-semibold text-base text-gray-800">
                          Order Fabrication ID: <span className="text-blue-700">{ofid}</span>
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        {articles.length === 0 ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-amber-800">
                              No matching articles found. The order's default article will be used.
                            </p>
                          </div>
                        ) : (
                          articles.map((article) => {
                            const isSelected = selectedArticlesByOfid[ofid]?.[article.id] !== undefined;
                            return (
                              <label
                                key={article.id}
                                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                  isSelected 
                                    ? 'bg-blue-50 border-blue-500 shadow-sm' 
                                    : 'bg-white border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-primary checkbox-sm mt-1"
                                  checked={isSelected}
                                  onChange={() => handleArticleToggle(ofid, article)}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {article.designated_article || 'No designation available'}
                                  </p>
                                  {article.article_name && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {article.article_name}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="text-blue-600">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {(() => {
                    const totalSelected = Object.values(selectedArticlesByOfid).reduce(
                      (sum, ofidSelections) => sum + Object.keys(ofidSelections || {}).length,
                      0
                    );
                    return totalSelected > 0 
                      ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium text-gray-800">{totalSelected}</span>
                          <span>article{totalSelected !== 1 ? 's' : ''} selected</span>
                        </span>
                      )
                      : (
                        <span className="text-gray-500">
                          Using default article for each order
                        </span>
                      );
                  })()}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleModalCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleModalProceed}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Proceed with Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <canvas
        ref={canvasRef}
        // Match the PDF target aspect ratio (410x105) at 2x resolution for crispness
        width="820"
        height="210"
        style={{ display: "none" }}
      />
    </div>
  );
}
