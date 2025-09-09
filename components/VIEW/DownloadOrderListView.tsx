"use client";
import React from "react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { create } from "domain";
import { useState, useRef } from "react";

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
  selectedOrders?: any; // Array of selected order objects
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
  selectedOrders, // Array of selected order objects from the rows
}: DownloadOrderListViewProps) {
  const baseStyle = { backgroundColor: "#1d4ed8", color: "#fff" };
  const disabledStyle = { opacity: 0.5, cursor: "not-allowed" };

  const [isDisabled, setIsDisabled] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("Download");

  const canvasRef = useRef<HTMLCanvasElement>(null); // used to refer to the canvas element containing the chart

  // function to get customer specifications data
  const GetCustomerSpecificationsData = async (
    nominalArticleId: number,
    minArticleId: number,
    maxArticleId: number
  ) => {
    const customerSpecificationsDataAggregated = [];

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

    const nominalResult = await responseNominal.json();

    if (responseNominal.ok) {
      customerSpecificationsDataAggregated.push(nominalResult[0]);
    } else {
      customerSpecificationsDataAggregated.push({});
    }

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

    const minResult = await responseMin.json();

    if (responseMin.ok) {
      customerSpecificationsDataAggregated.push(minResult[0]);
    } else {
      customerSpecificationsDataAggregated.push({});
    }

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

    const maxResult = await responseMax.json();

    if (responseMax.ok) {
      customerSpecificationsDataAggregated.push(maxResult[0]);
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
      toast.error;
    }
  };

  function calculateStats(data: Measurement[], field: keyof Measurement) {
    // returns the descriptive statistics of the order measurements
    const values = data
      .map((d) => d[field])
      .filter((v): v is number => typeof v === "number" && !isNaN(v));

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

    // Helper to fix decimals to 2 places
    const round2 = (num: number) => Number(num.toFixed(4));

    return {
      mean: round2(mean),
      min: round2(min),
      max: round2(max),
      stdDev: round2(stdDev),
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
    const labels = data.map((d) => String(d.palette_count));
    const values = data.map((d) => d.data);

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.1; // 10% headroom
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
            pointRadius: 1,
          },
          // Mean point dataset
          {
            label: "Mean",
            data: new Array(values.length)
              .fill(null)
              .map((_, i) =>
                i === Math.floor(values.length / 2) ? meanValue : null
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
            const y = yScale.getPixelForValue(meanValue);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(chart.chartArea.left, y);
            ctx.lineTo(chart.chartArea.right, y);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]); // dashed line
            ctx.stroke();
            ctx.restore();
          },
        },
      ],
    });

    const imageUrl = canvas.toDataURL("image/png");
    chart.destroy(); // free up the canvas for reuse
    return imageUrl;
  }

  const handleClick = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select an order", { duration: 1000 });
      return;
    }
    try {
      // Open a blank tab synchronously if previewing to avoid popup blockers
      const shouldPreview = mode !== "download";
      const previewWindow = shouldPreview ? window.open("", "_blank") : null;

      const pdfs: any[] = [];
      setButtonLabel("Downloading..."); // inform user that doc is downloading
      setIsDisabled(true); // disables button during downloading

      await Promise.all(
        selectedOrders.map(async (order: any) => {
          // map over selected orders
          const get = (v: any, fallback = "***") =>
            v === null || v === undefined || v === "" ? fallback : String(v);

          // to be placed at the bottom left of the first page
          const current_date = new Date().toLocaleDateString("en-GB");

          // get company name
          const company_name = get(order.tbl_customer.company_name);

          let customer: String = "";

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
          const measurementData = await GetMeasurementData(
            get(order.id) as unknown as number
          );

          // fetch customer specifications data
          const customerSpecificationsData =
            await GetCustomerSpecificationsData(
              get(order.tbl_article?.article_nominal) as unknown as number,
              get(order.tbl_article?.article_min) as unknown as number,
              get(order.tbl_article?.article_max) as unknown as number
            );

          // customer specifications data
          const nominal_data = customerSpecificationsData[0];
          const max_data = customerSpecificationsData[1];
          const min_data = customerSpecificationsData[2];

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
              String(nominal_data[data] ?? "*"),
              colX2 + specColOtherWidth / 2,
              y,
              {
                // if data does not exist, put *
                align: "center",
              }
            );
            doc.text(
              String(max_data[data] ?? "*"),
              colX3 + specColOtherWidth / 2,
              y,
              {
                align: "center",
              }
            );
            doc.text(
              String(min_data[data] ?? "*"),
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

          // LENGTH DATA
          const lengthData: chartData[] = measurementData // use the length data in the measurements table of the order ID
            .map((lengthInstance: any) => ({
              data: lengthInstance["length"],
              palette_count: Number(lengthInstance["pallete_count"]),
            }));

          const lengthLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            lengthData,
            orderLengthStats["mean"]
          ).then();

          // INSIDE DATA
          const insideData: chartData[] = measurementData // use the inside diameter data in the measurements table of the order ID
            .map((insideInstance: any) => ({
              data: insideInstance["inside_diameter"],
              palette_count: Number(insideInstance["pallete_count"]),
            }));

          const insideLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            insideData,
            orderInsideDiameterStats["mean"]
          ).then();

          // OUTSIDE DATA
          const outsideData: chartData[] = measurementData // use the outside diameter data in the measurements table of the order ID
            .map((outsideInstance: any) => ({
              data: outsideInstance["outside_diameter"],
              palette_count: Number(outsideInstance["pallete_count"]),
            }));

          const outsideLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            outsideData,
            orderOutsideDiameterStats["mean"]
          ).then();

          // FLAT CRUSH DATA
          const flatCrushData: chartData[] = measurementData // use the flat crush data in the measurements table of the order ID
            .map((flatCrushInstance: any) => ({
              data: flatCrushInstance["flat_crush"],
              palette_count: Number(flatCrushInstance["pallete_count"]),
            }));

          const flatCrushLineChartImage = await generateLineChartImage(
            canvasRef.current!,
            flatCrushData,
            orderFlatCrushStats["mean"]
          );

          // H2O DATA
          const h2oData: chartData[] = measurementData // use the h2O data in the measurements table of the order ID
            .map((h2oInstance: any) => ({
              data: h2oInstance["h20"],
              palette_count: Number(h2oInstance["pallete_count"]),
            }));

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

          // Draw the tables in page 03
          DrawMeasurementTables(
            doc,
            180,
            measurementData,
            company_name,
            orderNo,
            current_date
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
          const pdfFileName = `quality_control_report_order_${orderNo}`;

          pdfs.push({ doc, filename: pdfFileName }); // collect blobs for zip
        })
      );

      if (pdfs.length > 1) {
        // more than 1 file to download - create zip
        const zip = new JSZip();
        mode = "download";

        pdfs.forEach(({ doc, filename }) => {
          const pdfBlob = doc.output("blob");
          zip.file(`${filename}.pdf`, pdfBlob);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "quality_control_reports.zip");
        toast.success("ZIP with PDFs downloaded");
        setIsDisabled(false);
        setButtonLabel("Download");
      } else {
        // isa lang ka file ang idownload or preview
        // Generate PDF blob for preview
        const { doc, filename } = pdfs[0];
        const pdfBlob = doc.output("blob");

        // Handle different modes
        if (mode === "preview") {
          onPDFGenerated?.(pdfBlob);
          const url = URL.createObjectURL(pdfBlob);
          (window as any).__lastPdfUrl = url; // Access from DevTools: window.__lastPdfUrl
          if (previewWindow) {
            try {
              previewWindow.location.assign(url);
            } catch (_) {
              window.open(url, "_blank");
            }
          } else {
            window.open(url, "_blank");
          }
          toast.success("PDF generated for preview");
          setIsDisabled(false);
          setButtonLabel("Download");
          return;
        } else if (mode === "download") {
          // Prefer the generated filename, fallback to prop
          doc.save(filename || fileName);
          toast.success("PDF downloaded");
          setIsDisabled(false);
          setButtonLabel("Download");
        } else {
          onPDFGenerated?.(pdfBlob);
          const url = URL.createObjectURL(pdfBlob);
          (window as any).__lastPdfUrl = url; // Access from DevTools: window.__lastPdfUrl
          if (previewWindow) {
            try {
              previewWindow.location.assign(url);
            } catch (_) {
              window.open(url, "_blank");
            }
          } else {
            window.open(url, "_blank");
          }
          const a = document.createElement("a");
          a.href = url;
          a.download = filename || fileName || pdfs[0]["filename"]; // Use the pdf's filename
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success("PDF generated for preview");
          setIsDisabled(false);
          setButtonLabel("Download");
          return;
        }
      }
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to generate PDF");
      setIsDisabled(false);
      setButtonLabel("Download");
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`btn ${className}`}
        style={isDisabled ? { ...baseStyle, ...disabledStyle } : baseStyle}
      >
        {buttonLabel}
      </button>
      <canvas
        ref={canvasRef}
        width="400"
        height="200"
        style={{ display: "none" }}
      />
    </div>
  );
}
