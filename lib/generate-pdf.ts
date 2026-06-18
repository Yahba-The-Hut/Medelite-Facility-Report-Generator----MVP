import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { FacilityData } from "./cms-types";

// ---------------------------------------------------------------------------
// Generate a polished PDF matching the Facility Assessment Snapshot layout
// ---------------------------------------------------------------------------

export function generatePdf(data: FacilityData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15;

  const displayName = data.nameOverride || data.providerName;

  // ---- Header / Branding ----
  doc.setFillColor(250, 204, 21); // gold banner
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(26, 26, 62); // navy
  doc.text("INFINITE", pageWidth / 2, 10, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Managed by MEDELITE", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("FACILITY ASSESSMENT SNAPSHOT", pageWidth / 2, 23, {
    align: "center",
  });

  // State abbreviation
  doc.setFontSize(11);
  doc.text(data.state || "—", pageWidth / 2, 27, { align: "center" });

  y = 34;

  // ---- Data table ----
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

  // Append claims metrics if present
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

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [],
    body: rows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { cellWidth: "auto" },
    },
  });

  // ---- Medicare source link ----
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const careCompareUrl = `https://www.medicare.gov/care-compare/details/nursing-home/${data.ccn}`;

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 200);
  doc.textWithLink("View on Medicare Care Compare", margin, finalY, {
    url: careCompareUrl,
  });

  // ---- Save ----
  const filename = `${displayName.replace(/[^a-zA-Z0-9]/g, "_")}_Assessment.pdf`;
  doc.save(filename);
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
