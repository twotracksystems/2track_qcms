import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { formatNumberWithDecimals } from "@/utils/formatNumber";

/**
 * Draws a page header with centered text
 */
export function DrawRightHeader(
  doc: jsPDF,
  text: string,
  page_number: number = 0,
  y: number = 40 // margin from top
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Right header text
  doc.setFont("times", "bolditalic");
  doc.setFontSize(15);
  doc.text(text, pageWidth - y, y + 30, {
    align: "right",
  });

  // Indices text below right header
  doc.setFont("times", "italic");
  doc.setFontSize(15);
  doc.text(`Indice: 1`, pageWidth - y, y + 50, {
    align: "right",
  });
}

/**
 * Draws the main header with centered text and client/customer info
 */
export function DrawMainHeader(
  doc: jsPDF,
  client: string,
  margin: number = 40, // used to map x position
  page_number: number = 0
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  if (page_number === 1) {
    // Main header text
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.text(
      "Prufkontrol Bericht / Rapport de controle qualite / Quality control report",
      pageWidth / 2,
      margin + 85,
      { align: "center" }
    );

    // Header for client
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.text("Kunde", margin, margin + 110, { align: "left" });
    doc.text(`Client`, margin, margin + 125, {
      align: "left",
    });
    doc.text(`Customer`, margin, margin + 140, { align: "left" });

    doc.setFont("times", "bolditalic");
    doc.setFontSize(23);
    doc.text(`${client}`, pageWidth - margin, margin + 130, { align: "right" });
  } else {
    // Header for client
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.text("Kunde", margin, margin + 85, { align: "left" });
    doc.text(`Client`, margin, margin + 100, {
      align: "left",
    });
    doc.text(`Customer`, margin, margin + 115, { align: "left" });

    doc.setFont("times", "bolditalic");
    doc.setFontSize(23);
    doc.text(`${client}`, pageWidth - margin, margin + 110, { align: "right" });
  }
}

/**
 * Draws a horizontal line below the headers
 */
export function DrawHorizontalLine(
  doc: jsPDF,
  margin: number,
  y: number // specifies the y-coordinate start of the line
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Horizontal line separator with dark blue color (thin line for uniformity)
  doc.setDrawColor(30, 58, 138); // Dark blue color
  doc.setLineWidth(1);
  doc.line(margin, margin + y, pageWidth - margin, margin + y);
}

/**
 * Draws a left-aligned header with the given text
 */
export function DrawLeftHeader(
  doc: jsPDF,
  text: string,
  margin: number = 40, // used to map x position
  y: number // margin from top
) {
  //Header title: Order
  doc.setFont("times", "bolditalic");
  doc.setFontSize(12);
  doc.text(`${text}`, margin, margin + y, {
    align: "left",
  });
}

export function DrawGraphLabel(
  doc: jsPDF,
  section: string,
  margin: number = 40, // used to map x position
  chartImage: string // base 64 image data
) {
  const label_x_pos = margin + 20;
  let label_y_pos = 0;
  const chart_x_pos = margin + 100;
  let chart_y_pos = 0;

  const chart_width = 410;
  const chart_height = 105;

  let label: string[] = [];

  // Chart spacing: each chart needs ~120px vertical space (105px height + 15px spacing)
  const chartSpacing = 120;
  const firstChartStart = margin + 150;
  
  switch (section) {
    case "length":
      label = ["Länge", "Longueur", "Length", "mm"];
      label_y_pos = margin + 170;
      chart_y_pos = firstChartStart;
      break;
    case "inside":
      label = ["Innen Ø", "Ø Intérieur", "Inside Ø", "mm"];
      label_y_pos = firstChartStart + chartSpacing + 20;
      chart_y_pos = firstChartStart + chartSpacing;
      break;
    case "outside":
      label = ["Aussen Ø", "Ø Extérieur", "Outside Ø", "mm"];
      label_y_pos = firstChartStart + (chartSpacing * 2) + 20;
      chart_y_pos = firstChartStart + (chartSpacing * 2);
      break;
    case "flat_crush":
      label = ["Flat Crush", "(kN / dm)"];
      label_y_pos = firstChartStart + (chartSpacing * 3) + 20;
      chart_y_pos = firstChartStart + (chartSpacing * 3);
      break;
    case "h2o":
      label_y_pos = firstChartStart + (chartSpacing * 4) + 20;
      chart_y_pos = firstChartStart + (chartSpacing * 4);
      WriteH2OBold(doc, label_x_pos, label_y_pos);
      break;
  }

  doc.setFont("times", "bold");
  doc.setFontSize(12);

  label.forEach((lbl) => {
    // Loop through the different labels
    doc.text(lbl, label_x_pos, label_y_pos, { align: "left" });
    label_y_pos += 15;
  });

  // Add the Chart
  if (chartImage) {
    doc.addImage(
      chartImage,
      "PNG",
      chart_x_pos,
      chart_y_pos,
      chart_width,
      chart_height
    );
  }
}

export function DrawFooter(
  doc: jsPDF,
  margin: number = 40, // used to map x position
  order_number: string = "",
  date: string = ""
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text(`${date}`, margin, margin + 740, { align: "left" });
  doc.setFont("times", "bold");

  doc.setFont("times", "bold");
  doc.text(String(order_number), pageWidth / 2 + 5, margin + 740, {
    align: "center",
  });

  doc.text(`cartes de contrôle`, pageWidth - margin, margin + 740, {
    align: "right",
  });
}

/**
 * Draws the page-1 style footer: thin line above, then three columns:
 * Left: "Datum / Date" + date; Center: customer + "Unterschrift / Signature"; Right: "Document synthèse".
 * Positioned at bottom of page for use on any page.
 */
export function DrawPage1StyleFooter(
  doc: jsPDF,
  margin: number = 40,
  date: string = "",
  customer: string = ""
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const footerTableWidth = pageWidth - 2 * margin;
  const footerColWidth = Math.floor(footerTableWidth / 3);
  const footerRowHeight = 15;
  const footerTableHeight = footerRowHeight * 2;
  const lineY = pageHeight - margin - footerTableHeight - 25;
  const footerTableY = pageHeight - margin - footerTableHeight - 5;

  // Line above footer
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(1);
  doc.line(margin, lineY, pageWidth - margin, lineY);

  const fColX1 = margin;
  const fColX2 = fColX1 + footerColWidth;
  const fColX3 = fColX2 + footerColWidth;

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text("Datum / Date", fColX1 + 8, footerTableY + 15);

  doc.setFont("times", "bolditalic");
  doc.text(`${date}`, fColX1 + 8, footerTableY + footerRowHeight + 15);

  doc.setFont("times", "italic");
  doc.text(`${customer}`, fColX2 + 8, footerTableY + 15, { align: "center" });
  doc.text(
    "Unterschrift / Signature",
    fColX2 + 8,
    footerTableY + footerRowHeight + 15,
    { align: "center" }
  );

  doc.setFont("times", "bold");
  doc.text(
    "Document synthèse",
    fColX3 + footerColWidth / 2,
    footerTableY + footerRowHeight,
    { align: "center" }
  );
}

export type H2OLabelStyle = "normal" | "bold" | "italic" | "bolditalic";

/**
 * Draw "H₂O (%)" with manual subscript (H, small 2 lower, O (%)) so it renders
 * correctly in PDF without relying on Unicode subscript in the font.
 */
export function drawH2OLabel(
  doc: jsPDF,
  x: number,
  y: number,
  options: {
    fontSize?: number;
    style?: H2OLabelStyle;
    subscriptOffset?: number;
    subscriptSizeRatio?: number;
    centered?: boolean;
    cellWidth?: number;
  } = {}
) {
  const fontSize = options.fontSize ?? 12;
  const style = options.style ?? "normal";
  const subOffset = options.subscriptOffset ?? 2.5;
  const subRatio = options.subscriptSizeRatio ?? 0.7;
  const subSize = Math.max(6, fontSize * subRatio);

  doc.setFont("times", style);
  doc.setFontSize(fontSize);
  const wH = doc.getTextWidth("H");
  doc.setFontSize(subSize);
  const w2 = doc.getTextWidth("2");
  doc.setFontSize(fontSize);
  const wO = doc.getTextWidth("O (%)");
  const totalWidth = wH + w2 + wO;

  let startX = x;
  if (options.centered && options.cellWidth != null) {
    startX = x + (options.cellWidth - totalWidth) / 2;
  }

  doc.setFontSize(fontSize);
  doc.setFont("times", style);
  doc.text("H", startX, y);

  doc.setFontSize(subSize);
  doc.setFont("times", style);
  doc.text("2", startX + wH, y + subOffset);

  doc.setFontSize(fontSize);
  doc.setFont("times", style);
  doc.text("O (%)", startX + wH + w2, y);
}

export function WriteH2OBold(doc: jsPDF, x: number, y: number) {
  drawH2OLabel(doc, x, y, { fontSize: 12, style: "bold" });
}

export function WriteH2OItalic(doc: jsPDF, x: number, y: number) {
  drawH2OLabel(doc, x, y, { fontSize: 12, style: "italic" });
}

/**
 * Render "H₂O (%)" table header for customer specification (humidity), centered in cell.
 */
export function renderH2OTableHeader(doc: jsPDF, x: number, y: number, width: number) {
  const centerY = y + 6;
  drawH2OLabel(doc, x, centerY, {
    fontSize: 10,
    style: "bolditalic",
    centered: true,
    cellWidth: width,
  });
}

type TableHead = string[][];
type TableBody = RowInput[];

/**
 * Draws measurement tables starting page 3:
 * - Measurements: single full-width table, continues on next page if needed
 */
export function DrawMeasurementTables(
  doc: jsPDF,
  marginTopStartPage3: number = 180, // header-safe top margin on pages >= 3
  measurementData: any[],
  company_name: string = "",
  orderNo: string = "",
  current_date: string = "",
  startPage: number = 3, // Page number to start drawing tables
  logoBase64?: string, // optional: draw page-1 style header with logo
  customer: string = ""
) {
  // ---------- Build table heads & bodies ----------
  const measurementsHead: TableHead = [
    ["Pal Nr", "L (mm)", "Ø in (mm)", "Ø out (mm)", "OK"],
  ];
  const measurementsBody: TableBody = [];

  // Measurements body - sort by pallet count in ascending order, then by import_datetime
  // Data from tbl_measurement_prod uses palette_num (not pallete_count)
  const sortedMeasurementData = [...measurementData].sort((a, b) => {
    // Check for palette_num first (from tbl_measurement_prod), then fallback to other field names
    const palA = Number(a["palette_num"] ?? a["pallete_count"] ?? a["palette_count"]) || 0;
    const palB = Number(b["palette_num"] ?? b["pallete_count"] ?? b["palette_count"]) || 0;
    
    // Primary sort: palette_num/pallete_count
    if (palA !== palB) {
      return palA - palB;
    }
    
    // Secondary sort: import_datetime (from tbl_measurement_prod) within same palette
    const dateA = a["import_datetime"] ? new Date(a["import_datetime"]).getTime() : 0;
    const dateB = b["import_datetime"] ? new Date(b["import_datetime"]).getTime() : 0;
    return dateA - dateB;
  });

  console.log("DrawMeasurementTables - Processing measurement data:", {
    totalRecords: sortedMeasurementData.length,
    sampleRecord: sortedMeasurementData[0],
    allRecords: sortedMeasurementData
  });

  for (const data of sortedMeasurementData) {
    // Check for palette_num first (from tbl_measurement_prod), then fallback to other field names
    const pal = data["palette_num"] ?? data["pallete_count"] ?? data["palette_count"] ?? data["palleteCount"] ?? data["paletteCount"];
    
    // Convert to number, show "--" if missing or invalid (no incremental fallback)
    let palNumber: number | string;
    if (pal != null && !isNaN(Number(pal)) && Number(pal) !== 0) {
      palNumber = Number(pal);
    } else {
      // Show "--" when pallete_count is missing, invalid, or 0
      palNumber = "--";
    }
    
    // Helper function to format measurement values: show "--" if null, undefined, empty, or 0
    const formatMeasurement = (value: any): string | number => {
      if (value == null || value === "" || Number(value) === 0) {
        return "--";
      }
      // Format the number to show 2 decimal places only if there are decimal values
      const formatted = formatNumberWithDecimals(value);
      return formatted === "" ? "--" : formatted;
    };
    
    // Always add to measurements table if we have any measurement data
    // Check if at least one measurement field exists (excluding 0 values)
    const hasAnyMeasurement = 
      (data["length"] != null && Number(data["length"]) !== 0) || 
      (data["inside_diameter"] != null && Number(data["inside_diameter"]) !== 0) || 
      (data["outside_diameter"] != null && Number(data["outside_diameter"]) !== 0);
    
    if (hasAnyMeasurement) {
      // OK column (geometry_valid): show "1" when valid, otherwise blank
      const okValue =
        data["geometry_valid"] != null && Number(data["geometry_valid"]) !== 0
          ? "1"
          : "";
      measurementsBody.push([
        palNumber, // Use the numeric value or "--"
        formatMeasurement(data["length"]),
        formatMeasurement(data["inside_diameter"]),
        formatMeasurement(data["outside_diameter"]),
        okValue,
      ]);
    }
  }

  console.log("DrawMeasurementTables - Built measurements body:", {
    bodyLength: measurementsBody.length,
    sampleRow: measurementsBody[0]
  });

  // ---------- Page & layout constants ----------
  ensurePage(doc, startPage);
  const pageW = doc.internal.pageSize.getWidth();

  // Content margins: first page starts below header; continuation pages use minimal top so table fills the page
  const contentTopFirstPage = marginTopStartPage3;
  const contentTopContinuation = 40; // use header area on continuation pages (no header drawn there)
  const contentBottom = 100;

  const sideLeft = 40;
  const sideRight = 40;

  const printableW = pageW - (sideLeft + sideRight);

  // --------- Ensure target page and draw page-1 style headers/footer ---------
  let currentPage = startPage;
  if (currentPage > doc.getNumberOfPages()) doc.addPage();
  doc.setPage(currentPage);

  const margin = 40;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, margin, 200, 70);
    } catch (_) {}
  }
  DrawHorizontalLine(doc, margin, 0);
  DrawRightHeader(doc, "AQ 30", 1, margin);
  DrawMainHeader(doc, company_name, margin, 1);
  DrawHorizontalLine(doc, margin, 155);
  DrawHorizontalLine(doc, margin, 710);
  DrawPage1StyleFooter(doc, margin, current_date, customer);

  // --------- Render MEASUREMENTS as single full-width table (1 fold), flow to next page if needed ---------
  // startY: first page only (below header). margin.top: used on continuation pages so table occupies header area
  if (measurementsBody.length > 0) {
    autoTable(doc, {
      head: measurementsHead,
      body: measurementsBody,
      startY: contentTopFirstPage,
      tableWidth: printableW,
      margin: {
        top: contentTopContinuation,
        bottom: contentBottom,
        left: sideLeft,
        right: sideRight,
      },
      theme: "grid",
      rowPageBreak: "auto",
      showHead: "everyPage",
      styles: {
        font: "times",
        fontSize: 10,
        halign: "center",
        valign: "middle",
        cellWidth: "wrap",
      },
      headStyles: {
        fontStyle: "bolditalic",
        fontSize: 10,
        halign: "center",
        fillColor: false,
        textColor: "black",
      },
    });
  }
}

/**
 * Draws a table for Flat Crush and H2O values
 * Only shows rows with valid numeric values (filters out rows where both are invalid)
 */
export function DrawFlatCrushH2OTable(
  doc: jsPDF,
  measurementData: any[],
  margin: number = 40,
  startY: number = 0
) {
  // Sort measurement data by palette_num
  const sortedData = [...measurementData].sort((a, b) => {
    const palA = Number(a["palette_num"] ?? a["palete_count"] ?? a["palette_count"]) || 0;
    const palB = Number(b["palette_num"] ?? b["palete_count"] ?? b["palette_count"]) || 0;
    return palA - palB;
  });

  // Helper function to check if value is a valid number
  const isValidNumber = (value: any): boolean => {
    if (value == null || value === undefined || value === "") {
      return false;
    }
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue !== 0;
  };

  // Helper function to format values (only for valid numbers)
  const formatValue = (value: any): string => {
    if (!isValidNumber(value)) {
      return "--";
    }
    const numValue = parseFloat(value);
    // Format with decimals only if needed (max 2 decimal places)
    return formatNumberWithDecimals(numValue);
  };

  // Build table body - only include rows where at least one value is valid
  // Flat crush displayed as kN/m: multiply by 10 (scale from per-10000 to per-1000)
  const tableBody: RowInput[] = sortedData
    .filter((data) => {
      const flatCrush = data["flat_crush"];
      const h2o = data["h2o"] ?? data["humidity"];
      // Only include rows where at least one value is a valid number
      return isValidNumber(flatCrush) || isValidNumber(h2o);
    })
    .map((data) => {
      const rawFlatCrush = data["flat_crush"];
      const flatCrush = isValidNumber(rawFlatCrush)
        ? formatValue(parseFloat(rawFlatCrush) * 10)
        : formatValue(rawFlatCrush);
      const h2o = formatValue(data["h2o"] ?? data["humidity"]);
      
      return [flatCrush, h2o];
    });

  // Check page boundaries to avoid overlap with footer
  const pageH = doc.internal.pageSize.getHeight();
  const footerArea = 100; // Footer area height
  const minSpaceNeeded = 50; // Minimum space needed for table (header + at least 1 row)
  const maxTableY = pageH - margin - footerArea - minSpaceNeeded;

  // Adjust startY if it would cause overlap
  let adjustedStartY = startY;
  if (startY > maxTableY) {
    // If table would overlap, move to next page
    doc.addPage();
    adjustedStartY = margin + 180; // Start below header on new page
  }

  // Only draw table if there's valid data
  if (tableBody.length > 0) {
    autoTable(doc, {
      head: [["Flat Crush (kN/dm)", ""]], // Second column drawn with subscript via didDrawCell
      body: tableBody,
      startY: adjustedStartY,
      margin: {
        left: margin,
        right: margin,
        bottom: footerArea + 10 // Ensure space above footer
      },
      theme: "grid",
      styles: {
        font: "times",
        fontSize: 10,
        halign: "center",
        valign: "middle",
        cellPadding: 5,
      },
      headStyles: {
        fontStyle: "bolditalic",
        fontSize: 10,
        halign: "center",
        fillColor: false,
        textColor: "black",
      },
      columnStyles: {
        0: { cellWidth: "auto", halign: "center" },
        1: { cellWidth: "auto", halign: "center" },
      },
      didDrawCell: (data: any) => {
        // Draw "H₂O (%)" with subscript in the second header cell
        if (data.section === "head" && data.column.index === 1) {
          const cellX = data.cell.x;
          const cellY = data.cell.y;
          const cellWidth = data.cell.width;
          const centerY = cellY + data.cell.height / 2 + 2;
          drawH2OLabel(doc, cellX, centerY, {
            fontSize: 10,
            style: "bolditalic",
            centered: true,
            cellWidth,
          });
        }
      },
      // Prevent table from extending into footer area
      didDrawPage: (data: any) => {
        const currentY = data.cursor.y;
        const maxY = pageH - margin - footerArea;
        if (currentY > maxY) {
          return false; // Stop drawing if we'd hit the footer
        }
      },
    });
  }

  // Return the final Y position after the table
  return (doc as any).lastAutoTable?.finalY || adjustedStartY;
}

/* ---------- Helpers ---------- */

/** Ensure at least N pages exist; set current page to N. */
function ensurePage(doc: jsPDF, pageNumber: number) {
  const have = doc.getNumberOfPages();
  for (let i = have; i < pageNumber; i++) doc.addPage();
  doc.setPage(pageNumber);
}

/** Conservative single-line row height estimation used for chunking. */
function estimateRowHeight(doc: jsPDF, fontSize: number) {
  const prev = doc.getFontSize();
  doc.setFontSize(fontSize);
  const h = doc.getTextDimensions("Ag").h;
  doc.setFontSize(prev);
  // Add padding + line/border breathing room
  return h * 1.15 + 7;
}

/** Header height estimate for a single header row. */
function estimateHeadHeight(doc: jsPDF, fontSize: number) {
  const prev = doc.getFontSize();
  doc.setFontSize(fontSize);
  const h = doc.getTextDimensions("Ag").h;
  doc.setFontSize(prev);
  return h * 1.2 + 8;
}

/** How many rows fit in one column (considering header & margins). */
function estimateRowsPerColumn(
  doc: jsPDF,
  pageH: number,
  margin: { top: number; bottom: number },
  head: TableHead,
  fontSize: number
) {
  const contentH = pageH - margin.top - margin.bottom;
  const headH = estimateHeadHeight(doc, fontSize);
  const rowH = estimateRowHeight(doc, fontSize);
  return Math.max(1, Math.floor((contentH - headH) / rowH));
}

/** Split rows into equal-sized chunks (for left/right column paging). */
function chunkRows<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}
