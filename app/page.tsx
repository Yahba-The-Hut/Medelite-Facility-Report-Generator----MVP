"use client";

import { useState } from "react";
import type { FacilityData } from "@/lib/cms-types";
import { generatePdf } from "@/lib/generate-pdf";
import { generateDocx } from "@/lib/generate-docx";

export default function Home() {
  const [ccn, setCcn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facility, setFacility] = useState<FacilityData | null>(null);

  const [nameOverride, setNameOverride] = useState("");
  const [emr, setEmr] = useState("");
  const [currentCensus, setCurrentCensus] = useState("");
  const [patientType, setPatientType] = useState("");
  const [previousCoverage, setPreviousCoverage] = useState("No");
  const [previousPerformance, setPreviousPerformance] = useState("");
  const [medicalCoverage, setMedicalCoverage] = useState("");

  function buildData(): FacilityData {
    return {
      ...facility!,
      nameOverride,
      emr,
      currentCensus,
      patientType,
      previousCoverage,
      previousPerformance,
      medicalCoverage,
    };
  }

  async function handleLookup() {
    if (!ccn.trim()) return;
    setLoading(true);
    setError(null);
    setFacility(null);

    try {
      const res = await fetch(`/api/cms/${ccn.trim()}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Lookup failed");
        return;
      }

      setFacility(json as FacilityData);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPdf() {
    if (!facility) return;
    generatePdf(buildData());
  }

  async function handleDownloadDocx() {
    if (!facility) return;
    await generateDocx(buildData());
  }

  return (
    <main className="min-h-screen py-8 px-4 max-w-3xl mx-auto">
      <div className="bg-yellow-400 rounded-lg p-5 text-center mb-8">
        <h1 className="text-2xl font-bold tracking-wide text-[#1a1a3e]">
          INFINITE
        </h1>
        <p className="text-xs text-[#1a1a3e]/70 tracking-widest">
          Managed by MEDELITE
        </p>
        <h2 className="text-lg font-semibold mt-2 text-[#1a1a3e]">
          FACILITY ASSESSMENT SNAPSHOT
        </h2>
      </div>

      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CMS Certification Number (CCN)
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            maxLength={6}
            value={ccn}
            onChange={(e) => setCcn(e.target.value)}
            placeholder="e.g. 686123"
            className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
          />
          <button
            onClick={handleLookup}
            disabled={loading || !ccn.trim()}
            className="bg-[#1a1a3e] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#2a2a5e] disabled:opacity-50 transition"
          >
            {loading ? "Looking up\u2026" : "Fetch"}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </section>

      {facility && (
        <>
          <section className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              {"CMS Data \u2014 " + facility.providerName}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Detail label="Address" value={facility.address} />
              <Detail label="State" value={facility.state} />
              <Detail label="Certified Beds" value={facility.certifiedBeds?.toString()} />
              <Detail label="Avg Residents/Day" value={facility.averageResidents?.toString()} />
              <Detail label="Overall Rating" value={facility.overallRating?.toString()} />
              <Detail label="Health Inspection" value={facility.healthInspectionRating?.toString()} />
              <Detail label="Staffing" value={facility.staffingRating?.toString()} />
              <Detail label="Quality of Care" value={facility.qmRating?.toString()} />
            </div>

            {facility.claims && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Claims-Based Metrics
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <Detail label="STR Hospitalization" value={facility.claims.strHospitalization} />
                  <Detail label="STR Natl Avg Hosp" value={facility.claims.strNatlAvgHosp} />
                  <Detail label="STR State Avg Hosp" value={facility.claims.strStateAvgHosp} />
                  <Detail label="STR ED Visit" value={facility.claims.strEdVisit} />
                  <Detail label="STR Natl Avg ED" value={facility.claims.strNatlAvgEd} />
                  <Detail label="STR State Avg ED" value={facility.claims.strStateAvgEd} />
                  <Detail label="LT Hospitalization" value={facility.claims.ltHospitalization} />
                  <Detail label="LT Natl Avg Hosp" value={facility.claims.ltNatlAvgHosp} />
                  <Detail label="LT State Avg Hosp" value={facility.claims.ltStateAvgHosp} />
                  <Detail label="LT ED Visit" value={facility.claims.ltEdVisit} />
                  <Detail label="LT Natl Avg ED" value={facility.claims.ltNatlAvgEd} />
                  <Detail label="LT State Avg ED" value={facility.claims.ltStateAvgEd} />
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              Manual / Override Fields
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Facility Name Override"
                value={nameOverride}
                onChange={setNameOverride}
                placeholder={facility.providerName}
              />
              <Field
                label="EMR"
                value={emr}
                onChange={setEmr}
                placeholder="e.g. PCC, MatrixCare"
              />
              <Field
                label="Current Census"
                value={currentCensus}
                onChange={setCurrentCensus}
                placeholder="e.g. 112"
              />
              <Field
                label="Type of Patient"
                value={patientType}
                onChange={setPatientType}
                placeholder="e.g. Long-term & Short-term"
              />
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Previous Coverage from Medelite
                </label>
                <select
                  value={previousCoverage}
                  onChange={(e) => setPreviousCoverage(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <Field
                label="Previous Provider Performance"
                value={previousPerformance}
                onChange={setPreviousPerformance}
                placeholder="e.g. About 30 patients/day"
              />
              <Field
                label="Medical Coverage"
                value={medicalCoverage}
                onChange={setMedicalCoverage}
                placeholder="e.g. Optometry, PCP, Podiatry"
              />
            </div>
          </section>

          <section className="flex gap-4">
            <button
              onClick={handleDownloadPdf}
              className="bg-[#1a1a3e] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2a2a5e] transition"
            >
              Download PDF
            </button>
            <button
              onClick={handleDownloadDocx}
              className="bg-white border-2 border-[#1a1a3e] text-[#1a1a3e] px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Download DOCX
            </button>
          </section>

          <p className="mt-6 text-xs text-gray-500">
            {"Source: "}
            <a
              href={`https://www.medicare.gov/care-compare/details/nursing-home/${facility.ccn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              {"Medicare Care Compare \u2014 " + facility.ccn}
            </a>
          </p>
        </>
      )}
    </main>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-gray-500">{label + ": "}</span>
      <span className="font-medium text-gray-800">{value ?? "\u2014"}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
      />
    </div>
  );
}
