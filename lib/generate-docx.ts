import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  ExternalHyperlink,
} from "docx";
import { saveAs } from "file-saver";
import type { FacilityData } from "./cms-types";

// ---------------------------------------------------------------------------
// Generate a DOCX matching the Facility Assessment Snapshot layout
// ---------------------------------------------------------------------------

export async function generateDocx(data: FacilityData) {
  const displayName = data.nameOverride || data.providerName;
  const tableWidth = 9360; // US Letter content width (8.5" - 2x1" margins) in DXA
  const col1Width = 4200;
  const col2Width = tableWidth - col1Width;

  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const cellMargins = { top: 60, bottom: 60, left: 120, right: 120 };

  // ---- Build report rows ----
  const rows: [string, string][] = [
    ["Name of Facility", displayName],
    ["Location", data.address],
    ["EMR", data.emr || "—"],
    ["Census Capacity", data.certifiedBeds?.toString() ?? "—"],
    ["Current Census", data.currentCensus || "—"],
    ["Type of Patient", data.patientType || "—"],
    ["Previous Coverage from Medelite", data.previousCoverage || "—"],
    [
      "Previous Provider Performance from Medelite",
      data.previousPerformance || "—",
    ],
    ["Medical Coverage", data.medicalCoverage || "—"],
    ["Overall Star Rating", starStr(data.overallRating)],
    ["Health Inspection", starStr(data.healthInspectionRating)],
    ["Staffing", starStr(data.staffingRating)],
    ["Quality of Resident Care", starStr(data.qmRating)],
  ];

  if (data.claims) {
    const c = data.claims;
    rows.push(
      ["Short Term Hospitalization", fmtPct(c.strHospitalization)],
      ["STR National Avg. for Hospitalization", fmtPct(c.strNatlAvgHosp)],
      [
        "STR State National Avg. for Hospitalization",
        fmtPct(c.strStateAvgHosp),
      ],
      ["STR ED Visit", fmtPct(c.strEdVisit)],
      ["STR ED Visits National Avg.", fmtPct(c.strNatlAvgEd)],
      ["STR ED Visits State Avg.", fmtPct(c.strStateAvgEd)],
      ["LT Hospitalization", fmtVal(c.ltHospitalization)],
      ["LT National Avg. for Hospitalization", fmtVal(c.ltNatlAvgHosp)],
      [
        "LT State National Avg. for Hospitalization",
        fmtVal(c.ltStateAvgHosp),
      ],
      ["ED Visit", fmtVal(c.ltEdVisit)],
      ["LT ED Visits National Avg.", fmtVal(c.ltNatlAvgEd)],
      ["LT ED Visits State Avg.", fmtVal(c.ltStateAvgEd)]
    );
  }

  // ---- Build table rows ----
  const tableRows = rows.map(
    ([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            borders,
            margins: cellMargins,
            width: { size: col1Width, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: label, bold: true, font: "Arial", size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders,
            margins: cellMargins,
            width: { size: col2Width, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: value, font: "Arial", size: 20 }),
                ],
              }),
            ],
          }),
        ],
      })
  );

  // ---- Assemble document ----
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 24 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          // ---- Header branding ----
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            shading: { fill: "FACC15", type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: "INFINITE",
                bold: true,
                font: "Arial",
                size: 36,
                color: "1A1A3E",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            shading: { fill: "FACC15", type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: "Managed by MEDELITE",
                font: "Arial",
                size: 18,
                color: "1A1A3E",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            shading: { fill: "FACC15", type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: "FACILITY ASSESSMENT SNAPSHOT",
                bold: true,
                font: "Arial",
                size: 26,
                color: "1A1A3E",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            shading: { fill: "FACC15", type: ShadingType.CLEAR },
            children: [
              new TextRun({
                text: data.state || "—",
                bold: true,
                font: "Arial",
                size: 22,
                color: "1A1A3E",
              }),
            ],
          }),

          // Spacer
          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // ---- Data table ----
          new Table({
            width: { size: tableWidth, type: WidthType.DXA },
            columnWidths: [col1Width, col2Width],
            rows: tableRows,
          }),

          // Spacer
          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // ---- Medicare link ----
          new Paragraph({
            children: [
              new ExternalHyperlink({
                link: `https://www.medicare.gov/care-compare/details/nursing-home/${data.ccn}`,
                children: [
                  new TextRun({
                    text: "View on Medicare Care Compare",
                    font: "Arial",
                    size: 16,
                    color: "0000C8",
                    underline: {},
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  // ---- Export ----
  const blob = await Packer.toBlob(doc);
  const filename = `${displayName.replace(/[^a-zA-Z0-9]/g, "_")}_Assessment.docx`;
  saveAs(blob, filename);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function starStr(val: number | null): string {
  return val != null ? val.toString() : "—";
}

function fmtPct(val: string | null): string {
  if (val == null) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return `${n}%`;
}

function fmtVal(val: string | null): string {
  if (val == null) return "—";
  return val;
}
