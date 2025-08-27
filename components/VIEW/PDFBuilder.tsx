import jsPDF from "jspdf";

/**
 * Draws a page header with centered text
 */
export function drawRightHeader(
  doc: jsPDF,
  text: string,
  y: number = 40 // margin from top
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Right header text
  doc.setFont("times new roman", "bolditalic");
  doc.setFontSize(15);
  doc.text(text, pageWidth - y, y + 30, {
    align: "right",
  });

  // Indices text below right header
  doc.setFont("times new roman", "italic");
  doc.setFontSize(15);
  doc.text("Indices: 0", pageWidth - y, y + 50, {
    align: "right",
  });
}

/**
 * Draws the main header with centered text and client/customer info
 */
export function drawMainHeader(
  doc: jsPDF,
  client: string,
  customer: string,
  margin: number = 40 // used to map x position
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Main header text
  doc.setFont("times new roman", "italic");
  doc.setFontSize(12);
  doc.text(
    "Prufkontrol Bericht / Rapport de controle qualite / Quality control report",
    pageWidth / 2,
    margin + 85,
    { align: "center" }
  );

  // Header for client ]
  doc.setFont("times new roman", "italic");
  doc.setFontSize(10);
  doc.text("Kunde:", margin, margin + 110, { align: "left" });
  doc.text(`Client: ${client}`, margin, margin + 125, {
    align: "left",
  });
  doc.text(`Customer: ${customer}`, margin, margin + 140, { align: "left" });
}

/**
 * Draws a horizontal line below the headers
 */
export function drawHorizontalLine(
  doc: jsPDF, 
  margin: number, 
  y: number
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
export function drawLeftHeader(
  doc: jsPDF,
  text: string,
  margin: number = 40, // used to map x position
  y: number // margin from top
) {
  //Header title: Order
  doc.setFont("times new roman", "bolditalic");
  doc.setFontSize(12);
  doc.text(`${text}`, margin, margin + y, {
    align: "left",
  });
}
