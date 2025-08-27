"use client";
import React from "react";
import toast from "react-hot-toast";
import { createClient } from "@/utils/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { create } from "domain";
import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

// necessary packages for generating PDFs
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  drawHorizontalLine,
  drawLeftHeader,
  drawMainHeader,
  drawRightHeader,
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

export default function DownloadOrderListView({
  label = "Download",
  className = "",
  fileName = "quality_control_report.pdf",
  onPDFGenerated,
  mode = "preview",
  selectedOrders, // Array of selected order objects from the rows
}: DownloadOrderListViewProps) {
    const GetCustomerSpecificationsData = async (nominalArticleId:number, minArticleId:number, maxArticleId:number ) => {
      const customerSpecificationsDataAggregated = [];

      const responseNominal = await fetch(
        `/api/v1/getonearticlenominal?id=${encodeURIComponent(
          nominalArticleId
        )}`,
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
        console.log("Fetched Article Nominal:", nominalResult);
        customerSpecificationsDataAggregated.push(nominalResult);
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
        console.log("Fetched Article Min:", minResult);
        customerSpecificationsDataAggregated.push(minResult);
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
        console.log("Fetched Article Max:", maxResult);
        customerSpecificationsDataAggregated.push(maxResult);
      } else {
        customerSpecificationsDataAggregated.push({});
      }

      return customerSpecificationsDataAggregated;
    };

  const handleClick = async () => {
    try {
      console.log("Selected Orders: ", selectedOrders);
      const pdfs: any[] = [];

      await Promise.all(
        selectedOrders.map(async (order: any) => {
          // map over selected orders
          const get = (v: any, fallback = "***") =>
            v === null || v === undefined || v === "" ? fallback : String(v);
          const client = get(undefined); // populated from parent when a row is selected
          const customer = get(undefined); // populated from parent when a row is selected
          const orderNo = get(order.order_fabrication_control);

          // format delivery date
          const deliveryDate = get(order.exit_date_time);
          const deliveryDateFormatted = new Date(
            deliveryDate
          ).toLocaleDateString("en-GB");
          const deliveryDateTime = new Date(deliveryDate).toLocaleTimeString(
            "en-GB",
            { hour: "2-digit", minute: "2-digit", second: "2-digit" }
          );

          // format production date
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

          console.log("selected orders: ", order);

          
          const customerSpecificationsData = await GetCustomerSpecificationsData(
            get(order.tbl_article?.article_nominal) as unknown as number,
            get(order.tbl_article?.article_min) as unknown as number,
            get(order.tbl_article?.article_max) as unknown as number  
          )

          console.log(
            "Customer Specifications Data:",
            customerSpecificationsData
          );

          const { default: jsPDF } = await import("jspdf");
          const doc = new jsPDF({ unit: "pt", format: "a4" });
          const pageWidth = doc.internal.pageSize.getWidth();
          const margin = 40;

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
          drawRightHeader(doc, "AQ 30", margin);

          // Main header text
          drawMainHeader(doc, "Corex AG", customer, margin);

          // Horizontal line below headers
          drawHorizontalLine(doc, margin, 155);

          //Header title: Order
          drawLeftHeader(doc, "Bestellung / Commande / Order", margin, 175);

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
          doc.text(deliveryDateFormatted, margin + col1Width + 15, tableY + 41);
          doc.text(deliveryDateTime, margin + col1Width + 15, tableY + 53);

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
          drawHorizontalLine(doc, margin, 280);

          //Header title: Customer specifications
          drawLeftHeader(
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

          // Fill placeholder values *** for columns 2-4, rows 2-6
          const placeholderRows = [1, 2, 3, 4, 5]; // zero-based rows for 2..6
          placeholderRows.forEach((r) => {
            const y = specTableY + r * rowHeight + 16;
            doc.text("***", colX2 + specColOtherWidth / 2, y, {
              align: "center",
            });
            doc.text("***", colX3 + specColOtherWidth / 2, y, {
              align: "center",
            });
            doc.text("***", colX4 + specColOtherWidth / 2, y, {
              align: "center",
            });
          });

          // Horizontal line separator with dark blue color
          doc.setDrawColor(30, 58, 138); // Dark blue color
          doc.setLineWidth(2);
          doc.line(margin, margin + 480, pageWidth - margin, margin + 480);

          //Header title: Order
          doc.setFont("times new roman", "bolditalic");
          doc.setFontSize(12);
          doc.text(
            "Kontrolergebnisse / Resultats de constrole / Control results",
            margin,
            margin + 500,
            { align: "left" }
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
          doc.setDrawColor(30, 58, 138); // Dark blue color
          doc.setLineWidth(2);
          doc.line(margin, margin + 680, pageWidth - margin, margin + 680);

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
          doc.text("***", fColX1 + 8, footerTableY + footerRowHeight + 15);

          // Second column content
          doc.text("***", fColX2 + 8, footerTableY + 15);
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

          pdfs.push(doc); // collect blobs for zip
        })
      );

      if (pdfs.length > 1) {
        // more than 1 file to download - create zip
        const zip = new JSZip();
        pdfs.forEach((pdfDoc, index) => {
          const pdfBlob = pdfDoc.output("blob");
          zip.file(`quality_control_report_${index + 1}.pdf`, pdfBlob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "quality_control_reports.zip");
        toast.success("ZIP with PDFs downloaded");
      } else {
        // isa lang ka file ang idownload or preview
        // Generate PDF blob for preview
        const pdfBlob = pdfs[0].output("blob");

        // Handle different modes
        if (mode === "preview" || mode === "both") {
          onPDFGenerated?.(pdfBlob);
          if (mode === "preview") {
            const url = URL.createObjectURL(pdfBlob);
            console.log("[DownloadOrderListView] Preview Blob URL:", url);
            (window as any).__lastPdfUrl = url; // Access from DevTools: window.__lastPdfUrl
            window.open(url);
            toast.success("PDF generated for preview");
            return;
          }
        }

        if (mode === "download" || mode === "both") {
          pdfs[0].save(fileName);
          toast.success("PDF downloaded");
        }
      }
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`btn ${className}`}
      style={{ backgroundColor: "#1d4ed8", color: "#fff" }}
    >
      {label}
    </button>
  );
}
