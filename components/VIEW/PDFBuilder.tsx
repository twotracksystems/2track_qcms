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
  let label_x_pos = margin + 20;
  let label_y_pos = 0;
  let chart_x_pos = margin + 100;
  let chart_y_pos = 0;

  let chart_width = 410;
  let chart_height = 105;

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

  label.map((label, index) => {
    // Loop through the different labels
    doc.text(label, label_x_pos, label_y_pos, { align: "left" });
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
  order_number: String = "",
  date: String = ""
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

  // Write "H"
  doc.text("H", x, y);

  // Write "2" smaller and lower (subscript)
  doc.setFontSize(8);
  doc.text("2", x + 9, y + 2); // adjust x,y offset as needed

  // Back to normal for "O"
  doc.setFontSize(12);
  doc.text("O", x + 13, y);
}

export function WriteH2OItalic(doc: jsPDF, x: number, y: number) {
  // Base font size
  doc.setFontSize(12);

  // Write "H"
  doc.text("H", x, y);

  // Write "2" smaller and lower (subscript)
  doc.setFontSize(8);
  doc.text("2", x + 7, y + 2); // adjust x,y offset as needed

  // Back to normal for "O"
  doc.setFontSize(12);
  doc.text("O (%)", x + 11, y);
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
  current_date: string = ""
) {
  // ---------- Build table heads & bodies ----------
  const measurementsHead: TableHead = [
    ["Pal Nr", "L (mm)", "Ø in (mm)", "Ø out (mm)", "OK"],
  ];
  const flatCrushH2oHead: TableHead = [["Flat Crush (kN/dm)", "H₂O (%)"]];
  const measurementsBody: TableBody = [];
  const flatCrushH2oBody: TableBody = [];

  // Measurements body
  for (const data of measurementData) {
    const pal = data["pallete_count"];
    if (!pal) continue; // skip empty pallets
    measurementsBody.push([
      pal,
      data["length"] || "",
      data["inside_diameter"] || "",
      data["outside_diameter"] || "",
      "", // OK column (blank)
    ]);
  }

  // FlatCrush/H2O body (include row if either value exists)
  for (const data of measurementData) {
    const fc = data["flat_crush"];
    const h2o = data["h20"];
    if (fc || h2o) flatCrushH2oBody.push([fc || "", h2o || ""]);
  }

  // ---------- Page & layout constants ----------
  ensurePage(doc, 3);
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

  // --------- Estimate rows per column and chunk MEASUREMENTS ---------
  const rowsPerColumn = estimateRowsPerColumn(
    doc,
    pageH,
    { top: contentTop, bottom: contentBottom },
    measurementsHead,
    10 // font size used in styles
  );
  const measurementChunks = chunkRows(measurementsBody, rowsPerColumn);

  // --------- Render MEASUREMENTS as a two-column flow ---------
  let currentPage = 3;
  let onLeftColumn = true; // left → right → next page
  let lastFinalY = contentTop;

  for (let i = 0; i < measurementChunks.length; i++) {
    const colLeft = onLeftColumn ? sideLeft : sideLeft + colW + gap;

    // Ensure the target page exists and is active
    if (currentPage > doc.internal.getNumberOfPages()) doc.addPage();
    doc.setPage(currentPage);

    // Right header text
    DrawRightHeader(doc, "AQ 30", 3, 40);

    // Main header text
    DrawMainHeader(doc, company_name, 40, 3);

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
      head: i === 0 ? measurementsHead : [], // show head only on first chunk
      body: measurementChunks[i],
      startY: contentTop, // always start at top of content area for column chunks
      tableWidth: colW,
      margin: {
        top: contentTop,
        bottom: contentBottom,
        left: colLeft,
        right: sideRight,
      },
      theme: "grid",
      rowPageBreak: "auto",
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

    const at = (doc as any).lastAutoTable;
    lastFinalY = at.finalY;

    // Move to the next column, or next page
    if (onLeftColumn) {
      onLeftColumn = false; // next is right column, same page
    } else {
      onLeftColumn = true; // back to left column, next page
      currentPage++;
    }
  }

  // Nothing else to draw
  if (flatCrushH2oBody.length === 0) return;

  // --------- Render FLAT CRUSH / H2O based on remaining space ---------
  if (onLeftColumn === false) {
    // We ended the last Measurements chunk in the LEFT column,
    // so the RIGHT column on the current page is still free.
    const colLeft = sideLeft + colW + gap;

    if (currentPage > doc.internal.getNumberOfPages()) doc.addPage();
    doc.setPage(currentPage);

    // Right header text
    DrawRightHeader(doc, "AQ 30", 3, 40);

    // Main header text
    DrawMainHeader(doc, company_name, 40, 3);

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
      startY: contentTop, // top of the content area
      tableWidth: colW,
      margin: {
        top: contentTop,
        bottom: contentBottom,
        left: colLeft,
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
  } else {
    // Either we ended in the RIGHT column (so both columns used),
    // or exactly consumed the page. Place FlatCrush/H2O FULL-WIDTH
    // directly below Measurements if there's room; else go to next page.
    const neededTop = Math.max(lastFinalY + 8, contentTop);
    const minRow = estimateRowHeight(doc, 10);
    const headH = estimateHeadHeight(doc, 10);
    const remaining = pageH - contentBottom - neededTop;

    if (remaining < headH + minRow) {
      // Not enough space; add a new page and start at contentTop

      currentPage++;
      if (currentPage > doc.internal.getNumberOfPages()) doc.addPage();
      doc.setPage(currentPage);

      // Right header text
      DrawRightHeader(doc, "AQ 30", 3, 40);

      // Main header text
      DrawMainHeader(doc, company_name, 40, 3);

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
    } else {
      // Same page, full-width directly below the Measurements table
      if (currentPage > doc.internal.getNumberOfPages()) doc.addPage();
      doc.setPage(currentPage);

      // Right header text
      DrawRightHeader(doc, "AQ 30", 3, 40);

      // Main header text
      DrawMainHeader(doc, company_name, 40, 3);

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
        startY: neededTop,
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
    }
  }
}

/* ---------- Helpers ---------- */

/** Ensure at least N pages exist; set current page to N. */
function ensurePage(doc: jsPDF, pageNumber: number) {
  const have = doc.internal.getNumberOfPages();
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
