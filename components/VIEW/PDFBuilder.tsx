import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
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

  // // image original size (from canvas)
  // const imgProps = doc.getImageProperties(chartImage);
  // const imgWidth = imgProps.width;
  // const imgHeight = imgProps.height;

  // // maintain aspect ratio
  // const ratio = imgWidth / imgHeight;

  // // scale down while keeping aspect ratio
  // let renderWidth = chart_width;
  // let renderHeight = renderWidth / ratio;

  // if (renderHeight > chart_height) {
  //   renderHeight = chart_height;
  //   renderWidth = renderHeight * ratio;
  // }

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
      WriteH2OBold(doc, label_x_pos, label_y_pos)
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
  doc.text("2", x + 8, y + 2); // adjust x,y offset as needed

  // Back to normal for "O"
  doc.setFontSize(12);
  doc.text("O", x + 11, y);
}

export function WriteH2OItalic(doc: jsPDF, x: number, y: number) {
  // Base font size
  doc.setFontSize(12);

  // Write "H"
  doc.text("H", x, y);

  // Write "2" smaller and lower (subscript)
  doc.setFontSize(8);
  doc.text("2", x + 8, y + 2); // adjust x,y offset as needed

  // Back to normal for "O"
  doc.setFontSize(12);
  doc.text("O", x + 11, y);
}

export function DrawMeasurementTables(
  doc: jsPDF,
  margin: number = 40,
  measurementData: any[]
) {
  const measurementsHead = [
    ["Pal Nr", "L (mm)", "Ø in (mm)", "Ø out (mm)", "OK"],
  ];
  const flatCrushH2oHead = [["Flat Crush (kN / dm)", "H2O (%)"]];
  const measurementsBody: any[][] = [];
  const flatCrushH2oBody: any[][] = [];

  measurementData.map((data: any, index) => {
    let pallete_count = data["pallete_count"];
    let length = data["length"];
    let inside_diameter = data["inside_diameter"];
    let outside_diameter = data["outside_diameter"];
    let ok_value = "";

    // Skip pushing row if pallete_count is missing/0/null
    if (!pallete_count || pallete_count === 0) {
      return;
    }

    if (length === 0 || length === null) {
      length = "";
    }

    if (inside_diameter === 0 || inside_diameter === null) {
      inside_diameter = "";
    }

    if (outside_diameter === 0 || outside_diameter === null) {
      outside_diameter = "";
    }

    measurementsBody.push([
      pallete_count,
      length,
      inside_diameter,
      outside_diameter,
      ok_value,
    ]);
  });

  measurementData.forEach((data: any, index) => {
    const flat_crush = data["flat_crush"];
    const h2o = data["h20"];

    // Only push if both values are nonzero and not null
    if (flat_crush || h2o) {
      flatCrushH2oBody.push([
        flat_crush || "", // fallback to empty string if missing
        h2o || "",
      ]);
    }
  });

  autoTable(doc, {
    margin: margin + 30,
    startY: 180, // where the table starts on the Y axis
    head: measurementsHead, // table headers
    body: measurementsBody, // table rows
    theme: "grid", // can be 'striped', 'grid', or 'plain'
    tableWidth: "wrap",
    pageBreak: "avoid",
    styles: {
      fontSize: 10,
      halign: "center",
      valign: "middle",
      font: "times",
      cellWidth: "wrap",
      lineWidth: 1,
      lineColor: "black",
    },
    headStyles: {
      fontStyle: "bolditalic",
      cellWidth: "wrap",
      halign: "center",
      fillColor: false,
      textColor: "black",
    },
    bodyStyles: {
      fontSize: 10,
      halign: "center",
      valign: "middle",
      font: "times",
      cellWidth: "wrap",
    },
  });

  autoTable(doc, {
    margin: margin * 2 + 250,
    startY: 180, // where the table starts on the Y axis
    head: flatCrushH2oHead, // table headers
    body: flatCrushH2oBody, // table rows
    theme: "grid", // can be 'striped', 'grid', or 'plain'
    tableWidth: "wrap",
    headStyles: {
      fontStyle: "bolditalic",
      halign: "center",
      fillColor: false,
      textColor: "black",
      lineColor: "black",
      lineWidth: 1,
    },
  });
}
