# Medelite Facility Report Generator

A web application that fetches skilled nursing facility data from the CMS Provider Data Catalog API, combines it with manual operational inputs, and exports polished PDF and DOCX reports.

**Live App:** [ymedelite-facility-report-generator-mfqr1bmyd-abhay-kb-anda.vercel.app](medelite-facility-report-generator-mfqr1bmyd-abhay-kb-anda.vercel.app)

---

## Features

### Core (MVP)

- **Dynamic CCN Lookup** — Enter any valid 6-character CMS Certification Number to fetch facility data in real time
- **CMS Data Engine** — Pulls provider info (star ratings, certified beds, address) from the public CMS Provider Data Catalog API
- **Facility Name Override** — Optional text field to replace the official CMS legal name with a custom internal name
- **Manual Operational Inputs** — Fields for EMR, Current Census, Patient Type, Medelite History, and Medical Coverage
- **PDF Export** — One-click download of a clean, print-ready PDF matching the Facility Assessment Snapshot layout
- **Medicare Source Link** — Generated reports include a clickable hyperlink to the facility's official Medicare Care Compare profile
- **Branded Header** — "INFINITE — Managed by MEDELITE" branding with dynamic state abbreviation

### Bonus

- **All 12 Hospitalization/ED Metrics** — Full suite of short-stay (STR) and long-stay (LT) hospitalization and ED visit rates with state and national averages, pulled from the CMS claims-based quality measures dataset
- **DOCX Export** — Download as an editable Word document in addition to PDF
- **Advanced Error Handling** — Client-side CCN validation, API timeout protection (15s), descriptive error messages for invalid CCNs, missing facilities, CMS downtime, and network failures

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| PDF Generation | jsPDF + jspdf-autotable |
| DOCX Generation | docx (docx-js) |
| Deployment | Vercel |

---

## Getting Started

```bash
git clone https://github.com/Yahba-The-Hut/Medelite-Facility-Report-Generator----MVP.git
cd medelite-facility-report
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter CCN `686123` to test with the Kendall Lakes reference facility.

---

## Project Structure

```
app/
├── layout.tsx                  # Root layout + metadata
├── page.tsx                    # Main page — CCN form, data preview, manual inputs, exports
├── globals.css                 # Tailwind directives
└── api/cms/[ccn]/
    └── route.ts                # Server-side CMS API proxy (avoids CORS)
lib/
├── cms-types.ts                # TypeScript types, CMS endpoint URLs, field mappings
├── generate-pdf.ts             # PDF report generation
└── generate-docx.ts            # DOCX report generation
```

---

## Architecture

### CMS API Proxy

The CMS Provider Data Catalog API is called server-side through a Next.js API route (`/api/cms/[ccn]`) to avoid CORS restrictions. Three CMS datasets are queried per request:

| Dataset | Endpoint ID | Purpose |
|---------|-------------|---------|
| Provider Info | `4pq5-n9py` | Star ratings, certified beds, address, phone |
| Claims Quality Measures | `ijh5-nb2v` | Facility-level hospitalization/ED metrics |
| State & US Averages | `xcdc-v8bm` | National and state benchmark averages |

### Data Flow

```
User enters CCN
  -> Client-side validation (format, length)
  -> GET /api/cms/[ccn]
    -> CMS Provider Info API (star ratings, beds, address)
    -> CMS Claims API (hospitalization/ED metrics)
    -> CMS Averages API (state + national benchmarks)
  -> UI populates CMS fields + manual input form
  -> User fills manual fields
  -> Download PDF or DOCX (generated client-side)
```

### Error Handling

| Scenario | Response |
|----------|----------|
| Empty or short CCN | Client-side validation before fetch |
| Non-alphanumeric characters | Client-side + server-side validation |
| CCN not found in CMS | 404 with descriptive message |
| CMS API down | 502 with retry suggestion |
| CMS API timeout (>15s) | 504 with timeout message |
| Claims data unavailable | Graceful fallback — provider data still displays |
| Network failure | Client-side catch with connection error message |

### CMS Field Mapping

The CMS API uses truncated snake_case column names with hash suffixes for long field names. Key mappings:

| Report Label | CMS API Column |
|-------------|---------------|
| Short Term Hospitalization | `adjusted_score` where `measure_code = 521` |
| STR State Avg Hospitalization | `percentage_of_short_stay_residents_who_were_rehospitalized__1d02` |
| LT Hospitalization | `adjusted_score` where `measure_code = 551` |
| LT State Avg ED | `number_of_outpatient_emergency_department_visits_per_1000_l_de9d` |

Short-stay (STR) metrics are percentages rounded to 1 decimal place. Long-stay (LT) metrics are rates per 1,000 resident days rounded to 2 decimal places.

---

## Test Cases

| CCN | Facility | Expected Result |
|-----|----------|----------------|
| `686123` | Kendall Lakes Healthcare and Rehab Center (FL) | Full data + all 12 claims metrics |
| `105447` | Referenced in case study | Full data |
| `999999` | Invalid | "No facility found" error |
| `abc` | Too short | Client-side validation error |

---

## Assumptions

1. CMS dataset identifiers (`4pq5-n9py`, `ijh5-nb2v`, `xcdc-v8bm`) are stable across monthly refreshes. If any return 404, check [data.cms.gov](https://data.cms.gov/provider-data/) for updated IDs.
2. Claims metrics use the `adjusted_score` field as the primary value.
3. The CMS "Short-Stay" resident type maps to the report's "STR" prefix; "Long-Stay" maps to "LT".
4. Data values may differ from the reference PDF since CMS updates data monthly — the reference represents a point-in-time snapshot.

---

## License

Built as a technical assessment for Medelite.
