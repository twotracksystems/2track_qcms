"use client";
import React from "react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { create } from "domain";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import { useMutation, useQuery } from "@tanstack/react-query";

// packages to generate the different charts
import { Chart } from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
Chart.register(ChartDataLabels);

// necessary functions in building the PDF files
import {
  DrawFooter,
  DrawGraphLabel,
  DrawHorizontalLine,
  DrawLeftHeader,
  DrawMainHeader,
  DrawRightHeader,
  DrawMeasurementTables,
  WriteH2OItalic,
} from "./PDFBuilder";

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
  h20?: number;
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

  // Ensure we're on the client side for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null); // used to refer to the canvas element containing the chart

  // function to get customer specifications data
  const GetCustomerSpecificationsData = async (
    nominalArticleId: number | null | undefined,
    minArticleId: number | null | undefined,
    maxArticleId: number | null | undefined
  ) => {
    const customerSpecificationsDataAggregated = [];

    // Only fetch if we have a valid ID (not null, undefined, or "***")
    if (nominalArticleId && nominalArticleId !== "***" && !isNaN(Number(nominalArticleId))) {
      try {
        const responseNominal = await fetch(
          // index [0] = nominal, index [1] = Max, index [2] = Min
          `/api/v1/getonearticlenominal?id=${encodeURIComponent(nominalArticleId)}`,
          {
            method: "GET",
            headers: {
              Accept: "*/*",
              "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            },
          }
        );

        if (responseNominal.ok) {
          const nominalResult = await responseNominal.json();
          customerSpecificationsDataAggregated.push(nominalResult[0] || {});
        } else {
          customerSpecificationsDataAggregated.push({});
        }
      } catch (error) {
        console.error("Error fetching nominal article:", error);
        customerSpecificationsDataAggregated.push({});
      }
    } else {
      customerSpecificationsDataAggregated.push({});
    }

    if (minArticleId && minArticleId !== "***" && !isNaN(Number(minArticleId))) {
      try {
        const responseMin = await fetch(
          `/api/v1/getonearticlemin?id=${encodeURIComponent(minArticleId)}`,
          {
            method: "GET",
            headers: {
              Accept: "*/*",
              "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            },
          }
        );

        if (responseMin.ok) {
          const minResult = await responseMin.json();
          customerSpecificationsDataAggregated.push(minResult[0] || {});
        } else {
          customerSpecificationsDataAggregated.push({});
        }
      } catch (error) {
        console.error("Error fetching min article:", error);
        customerSpecificationsDataAggregated.push({});
      }
    } else {
      customerSpecificationsDataAggregated.push({});
    }

    if (maxArticleId && maxArticleId !== "***" && !isNaN(Number(maxArticleId))) {
      try {
        const responseMax = await fetch(
          `/api/v1/getonearticlemax?id=${encodeURIComponent(maxArticleId)}`,
          {
            method: "GET",
            headers: {
              Accept: "*/*",
              "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            },
          }
        );

        if (responseMax.ok) {
          const maxResult = await responseMax.json();
          customerSpecificationsDataAggregated.push(maxResult[0] || {});
        } else {
          customerSpecificationsDataAggregated.push({});
        }
      } catch (error) {
        console.error("Error fetching max article:", error);
        customerSpecificationsDataAggregated.push({});
      }
    } else {
      customerSpecificationsDataAggregated.push({});
    }

    return customerSpecificationsDataAggregated;
  };

  const GetMeasurementData = async (orderId: number) => {
    const responseMeasurementData = await fetch(
      `/api/v1/getonemeasurement?id=${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        headers: {
          Accept: "*/*",
          "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        },
      }
    );

    const measurementData = await responseMeasurementData.json();

    if (responseMeasurementData.ok) {
      return measurementData;
    } else {
      toast.error("Failed to fetch measurement data");
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
        return [];
      }

      const data = await response.json();
      return data.matching_articles || [];
    } catch (error) {
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
    // Helper function to format values (handle null, undefined, and numbers)
    const formatValue = (value: any): string => {
      if (value === null || value === undefined || value === "") {
        return "No data";
      }
      // If it's a number, format it appropriately
      if (typeof value === "number") {
        // For very small numbers, show more decimals
        if (Math.abs(value) < 1 && value !== 0) {
          return value.toFixed(4);
        }
        // For whole numbers, show as integer
        if (Number.isInteger(value)) {
          return value.toString();
        }
        // For decimals, show 2 decimal places
        return value.toFixed(2);
      }
      return String(value);
    };

    const specs = [
      { label: "Length (mm)", key: "length" },
      { label: "Inside Diameter (mm)", key: "inside_diameter" },
      { label: "Outside Diameter (mm)", key: "outside_diameter" },
      { label: "Flat Crush (kN/m)", key: "flat_crush" },
      { label: "H2O (%)", key: "h20" },
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
      const nominal = formatValue(nominal_data?.[spec.key]);
      const max = formatValue(max_data?.[spec.key]);
      const min = formatValue(min_data?.[spec.key]);

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
    console.log("Article Nominal (tbl_article_nominal):", {
      ...nominal_data,
      flat_crush: nominal_data?.flat_crush ?? null,
      h20: nominal_data?.h20 ?? null,
    });
    console.log("Article Max (tbl_article_max):", {
      ...max_data,
      flat_crush: max_data?.flat_crush ?? null,
      h20: max_data?.h20 ?? null,
    });
    console.log("Article Min (tbl_article_min):", {
      ...min_data,
      flat_crush: min_data?.flat_crush ?? null,
      h20: min_data?.h20 ?? null,
    });
    
    // Additional info about flat_crush and h20
    console.log("\nFlat Crush & H2O Details:");
    console.log("  Nominal - Flat Crush:", nominal_data?.flat_crush ?? "null/undefined", "| H2O:", nominal_data?.h20 ?? "null/undefined");
    console.log("  Max     - Flat Crush:", max_data?.flat_crush ?? "null/undefined", "| H2O:", max_data?.h20 ?? "null/undefined");
    console.log("  Min     - Flat Crush:", min_data?.flat_crush ?? "null/undefined", "| H2O:", min_data?.h20 ?? "null/undefined");
  };

  function calculateStats(data: Measurement[], field: keyof Measurement) {
    // returns the descriptive statistics of the order measurements
    const values = data
      .map((d) => d[field])
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
    
    // Filter out zero values and sort by palette count in ascending order
    const filteredData = data
      .filter((d) => d.data !== 0 && d.data !== null && d.data !== undefined && !isNaN(d.data))
      .sort((a, b) => a.palette_count - b.palette_count);
    
    // Recalculate mean based on filtered data
    const filteredValues = filteredData.map((d) => d.data);
    const recalculatedMean = filteredValues.length > 0 
      ? filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length 
      : meanValue;
    
    const labels = filteredData.map((d) => String(d.palette_count));
    const values = filteredData.map((d) => d.data);

    // Handle single data point case
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
      padding = (maxVal - minVal) * 0.1; // 10% headroom
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
            
            // Ensure we have a valid mean value
            const meanToUse = isNaN(recalculatedMean) || recalculatedMean === 0 ? meanValue : recalculatedMean;
            const y = yScale.getPixelForValue(meanToUse);

            // Only draw the line if it's within the chart area
            if (y >= chart.chartArea.top && y <= chart.chartArea.bottom) {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(chart.chartArea.left, y);
              ctx.lineTo(chart.chartArea.right, y);
              ctx.strokeStyle = "red";
              ctx.lineWidth = 1.5;
              ctx.setLineDash([5, 5]); // dashed line
              ctx.stroke();
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

  // Function to proceed with PDF generation (extracted from original handleClick)
  const proceedWithPDFGeneration = async () => {
    setIsLoading(true);
    setButtonLabel("Downloading...");
    setIsDisabled(true);
    try {
      const pdfs: any[] = [];

      // Flatten selected orders with their selected articles
      // If multiple articles are selected for an order, generate multiple PDFs
      const ordersToProcess: Array<{ order: any; article: any | null }> = [];
      
      selectedOrders.forEach((order: any) => {
        const ofid = String(order.order_fabrication_control);
        const selectedArticles = selectedArticlesByOfid[ofid];
        
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

          // get order fabrication control number
          const orderNo = get(order.order_fabrication_control);

          // fetch measurements data
          const orderId = get(order.id) as unknown as number;
          
          const measurementData = await GetMeasurementData(orderId);

          // Determine which article IDs to use
          let nominalId: number | null = null;
          let minId: number | null = null;
          let maxId: number | null = null;
          
          if (article) {
            // Use the selected article's IDs from modal
            nominalId = article?.article_nominal || null;
            minId = article?.article_min || null;
            maxId = article?.article_max || null;
          } else {
            // Fallback to order's article if no selection made
            nominalId = order.tbl_article?.article_nominal || null;
            minId = order.tbl_article?.article_min || null;
            maxId = order.tbl_article?.article_max || null;
          }
          
          const customerSpecificationsData =
            await GetCustomerSpecificationsData(
              nominalId ? Number(nominalId) : null,
              minId ? Number(minId) : null,
              maxId ? Number(maxId) : null
            );

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
          const orderH2OStats = calculateStats(measurementData, "h20");

          // format delivery date and time
          const deliveryDate = get(order.exit_date_time);
          const deliveryDateFormatted = new Date(
            deliveryDate
          ).toLocaleDateString("en-GB");
          const deliveryDateTime = new Date(deliveryDate).toLocaleTimeString(
            "en-GB",
            { hour: "2-digit", minute: "2-digit", second: "2-digit" }
          );

          // format production date and time
          const productionDate = get(order.created_at);
          const productionDateFormatted = new Date(
            productionDate
          ).toLocaleDateString("en-GB");
          const productionDateTime = new Date(
            productionDate
          ).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          // dynamically import jspdf to reduce bundle size
          const { default: jsPDF } = await import("jspdf");

          // Page 01 start
          const doc = new jsPDF({ unit: "pt", format: "a4" });
          const pageWidth = doc.internal.pageSize.getWidth(); // stores the width for all pages
          const margin = 40;

          // Try to load logo from public path and place it on the PDF page1
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
          doc.text(deliveryDateTime, margin + col1Width + 15, tableY + 55);

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
          doc.text(productionDateTime, margin + col1Width + 15, tableY + 79);

          // Merged cell in last column (spans all 3 rows)
          doc.setFont("times", "bold");
          doc.setFontSize(10);
          doc.text(
            `N° of ${orderNo}`,
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
            "",
          ];

          WriteH2OItalic(doc, margin + 8, specTableY + 5 * rowHeight + 16);

          // Fill first column
          for (let r = 0; r < rows; r++) {
            const y = specTableY + r * rowHeight + 16;
            doc.text(col1Labels[r], margin + 8, y);
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
                data = "flat_crush";
                break;
              case 5:
                data = "h20";
                break;
            }

            // customer specs table is generated BY ROW
            doc.text(
              String(nominal_data[data] ?? "No data"),
              colX2 + specColOtherWidth / 2,
              y,
              {
                // if data does not exist, put "No data"
                align: "center",
              }
            );
            doc.text(
              String(max_data[data] ?? "No data"),
              colX3 + specColOtherWidth / 2,
              y,
              {
                align: "center",
              }
            );
            doc.text(
              String(min_data[data] ?? "No data"),
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

          const ctrlPlaceholderRows = [1, 2, 3, 4, 5]; // body rows
          ctrlPlaceholderRows.forEach((r) => {
            const toUse = ctrlStatsMap[r];
            const y = ctrlTableY + r * ctrlRowHeight + 16;

            if (toUse) {
              doc.text(toUse.mean?.toString() || "", ctrlCenter2, y, {
                align: "center",
              });
              doc.text(toUse.min?.toString() || "", ctrlCenter3, y, {
                align: "center",
              });
              doc.text(toUse.max?.toString() || "", ctrlCenter4, y, {
                align: "center",
              });
              doc.text(toUse.stdDev?.toString() || "", ctrlCenter5, y, {
                align: "center",
              });
            }
          });

          // Horizontal line separator with dark blue color
          DrawHorizontalLine(doc, margin, 680);

          // Footer table: 3 columns x 2 rows
          const pageHeight = doc.internal.pageSize.getHeight();
          const footerTableWidth = pageWidth - 2 * margin;
          const footerColWidth = Math.floor(footerTableWidth / 3);
          const footerRowHeight = 15;
          const footerTableHeight = footerRowHeight * 2;

          // place below the last horizontal bar but keep within page bounds
          const barY = margin + 670; // last horizontal bar Y position
          const desiredFooterY = barY + 20; // a bit of spacing under the bar
          const maxFooterY = pageHeight - margin - footerTableHeight; // lowest Y that still fits
          const footerTableY = Math.min(desiredFooterY, maxFooterY);

          // Column X positions
          const fColX1 = margin;
          const fColX2 = fColX1 + footerColWidth;
          const fColX3 = fColX2 + footerColWidth;

          doc.setFont("times", "italic");
          doc.setFontSize(10);

          // First column content
          doc.text("Datum / Date", fColX1 + 8, footerTableY + 15);

          doc.setFont("times", "bolditalic");
          doc.text(
            `${current_date}`,
            fColX1 + 8,
            footerTableY + footerRowHeight + 15
          );

          doc.setFont("times", "italic");
          // Second column content
          doc.text(`${customer}`, fColX2 + 8, footerTableY + 15, {
            align: "center",
          });
          doc.text(
            "Unterschfrit / Signature",
            fColX2 + 8,
            footerTableY + footerRowHeight + 15,
            { align: "center" }
          );

          // Third column merged content
          doc.setFont("times", "bold");
          doc.text(
            "Document synthese",
            fColX3 + footerColWidth / 2,
            footerTableY + footerRowHeight,
            { align: "center" }
          );

          // Page 02 start
          doc.addPage();

          // LENGTH DATA - sort by palette count in ascending order
          const lengthData: chartData[] = measurementData // use the length data in the measurements table of the order ID
            .map((lengthInstance: any) => ({
              data: lengthInstance["length"],
              palette_count: Number(lengthInstance["pallete_count"]),
            }))
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);


          const lengthLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            lengthData,
            orderLengthStats["mean"]
          ).then();

          // INSIDE DATA - sort by palette count in ascending order
          const insideData: chartData[] = measurementData // use the inside diameter data in the measurements table of the order ID
            .map((insideInstance: any) => {
              const insideDiameter = insideInstance["inside_diameter"];
              const paletteCount = Number(insideInstance["pallete_count"]);
              
              return {
                data: insideDiameter != null && insideDiameter !== '' ? Number(insideDiameter) : 0,
                palette_count: paletteCount || 0,
              };
            })
            .filter(item => item.palette_count > 0) // Filter out invalid palette counts
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);


          const insideLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            insideData,
            orderInsideDiameterStats["mean"]
          ).then();

          // OUTSIDE DATA - sort by palette count in ascending order
          const outsideData: chartData[] = measurementData // use the outside diameter data in the measurements table of the order ID
            .map((outsideInstance: any) => ({
              data: outsideInstance["outside_diameter"],
              palette_count: Number(outsideInstance["pallete_count"]),
            }))
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);


          const outsideLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            outsideData,
            orderOutsideDiameterStats["mean"]
          ).then();

          // FLAT CRUSH DATA - sort by palette count in ascending order
          const flatCrushData: chartData[] = measurementData // use the flat crush data in the measurements table of the order ID
            .map((flatCrushInstance: any) => ({
              data: flatCrushInstance["flat_crush"],
              palette_count: Number(flatCrushInstance["pallete_count"]),
            }))
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);


          const flatCrushLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            flatCrushData,
            orderFlatCrushStats["mean"]
          );

          // H2O DATA - sort by palette count in ascending order
          const h2oData: chartData[] = measurementData // use the h2O data in the measurements table of the order ID
            .map((h2oInstance: any) => ({
              data: h2oInstance["h20"],
              palette_count: Number(h2oInstance["pallete_count"]),
            }))
            .sort((a: chartData, b: chartData) => a.palette_count - b.palette_count);
          

          const h2oLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            h2oData,
            orderH2OStats["mean"]
          );

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

          // Right header text
          DrawRightHeader(doc, "AQ 30", 2, margin);

          // Main header text
          DrawMainHeader(doc, company_name, margin, 2);

          // Horizontal line below headers
          DrawHorizontalLine(doc, margin, 130);

          // Draw the first graph [Length]
          DrawGraphLabel(doc, "length", margin, lengthLineChartImage);

          // Draw the second graph [Inside diameter]
          DrawGraphLabel(doc, "inside", margin, insideLineChartImage);

          // Draw the third graph [Outside diameter]
          DrawGraphLabel(doc, "outside", margin, outsideLineChartImage);

          // Draw the fourth graph [flat crush]
          DrawGraphLabel(doc, "flat_crush", margin, flatCrushLineChartImage);

          // Draw the last graph [h20]
          DrawGraphLabel(doc, "h2o", margin, h2oLineChartImage);

          // Horizontal line for footer
          DrawHorizontalLine(doc, margin, 720);

          // Draw Footer
          DrawFooter(
            doc,
            margin, // used to map x position
            orderNo,
            current_date
          );

          // Page 03 start
          doc.addPage();

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

          // Right header text
          DrawRightHeader(doc, "AQ 30", 3, margin);

          // Main header text
          DrawMainHeader(doc, company_name, margin, 3);

          // Horizontal line below headers
          DrawHorizontalLine(doc, margin, 130);

          // Draw the tables in page 03 (pass 2 as startPage since we just added a page, making it page 2)
          DrawMeasurementTables(
            doc,
            180,
            measurementData,
            company_name,
            orderNo,
            current_date,
            2 // Start on page 2 (the page we just added)
          );

          // Horizontal line for footer
          DrawHorizontalLine(doc, margin, 720);

          // Draw Footer
          DrawFooter(
            doc,
            margin, // used to map x position
            orderNo,
            current_date
          );
          
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

  // Modified handleClick to first fetch matching articles and show modal
  const handleClick = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select an order", { duration: 1000 });
      return;
    }

    setIsFetchingMatches(true);
    setIsLoading(true);
    setButtonLabel("Checking matches...");

    try {
      // Fetch matching articles for each selected order
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

      // Reset selected articles when opening modal
      setSelectedArticlesByOfid({});
      
      // Show modal with matching articles
      setMatchingArticlesByOfid(matchesByOfid);
      setIsModalOpen(true);
      setIsLoading(false);
      setButtonLabel("Download");
      setIsFetchingMatches(false);
      
      return; // Don't proceed with PDF generation yet - user must click "Proceed"
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
        const newOfidSelections = { ...ofidSelections };
        delete newOfidSelections[articleId];
        return {
          ...prev,
          [ofid]: Object.keys(newOfidSelections).length > 0 ? newOfidSelections : undefined,
        };
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
