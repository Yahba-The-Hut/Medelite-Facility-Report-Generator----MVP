// --------------------------------------------------------------------------
// Types for the facility data used throughout the app
// --------------------------------------------------------------------------

export interface FacilityData {
  // CMS-sourced fields
  ccn: string;
  providerName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  certifiedBeds: number | null;
  averageResidents: number | null;
  overallRating: number | null;
  healthInspectionRating: number | null;
  staffingRating: number | null;
  qmRating: number | null;

  // Manual-input fields (filled by user in the form)
  nameOverride: string;
  emr: string;
  currentCensus: string;
  patientType: string;
  previousCoverage: string;
  previousPerformance: string;
  medicalCoverage: string;

  // Bonus: Claims-based hospitalization/ED metrics
  claims: ClaimsMetrics | null;
}

export interface ClaimsMetrics {
  // Short-term (Short-Stay)
  strHospitalization: string | null;
  strNatlAvgHosp: string | null;
  strStateAvgHosp: string | null;
  strEdVisit: string | null;
  strNatlAvgEd: string | null;
  strStateAvgEd: string | null;
  // Long-term (Long-Stay)
  ltHospitalization: string | null;
  ltNatlAvgHosp: string | null;
  ltStateAvgHosp: string | null;
  ltEdVisit: string | null;
  ltNatlAvgEd: string | null;
  ltStateAvgEd: string | null;
}

// --------------------------------------------------------------------------
// CMS Provider Data Catalog API endpoints
// --------------------------------------------------------------------------

// Provider Info dataset (star ratings, beds, address, etc.)
// Dataset identifier: 4pq5-n9py
export const CMS_PROVIDER_API =
  "https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0";

// Medicare Claims Quality Measures dataset (hospitalization/ED metrics)
// Dataset identifier: ijh5-nb2v
export const CMS_CLAIMS_API =
  "https://data.cms.gov/provider-data/api/1/datastore/query/ijh5-nb2v/0";

// State & US Averages dataset (for national/state avg benchmarks)
// Dataset identifier: xcdc-v8bm
export const CMS_AVERAGES_API =
  "https://data.cms.gov/provider-data/api/1/datastore/query/xcdc-v8bm/0";

// --------------------------------------------------------------------------
// Mapping from CMS claims measure_description to our report labels
// --------------------------------------------------------------------------
// The CMS "Measure Description" column uses verbose text.
// "Short-Stay" in CMS → "STR" in our report
// "Long-Stay" in CMS → "LT" in our report

export const CLAIMS_MEASURE_MAP: Record<
  string,
  { key: keyof ClaimsMetrics; label: string }
> = {
  // Short-Stay (STR)
  "Percentage of short-stay residents who were rehospitalized after a nursing home admission":
    { key: "strHospitalization", label: "Short Term Hospitalization" },
  "Percentage of short-stay residents who had an outpatient emergency department visit":
    { key: "strEdVisit", label: "STR ED Visit" },

  // Long-Stay (LT)
  "Number of hospitalizations per 1000 long-stay resident days":
    { key: "ltHospitalization", label: "LT Hospitalization" },
  "Number of outpatient emergency department visits per 1000 long-stay resident days":
    { key: "ltEdVisit", label: "ED Visit" },
};

// State/US Averages mapping — same measure descriptions appear in the averages dataset
export const AVERAGES_MEASURE_MAP: Record<string, { natlKey: keyof ClaimsMetrics; stateKey: keyof ClaimsMetrics }> = {
  "Percentage of short-stay residents who were rehospitalized after a nursing home admission":
    { natlKey: "strNatlAvgHosp", stateKey: "strStateAvgHosp" },
  "Percentage of short-stay residents who had an outpatient emergency department visit":
    { natlKey: "strNatlAvgEd", stateKey: "strStateAvgEd" },
  "Number of hospitalizations per 1000 long-stay resident days":
    { natlKey: "ltNatlAvgHosp", stateKey: "ltStateAvgHosp" },
  "Number of outpatient emergency department visits per 1000 long-stay resident days":
    { natlKey: "ltNatlAvgEd", stateKey: "ltStateAvgEd" },
};
