import jsPDF from "jspdf";
import { Chart, ChartConfiguration } from "chart.js";
import { useRef } from "react";
/**
 * Draws a page header with centered text
 */
export function drawRightHeader(
  doc: jsPDF,
  text: string,
  page_number: number = 0,
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
  doc.text(`Indices: ${page_number}`, pageWidth - y, y + 50, {
    align: "right",
  });
}

/**
 * Draws the main header with centered text and client/customer info
 */
export function drawMainHeader(
  doc: jsPDF,
  client: string,
  margin: number = 40, // used to map x position
  page_number: number = 0
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  if (page_number === 1) {
    // Main header text
    doc.setFont("times new roman", "italic");
    doc.setFontSize(12);
    doc.text(
      "Prufkontrol Bericht / Rapport de controle qualite / Quality control report",
      pageWidth / 2,
      margin + 85,
      { align: "center" }
    );

    // Header for client
    doc.setFont("times new roman", "italic");
    doc.setFontSize(10);
    doc.text("Kunde", margin, margin + 110, { align: "left" });
    doc.text(`Client`, margin, margin + 125, {
      align: "left",
    });
    doc.text(`Customer`, margin, margin + 140, { align: "left" });

    doc.setFont("times new roman", "bolditalic");
    doc.setFontSize(23);
    doc.text(`${client}`, pageWidth - margin, margin + 130, { align: "right" });
  } else {
    // Header for client
    doc.setFont("times new roman", "italic");
    doc.setFontSize(10);
    doc.text("Kunde", margin, margin + 85, { align: "left" });
    doc.text(`Client`, margin, margin + 100, {
      align: "left",
    });
    doc.text(`Customer`, margin, margin + 115, { align: "left" });

    doc.setFont("times new roman", "bolditalic");
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
  doc.setFont("times new roman", "bolditalic");
  doc.setFontSize(12);
  doc.text(`${text}`, margin, margin + y, {
    align: "left",
  });
}

export function DrawGraphLabel( // test for nominal first
  doc: jsPDF,
  section: string,
  length: number,
  margin: number = 40, // used to map x position
  chartImage: string // base 64 image data
) {
  let x = 30
  let chart_X = 100
  let y = 200

  switch(section) {
    case "length":
      break;
    case "inside":

  }

  doc.setFont("times new roman", "bold");
  doc.setFontSize(12);
  doc.text("Lange", margin + 30, margin + 200, { align: "left" });
  doc.text("Longueur", margin + 30, margin + 215, { align: "left" });
  doc.text("Length", margin + 30, margin + 230, { align: "left" });
  doc.text("(mm)", margin + 30, margin + 245, { align: "left" });

  // Add the Chart
  if (chartImage) {
    doc.addImage(chartImage, "PNG", margin + 100, margin + 150, 400, 150);
  }
}

export function DrawFooter(
  doc: jsPDF,
  margin: number = 40, // used to map x position
  order_number: String = "",
  date: String = ""
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("times new roman", "bold");
  doc.setFontSize(10);
  doc.text(`${date}`, margin, margin + 740, { align: "left" });
  doc.setFont("times new roman", "bold");

  doc.setFont("times new roman", "bold");
  doc.text(String(order_number), pageWidth / 2 + 5, margin + 740, {
    align: "center",
  });

  doc.text(`cartes de contrôle`, pageWidth - margin, margin + 740, {
    align: "right",
  });
}
