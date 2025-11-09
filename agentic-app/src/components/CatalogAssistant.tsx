"use client";

import Papa from "papaparse";
import React, { useMemo, useState } from "react";
import { saveAs } from "file-saver";

import { enrichCatalog, ListingPlatform } from "@/utils/catalog";

type CatalogAssistantProps = {
  onProgress: (summary: string) => void;
};

type UploadState = "idle" | "processing" | "ready";

const DEFAULT_PLATFORMS: ListingPlatform[] = ["Amazon", "Flipkart", "Meesho", "Myntra"];

const CatalogAssistant: React.FC<CatalogAssistantProps> = ({ onProgress }) => {
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [platforms, setPlatforms] = useState<ListingPlatform[]>(DEFAULT_PLATFORMS);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string>("");
  const [outputRows, setOutputRows] = useState<Record<string, string>[]>([]);

  const togglePlatform = (platform: ListingPlatform) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((item) => item !== platform) : [...prev, platform],
    );
  };

  const handleFile = (file: File) => {
    setUploadState("processing");
    setMessage(`Parsing ${file.name}…`);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows =
          result.data
            ?.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), value?.toString().trim() ?? ""])))
            .filter((row) => Object.values(row).some(Boolean)) ?? [];
        setRawRows(rows);
        setUploadState("ready");
        setMessage(`Parsed ${rows.length} rows. Choose marketplaces and click Generate Listings.`);
        onProgress(`Catalog sheet loaded with ${rows.length} items.`);
      },
      error: (error) => {
        setUploadState("idle");
        setMessage(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length === 0) return;
    const file = event.dataTransfer.files[0];
    handleFile(file);
  };

  const handleGenerate = () => {
    if (rawRows.length === 0) {
      setMessage("Upload your catalog sheet first.");
      return;
    }
    if (platforms.length === 0) {
      setMessage("Select at least one marketplace.");
      return;
    }
    const generated = enrichCatalog(rawRows, platforms);
    setOutputRows(generated);
    setMessage(`Generated ${generated.length} marketplace-ready rows.`);
    onProgress(`Listings prepared for ${platforms.join(", ")}.`);
  };

  const downloadCsv = () => {
    if (outputRows.length === 0) {
      setMessage("Generate listings before downloading.");
      return;
    }
    const csv = Papa.unparse(outputRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    saveAs(blob, `catalog-listings-${timestamp}.csv`);
    onProgress("Exported enriched catalog CSV.");
  };

  const headerPreview = useMemo(() => {
    if (rawRows.length === 0) return [];
    return Object.keys(rawRows[0]) ?? [];
  }, [rawRows]);

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Marketplace Catalog Studio</h2>
        <p className="text-sm text-slate-300">
          Drop in your raw product data and auto-generate launch-ready listing content for Amazon, Flipkart,
          Meesho, and Myntra.
        </p>
      </div>

      <label
        htmlFor="catalog-upload"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center transition hover:border-slate-500"
      >
        <input
          id="catalog-upload"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-200">
          Upload Catalog CSV
        </span>
        <p className="text-sm text-slate-400">
          Drag &amp; drop or click to browse. Make sure your sheet has headers like product_name, brand,
          features, price, etc.
        </p>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {uploadState === "processing"
            ? "Processing..."
            : uploadState === "ready"
              ? "Sheet ready"
              : "Awaiting upload"}
        </p>
      </label>

      {headerPreview.length > 0 ? (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Detected Headers</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {headerPreview.map((header) => (
              <span
                key={header}
                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100"
              >
                {header}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Target Marketplaces</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DEFAULT_PLATFORMS.map((platform) => {
            const selected = platforms.includes(platform);
            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  selected
                    ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                    : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
                }`}
              >
                {platform}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 sm:flex-none sm:px-6"
        >
          Generate Listings
        </button>
        <button
          onClick={downloadCsv}
          className="flex-1 rounded-xl border border-blue-500 bg-blue-500/20 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-400/30 sm:flex-none sm:px-6"
        >
          Download CSV
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-200">{message}</p>
        </div>
      ) : null}

      {outputRows.length > 0 ? (
        <div className="max-h-72 overflow-auto rounded-2xl border border-slate-800/70 bg-slate-950/60">
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs text-slate-200">
            <thead className="bg-slate-900/80 uppercase tracking-wide text-slate-400">
              <tr>
                {Object.keys(outputRows[0] ?? {}).map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/80">
              {outputRows.slice(0, 10).map((row, index) => (
                <tr key={`${row.SKU}-${index}`}>
                  {Object.values(row).map((value, idx) => (
                    <td key={`${idx}-${value}`} className="px-4 py-3 text-[11px] leading-snug text-slate-300">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {outputRows.length > 10 ? (
            <div className="border-t border-slate-800/70 bg-slate-900/60 px-4 py-2 text-[11px] uppercase tracking-wide text-slate-500">
              Preview limited to first 10 rows. Download CSV for complete data.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default CatalogAssistant;
