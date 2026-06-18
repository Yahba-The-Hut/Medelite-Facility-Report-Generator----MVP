# Medelite Facility Assessment Report Generator

A lightweight web app that fetches nursing home data from the CMS Provider Data Catalog API, combines it with manual operational inputs, and exports a polished PDF report.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — enter CCN `686123` to test with the Kendall Lakes reference facility.

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Main page — CCN form, data preview, manual inputs
│   ├── globals.css             # Tailwind directives
│   └── api/cms/[ccn]/
│       └── route.ts            # Server-side CMS API proxy (avoids CORS)
├── lib/
│   ├── cms-types.ts            # TypeScript types + CMS endpoint URLs + field mappings
│   └── generate-pdf.ts         # jsPDF report generation
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Architecture Decisions

- **Next.js API route as proxy**: CMS APIs are called server-side to avoid CORS issues in the browser.
- **jsPDF + autoTable**: Client-side PDF generation with no server dependency. Keeps it simple.
- **CMS Provider Data Catalog API**: Uses POST-based query endpoints with JSON filter conditions.

## CMS API Endpoints Used

| Dataset | Endpoint ID | Purpose |
|---------|-------------|---------|
| Provider Info | `4pq5-n9py` | Star ratings, beds, address, phone |
| Claims Quality Measures | `ijh5-nb2v` | Hospitalization/ED metrics per facility |
| State & US Averages | `xcdc-v8bm` | National/state benchmark averages |

## Assumptions

1. CMS API dataset identifiers are stable (they occasionally rotate on monthly refreshes — if the API returns 404, check [data.cms.gov](https://data.cms.gov/provider-data/) for updated dataset IDs).
2. Claims-based metrics use `four_quarter_average_score` as the primary value field.
3. Column names in the CMS API use snake_case versions of the Data Dictionary headers.

## TODO

- [ ] Verify exact CMS API column names against a live response for CCN 686123
- [ ] Add DOCX export (bonus feature — `docx` package is already in deps)
- [ ] Add chart/card visualizations for star ratings (bonus)
- [ ] Add comprehensive error boundaries for invalid CCNs / missing fields
- [ ] Deploy to Hetzner / Vercel
