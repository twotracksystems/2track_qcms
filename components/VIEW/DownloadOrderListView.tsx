"use client";
import React from "react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { create } from "domain";
import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

// packages to generate the different charts
import { Doughnut } from "react-chartjs-2";

import {
  DrawFooter,
  DrawGraph,
  DrawHorizontalLine,
  DrawLeftHeader,
  drawMainHeader,
  drawRightHeader,
} from "./PDFBuilder";

// necessary packages for exporting zip files
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Duration } from "luxon";

interface DownloadOrderListViewProps {
  label?: string;
  className?: string;
  fileName?: string;
  onPDFGenerated?: (blob: Blob) => void;
  mode?: "download" | "preview" | "both";
  selectedOrders?: any; // Array of selected order objects
}

export default function DownloadOrderListView({
  label = "Download",
  className = "",
  fileName = "quality_control_report.doc",
  onPDFGenerated,
  mode = "both",
  selectedOrders, // Array of selected order objects from the rows
}: DownloadOrderListViewProps) {
  const baseStyle = { backgroundColor: "#1d4ed8", color: "#fff" };
  const disabledStyle = { opacity: 0.5, cursor: "not-allowed" };

  const [isDisabled, setIsDisabled] = useState(false);
  const [buttonLabel, setButtonLabel] = useState("Download");

  // function to get control results
  const GetControlResults = async () => {};

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

  const handleClick = async () => {
    console.log(selectedOrders);

    if (selectedOrders.length === 0) {
      toast.error("Please select an order", { duration: 1000 });
      return;
    }
    try {
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

          const company_name = get(order.tbl_customer.company_name);

          let customer: String = "";
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

          const orderNo = get(order.order_fabrication_control);

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
          drawRightHeader(doc, "AQ 30", 1, margin);

          // Main header text
          drawMainHeader(doc, company_name, margin, 1);

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
          doc.setFont("times new roman", "italic");
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
          doc.setFont("times new roman", "bold");
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
          doc.setFont("times new roman", "italic");
          doc.setFontSize(10);

          // Column headers (row 1)
          // First column header is intentionally blank
          doc.setFont("times new roman", "bold");
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
          doc.setFont("times new roman", "italic");

          // First column labels
          const col1Labels = [
            "", // row 1 blank
            "Lange (mm) / Longueur (mm) / Length (mm)",
            "Innen (mm) / Interieur (mm) / Inside (mm)",
            "Aussen (mm) / exterieur (mm) / Outside (mm)",
            "Flat Crush (kN/m)",
            "H20 (%)",
          ];

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
          doc.setFont("times new roman", "bolditalic");
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

          // (Optional borders disabled to keep lines transparent)
          // doc.setDrawColor(30, 58, 138);
          // doc.setLineWidth(1);
          // doc.rect(margin, ctrlTableY, ctrlTableWidth, ctrlRowHeight * ctrlRows);

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

          // doc.line(ctrlColX2, ctrlTableY, ctrlColX2, ctrlTableY + ctrlRowHeight * ctrlRows);
          // doc.line(ctrlColX3, ctrlTableY, ctrlColX3, ctrlTableY + ctrlRowHeight * ctrlRows);
          // doc.line(ctrlColX4, ctrlTableY, ctrlColX4, ctrlTableY + ctrlRowHeight * ctrlRows);
          // doc.line(ctrlColX5, ctrlTableY, ctrlColX5, ctrlTableY + ctrlRowHeight * ctrlRows);
          for (let i = 1; i < ctrlRows; i++) {
            // doc.line(margin, ctrlTableY + i * ctrlRowHeight, margin + ctrlTableWidth, ctrlTableY + i * ctrlRowHeight);
          }

          // Table text
          doc.setFont("times new roman", "italic");
          doc.setFontSize(10);

          // Column headers (row 1) — first column blank
          doc.setFont("times new roman", "bold");
          doc.text("x̄", ctrlCenter2, ctrlTableY + 16, { align: "center" });
          doc.text("Min (X)", ctrlCenter3, ctrlTableY + 16, {
            align: "center",
          });
          doc.text("Max (X)", ctrlCenter4, ctrlTableY + 16, {
            align: "center",
          });
          doc.text("σ (X)", ctrlCenter5, ctrlTableY + 16, { align: "center" });

          // Restore normal style for body rows
          doc.setFont("times new roman", "italic");

          // First column labels
          const ctrlCol1Labels = [
            "", // row 1 blank
            "Lange (mm) / Longueur (mm) / Length (mm)",
            "Innen (mm) / Interieur (mm) / Inside (mm)",
            "Aussen (mm) / exterieur (mm) / Outside (mm)",
            "Flat Crush (kN/m)",
            "H20 (%)",
          ];

          // Fill first column
          for (let r = 0; r < ctrlRows; r++) {
            const y = ctrlTableY + r * ctrlRowHeight + 16;
            doc.text(ctrlCol1Labels[r], margin + 8, y);
          }

          // Fill placeholder values *** for columns 2-5, rows 2-6
          const ctrlPlaceholderRows = [1, 2, 3, 4, 5]; // zero-based rows for 2..6
          ctrlPlaceholderRows.forEach((r) => {
            const y = ctrlTableY + r * ctrlRowHeight + 16;
            doc.text("***", ctrlCenter2, y, { align: "center" });
            doc.text("***", ctrlCenter3, y, { align: "center" });
            doc.text("***", ctrlCenter4, y, { align: "center" });
            doc.text("***", ctrlCenter5, y, { align: "center" });
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

          doc.setFont("times new roman", "italic");
          doc.setFontSize(10);

          // First column content
          doc.text("Datum / Date", fColX1 + 8, footerTableY + 15);

          doc.setFont("times new roman", "bolditalic");
          doc.text(
            `${current_date}`,
            fColX1 + 8,
            footerTableY + footerRowHeight + 15
          );

          doc.setFont("times new roman", "italic");
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
          doc.setFont("times new roman", "bold");
          doc.text(
            "Document synthese",
            fColX3 + footerColWidth / 2,
            footerTableY + footerRowHeight,
            { align: "center" }
          );

          // Page 02 start
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
          drawRightHeader(doc, "AQ 30", 2, margin);

          // Main header text
          drawMainHeader(doc, company_name, margin, 2);

          // Horizontal line below headers
          DrawHorizontalLine(doc, margin, 130);

          // Draw the first graph

          DrawGraph(doc, nominal_data["length"], margin);

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
          drawRightHeader(doc, "AQ 30", 3, margin);

          // Main header text
          drawMainHeader(doc, company_name, margin, 3);

          // Horizontal line below headers
          DrawHorizontalLine(doc, margin, 130);

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
        console.log("pdfs for zipping: ", pdfs);

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
        const { doc, fileName } = pdfs[0];
        const pdfBlob = doc.output("blob");

        // Handle different modes
        if (mode === "preview") {
          onPDFGenerated?.(pdfBlob);
          if (mode === "preview") {
            const url = URL.createObjectURL(pdfBlob);
            console.log("[DownloadOrderListView] Preview Blob URL:", url);
            (window as any).__lastPdfUrl = url; // Access from DevTools: window.__lastPdfUrl
            window.open(url);
            toast.success("PDF generated for preview");
            setIsDisabled(false);
            setButtonLabel("Download");
            return;
          }
        } else if (mode === "download") {
          doc.save(fileName);
          toast.success("PDF downloaded");
          setIsDisabled(false);
          setButtonLabel("Download");
        } else {
          onPDFGenerated?.(pdfBlob);
          const url = URL.createObjectURL(pdfBlob);
          console.log("[DownloadOrderListView] Preview Blob URL:", url);
          (window as any).__lastPdfUrl = url; // Access from DevTools: window.__lastPdfUrl
          window.open(url);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName || pdfs[0]["filename"]; // Use the pdf's fileName
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
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`btn ${className}`}
      style={isDisabled ? { ...baseStyle, ...disabledStyle } : baseStyle}
    >
      {buttonLabel}
    </button>
  );
}
