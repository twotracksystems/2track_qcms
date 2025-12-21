import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";

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

  // Horizontal line separator with dark blue color
  doc.setDrawColor(30, 58, 138); // Dark blue color
  doc.setLineWidth(2);
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

  switch (section) {
    case "length":
      label = ["Länge", "Longueur", "Length", "mm"];
      label_y_pos = margin + 170;
      chart_y_pos = margin + 150;
      break;
    case "inside":
      label = ["Innen Ø", "Ø Intérieur", "Inside Ø", "mm"];
      label_y_pos = margin + 280;
      chart_y_pos = margin + 260;
      break;
    case "outside":
      label = ["Aussen Ø", "Ø Extérieur", "Outside Ø", "mm"];
      label_y_pos = margin + 390;
      chart_y_pos = margin + 370;
      break;
    case "flat_crush":
      label = ["Flat Crush", "(kN / dm)"];
      label_y_pos = margin + 500;
      chart_y_pos = margin + 480;
      break;
    case "h2o":
      label_y_pos = margin + 610;
      chart_y_pos = margin + 590;
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

export function WriteH2OBold(doc: jsPDF, x: number, y: number) {
  // Base font size
  doc.setFontSize(12);
  doc.setFont("times", "bold");

  // Write "H"
  doc.text("H", x, y);

  // Write "2" smaller and lower (subscript)
  doc.setFontSize(8);
  doc.setFont("times", "bold");
  doc.text("2", x + 8, y + 2); // adjust x,y offset as needed

  // Back to normal for "O"
  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text("O", x + 12, y);
}

export function WriteH2OItalic(doc: jsPDF, x: number, y: number) {
  // Base font size
  doc.setFontSize(12);
  doc.setFont("times", "italic");

  // Write "H"
  doc.text("H", x, y);

  // Write "2" smaller and lower (subscript)
  doc.setFontSize(8);
  doc.setFont("times", "italic");
  doc.text("2", x + 7, y + 2); // adjust x,y offset as needed

  // Back to normal for "O"
  doc.setFontSize(12);
  doc.setFont("times", "italic");
  doc.text("O (%)", x + 11, y);
}

/**
 * Custom function to render H₂O table header with proper subscript
 */
export function renderH2OTableHeader(doc: jsPDF, x: number, y: number, width: number) {
  // Calculate center position for the header
  const centerX = x + width / 2;
  const centerY = y + 6; // Adjust vertical position
  
  // Write "H"
  doc.setFontSize(10);
  doc.setFont("times", "bolditalic");
  doc.text("H", centerX - 8, centerY);

  // Write "2" smaller and lower (subscript) - make it more subscript-like
  doc.setFontSize(6); // Even smaller
  doc.setFont("times", "bolditalic");
  doc.text("2", centerX - 1, centerY + 3); // Lower position for proper subscript

  // Back to normal for "O"
  doc.setFontSize(10);
  doc.setFont("times", "bolditalic");
  doc.text("O (%)", centerX + 3, centerY);
}

type TableHead = string[][];
type TableBody = RowInput[];

/**
 * Draws two related tables starting page 3:
 * - Measurements: two-column, left then right, then new page
 * - FlatCrush/H2O: goes in the right column if available; else full-width below Measurements
 */
export function DrawMeasurementTables(
  doc: jsPDF,
  marginTopStartPage3: number = 180, // header-safe top margin on pages >= 3
  measurementData: any[],
  company_name: string = "",
  orderNo: string = "",
  current_date: string = "",
  startPage: number = 3 // Page number to start drawing tables
) {
  // ---------- Build table heads & bodies ----------
  const measurementsHead: TableHead = [
    ["Pal Nr", "L (mm)", "Ø in (mm)", "Ø out (mm)", "OK"],
  ];
  const flatCrushH2oHead: TableHead = [["Flat Crush (kN/dm)", "H2O (%)"]];
  const measurementsBody: TableBody = [];
  const flatCrushH2oBody: TableBody = [];

  // Measurements body - sort by pallet count in ascending order, then by number_control
  const sortedMeasurementData = [...measurementData].sort((a, b) => {
    const palA = Number(a["pallete_count"]) || 0;
    const palB = Number(b["pallete_count"]) || 0;
    
    // Primary sort: pallete_count
    if (palA !== palB) {
      return palA - palB;
    }
    
    // Secondary sort: number_control (OFID) within same pallete
    const controlA = Number(a["number_control"]) || 0;
    const controlB = Number(b["number_control"]) || 0;
    return controlA - controlB;
  });

  console.log("DrawMeasurementTables - Processing measurement data:", {
    totalRecords: sortedMeasurementData.length,
    sampleRecord: sortedMeasurementData[0],
    allRecords: sortedMeasurementData
  });

  for (const data of sortedMeasurementData) {
    // Check for pallete_count in multiple possible field names
    const pal = data["pallete_count"] ?? data["palette_count"] ?? data["palleteCount"] ?? data["paletteCount"];
    
    // Convert to number and check if it's a valid value (null, undefined, or NaN should be skipped)
    const palNumber = pal != null ? Number(pal) : null;
    
    if (palNumber === null || isNaN(palNumber)) {
      console.warn("Skipping measurement with invalid pallete_count:", {
        pallete_count: data["pallete_count"],
        palette_count: data["palette_count"],
        palleteCount: data["palleteCount"],
        paletteCount: data["paletteCount"],
        fullData: data,
        allKeys: Object.keys(data)
      });
      continue; // skip invalid pallets
    }
    
    measurementsBody.push([
      palNumber, // Use the numeric value
      data["length"] || "--",
      data["inside_diameter"] || "--",
      data["outside_diameter"] || "--",
      "", // OK column (blank)
    ]);
  }

  console.log("DrawMeasurementTables - Built measurements body:", {
    bodyLength: measurementsBody.length,
    sampleRow: measurementsBody[0]
  });

  // FlatCrush/H2O body (include row if either value exists) - also sorted
  for (const data of sortedMeasurementData) {
    const fc = data["flat_crush"];
    const h2o = data["h20"];
    if (fc || h2o) flatCrushH2oBody.push([fc || "--", h2o || "--"]);
  }

  // ---------- Page & layout constants ----------
  ensurePage(doc, startPage);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Content margins (top avoids your header; bottom avoids footer)
  const contentTop = marginTopStartPage3;
  const contentBottom = 100; // adjust to your footer area if needed

  const sideLeft = 40;
  const sideRight = 40;
  const gap = 10;

  const printableW = pageW - (sideLeft + sideRight);
  const colW = (printableW - gap) / 2;

  // --------- Calculate total rows that can fit on one page (both columns) ---------
  const availableColumnHeight = pageH - contentTop - contentBottom;
  const headH = estimateHeadHeight(doc, 10);
  const rowH = estimateRowHeight(doc, 10);
  const maxRowsPerColumn = Math.max(1, Math.floor((availableColumnHeight - headH) / rowH));
  const totalRowsPerPage = maxRowsPerColumn * 2; // Both columns combined

  // --------- Render MEASUREMENTS as a two-column flow on ONE PAGE ---------
  let currentPage = startPage;
  
  // Ensure the target page exists and is active
  if (currentPage > doc.getNumberOfPages()) doc.addPage();
  doc.setPage(currentPage);

  // Draw headers and footer once for the page
  DrawRightHeader(doc, "AQ 30", startPage, 40);
  DrawMainHeader(doc, company_name, 40, startPage);
  DrawHorizontalLine(doc, 40, 130);
  DrawFooter(doc, 40, orderNo, current_date);

  // Split measurements into left and right columns
  // If total rows exceed one page capacity, take only what fits
  const rowsToRender = measurementsBody.slice(0, totalRowsPerPage);
  const midPoint = Math.ceil(rowsToRender.length / 2);
  const leftColumnRows = rowsToRender.slice(0, midPoint);
  const rightColumnRows = rowsToRender.slice(midPoint);

  // Render left column
  if (leftColumnRows.length > 0) {
    autoTable(doc, {
      head: measurementsHead,
      body: leftColumnRows,
      startY: contentTop,
      tableWidth: colW,
      margin: {
        top: contentTop,
        bottom: contentBottom,
        left: sideLeft,
        right: sideRight,
      },
      theme: "grid",
      rowPageBreak: "avoid",
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

  // Render right column (on same page, starting at same Y position)
  if (rightColumnRows.length > 0) {
    autoTable(doc, {
      head: measurementsHead, // Add headers to right column
      body: rightColumnRows,
      startY: contentTop,
      tableWidth: colW,
      margin: {
        top: contentTop,
        bottom: contentBottom,
        left: sideLeft + colW + gap,
        right: sideRight,
      },
      theme: "grid",
      rowPageBreak: "avoid",
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

  // Nothing else to draw
  if (flatCrushH2oBody.length === 0) return;

  // --------- Render FLAT CRUSH / H2O on a NEW PAGE ---------
  // Always start Flat Crush/H2O on a new page after measurements
  currentPage++;
  if (currentPage > doc.getNumberOfPages()) doc.addPage();
  doc.setPage(currentPage);

  // Right header text
  DrawRightHeader(doc, "AQ 30", startPage, 40);

  // Main header text
  DrawMainHeader(doc, company_name, 40, startPage);

  // Horizontal line below headers
  DrawHorizontalLine(doc, 40, 130);

  // Draw Footer
  DrawFooter(
    doc,
    40, // used to map x position
    orderNo,
    current_date
  );

  autoTable(doc, {
    head: flatCrushH2oHead,
    body: flatCrushH2oBody,
    startY: contentTop,
    tableWidth: printableW,
    margin: {
      top: contentTop,
      bottom: contentBottom,
      left: sideLeft,
      right: sideRight,
    },
    theme: "grid",
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

  // Override the H₂O header with proper subscript
  const at = (doc as any).lastAutoTable;
  if (at && at.table) {
    const table = at.table;
    const headerRow = table.head[0];
    if (headerRow && headerRow[1]) {
      // Get the position of the H₂O column (second column)
      const h2oCell = headerRow[1];
      if (h2oCell && h2oCell.x !== undefined && h2oCell.y !== undefined) {
        // Clear the existing text and draw custom H₂O
        doc.setFillColor(255, 255, 255);
        doc.rect(h2oCell.x, h2oCell.y, h2oCell.width, h2oCell.height, 'F');
        renderH2OTableHeader(doc, h2oCell.x, h2oCell.y, h2oCell.width);
      }
    }
  }
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
