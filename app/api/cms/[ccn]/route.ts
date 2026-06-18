import { NextRequest, NextResponse } from "next/server";
import {
  CMS_PROVIDER_API,
  CMS_CLAIMS_API,
  CMS_AVERAGES_API,
  CLAIMS_MEASURE_MAP,
  type ClaimsMetrics,
} from "@/lib/cms-types";

// ---------------------------------------------------------------------------
// GET /api/cms/[ccn]  →  fetch provider info + claims metrics from CMS
// ---------------------------------------------------------------------------

const CMS_TIMEOUT_MS = 15000;

export async function GET(
  _req: NextRequest,
  { params }: { params: { ccn: string } }
) {
  const ccn = params.ccn?.trim();

  // ---- Validation ----
  if (!ccn || ccn.length !== 6) {
    return NextResponse.json(
      { error: "Invalid CCN. Must be exactly 6 characters." },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9]{6}$/.test(ccn)) {
    return NextResponse.json(
      { error: "Invalid CCN format. Only letters and numbers are allowed." },
      { status: 400 }
    );
  }

  try {
    // ---- 1. Provider Info (star ratings, beds, address) ----
    const providerRes = await fetchWithTimeout(CMS_PROVIDER_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conditions: [
          {
            resource: "t",
            property: "cms_certification_number_ccn",
            value: ccn,
            operator: "=",
          },
        ],
        limit: 1,
      }),
    });

    if (!providerRes.ok) {
      return NextResponse.json(
        { error: `CMS API is temporarily unavailable (status ${providerRes.status}). Please try again later.` },
        { status: 502 }
      );
    }

    const providerJson = await providerRes.json();
    const results = providerJson?.results;

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: `No facility found for CCN "${ccn}". Please verify the number and try again.` },
        { status: 404 }
      );
    }

    const p = results[0];

    const provider = {
      ccn,
      providerName: p.provider_name ?? "",
      address: [p.provider_address, p.citytown, p.state, p.zip_code]
        .filter(Boolean)
        .join(", "),
      city: p.citytown ?? "",
      state: p.state ?? "",
      zip: p.zip_code ?? "",
      phone: p.telephone_number ?? "",
      certifiedBeds: toNum(p.number_of_certified_beds),
      averageResidents: toNum(p.average_number_of_residents_per_day),
      overallRating: toNum(p.overall_rating),
      healthInspectionRating: toNum(p.health_inspection_rating),
      staffingRating: toNum(p.staffing_rating),
      qmRating: toNum(p.qm_rating),
    };

    // ---- 2. Claims-based quality measures (hospitalization/ED metrics) ----
    let claims: ClaimsMetrics | null = null;

    try {
      const claimsRes = await fetchWithTimeout(CMS_CLAIMS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditions: [
            {
              resource: "t",
              property: "cms_certification_number_ccn",
              value: ccn,
              operator: "=",
            },
          ],
          limit: 50,
        }),
      });

      if (claimsRes.ok) {
        const claimsJson = await claimsRes.json();
        const rows: any[] = claimsJson?.results ?? [];

        claims = {
          strHospitalization: null,
          strNatlAvgHosp: null,
          strStateAvgHosp: null,
          strEdVisit: null,
          strNatlAvgEd: null,
          strStateAvgEd: null,
          ltHospitalization: null,
          ltNatlAvgHosp: null,
          ltStateAvgHosp: null,
          ltEdVisit: null,
          ltNatlAvgEd: null,
          ltStateAvgEd: null,
        };

        for (const row of rows) {
          const desc = row.measure_description ?? "";
          const mapping = CLAIMS_MEASURE_MAP[desc];
          if (mapping) {
            const val = row.adjusted_score ?? null;
            const isRate = mapping.key.startsWith("lt");
            claims[mapping.key] = isRate ? roundRate(val) : roundPct(val);
          }
        }

        // ---- 3. Fetch state + national averages ----
        const facilityState = provider.state;
        if (facilityState) {
          try {
            const avgRes = await fetchWithTimeout(CMS_AVERAGES_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conditions: [
                  {
                    resource: "t",
                    property: "state_or_nation",
                    value: facilityState,
                    operator: "=",
                  },
                ],
                limit: 1,
              }),
            });

            if (avgRes.ok) {
              const avgJson = await avgRes.json();
              const stateRow = avgJson?.results?.[0];
              if (stateRow) {
                claims.strStateAvgHosp =
                  roundPct(stateRow["percentage_of_short_stay_residents_who_were_rehospitalized__1d02"] ?? null);
                claims.strStateAvgEd =
                  roundPct(stateRow["percentage_of_short_stay_residents_who_had_an_outpatient_em_d911"] ?? null);
                claims.ltStateAvgHosp =
                  roundRate(stateRow["number_of_hospitalizations_per_1000_longstay_resident_days"] ?? null);
                claims.ltStateAvgEd =
                  roundRate(stateRow["number_of_outpatient_emergency_department_visits_per_1000_l_de9d"] ?? null);
              }
            }
          } catch (avgErr) {
            console.warn("State averages fetch failed (non-fatal):", avgErr);
          }

          try {
            const natlRes = await fetchWithTimeout(CMS_AVERAGES_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conditions: [
                  {
                    resource: "t",
                    property: "state_or_nation",
                    value: "NATION",
                    operator: "=",
                  },
                ],
                limit: 1,
              }),
            });

            if (natlRes.ok) {
              const natlJson = await natlRes.json();
              const natlRow = natlJson?.results?.[0];
              if (natlRow) {
                claims.strNatlAvgHosp =
                  roundPct(natlRow["percentage_of_short_stay_residents_who_were_rehospitalized__1d02"] ?? null);
                claims.strNatlAvgEd =
                  roundPct(natlRow["percentage_of_short_stay_residents_who_had_an_outpatient_em_d911"] ?? null);
                claims.ltNatlAvgHosp =
                  roundRate(natlRow["number_of_hospitalizations_per_1000_longstay_resident_days"] ?? null);
                claims.ltNatlAvgEd =
                  roundRate(natlRow["number_of_outpatient_emergency_department_visits_per_1000_l_de9d"] ?? null);
              }
            }
          } catch (natlErr) {
            console.warn("National averages fetch failed (non-fatal):", natlErr);
          }
        }
      }
    } catch (claimsErr) {
      console.warn("Claims fetch failed (non-fatal):", claimsErr);
    }

    return NextResponse.json({ ...provider, claims });
  } catch (err: any) {
    console.error("CMS API error:", err);

    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "CMS API request timed out. The government servers may be slow. Please try again." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while fetching facility data." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CMS_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function toNum(val: any): number | null {
  if (val == null || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function roundPct(val: string | null): string | null {
  if (val == null) return null;
  const n = parseFloat(val);
  return isNaN(n) ? val : n.toFixed(1);
}

function roundRate(val: string | null): string | null {
  if (val == null) return null;
  const n = parseFloat(val);
  return isNaN(n) ? val : n.toFixed(2);
}
