"use client";

import { useMemo, useState } from "react";

import CatalogAssistant from "@/components/CatalogAssistant";
import VoiceAgent from "@/components/VoiceAgent";

import type { ListingPlatform } from "@/utils/catalog";

type TaskSnapshot = {
  title: string;
  status: string;
  notes?: string;
};

export default function Home() {
  const [taskSnapshots, setTaskSnapshots] = useState<TaskSnapshot[]>([]);
  const [intelFeed, setIntelFeed] = useState<string[]>([
    "Systems ready. Awaiting operational directives.",
  ]);
  const [activePlatforms, setActivePlatforms] = useState<ListingPlatform[]>([
    "Amazon",
    "Flipkart",
    "Meesho",
    "Myntra",
  ]);

  const addIntel = (message: string) => {
    setIntelFeed((prev) => [message, ...prev].slice(0, 12));
  };

  const marketplaceSummary = useMemo(() => {
    return activePlatforms.map((name) => ({
      name,
      status: intelFeed.find((entry) => entry.toLowerCase().includes(name.toLowerCase()))
        ? "Queued"
        : "Standby",
    }));
  }, [activePlatforms, intelFeed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12 sm:px-10 lg:px-16">
        <header className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-8 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-blue-400/70">Project Jarvis</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                Personal Voice Operations Commander
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Orchestrate your daily ops, manage marketplace listings, and auto-fill catalog sheets across Amazon,
                Flipkart, Meesho, and Myntra. Voice-enabled. Spreadsheet-aware. Always mission-ready.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="text-xs uppercase tracking-wide text-emerald-300">Live Status</p>
              <p className="mt-2 font-semibold">Jarvis online · Ready for new directives</p>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="grid gap-8">
            <VoiceAgent
              onTaskUpdate={(tasks) => {
                setTaskSnapshots(
                  tasks.map((task) => ({ title: task.title, status: task.status, notes: task.notes })),
                );
                addIntel(
                  tasks.length
                    ? `Task matrix updated · ${tasks.length} item(s) on deck`
                    : "Task matrix clear · All missions complete",
                );
              }}
            />
            <CatalogAssistant
              onProgress={(update) => {
                addIntel(update);
                const platformMatches = update
                  .split(/[^\w]+/)
                  .map((part) => part.trim())
                  .filter((part): part is ListingPlatform =>
                    ["Amazon", "Flipkart", "Meesho", "Myntra"].includes(part),
                  );
                if (platformMatches.length) {
                  setActivePlatforms((prev) => Array.from(new Set([...prev, ...platformMatches])));
                }
              }}
            />
          </div>

          <aside className="grid h-fit gap-6">
            <div className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6">
              <h2 className="text-base font-semibold uppercase tracking-[0.3em] text-slate-400">
                Mission Feed
              </h2>
              <div className="mt-4 flex max-h-[360px] flex-col gap-4 overflow-y-auto pr-1">
                {intelFeed.map((entry, index) => (
                  <div
                    key={`${entry}-${index}`}
                    className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100"
                  >
                    {entry}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6">
              <h2 className="text-base font-semibold uppercase tracking-[0.3em] text-slate-400">
                Task Telemetry
              </h2>
              {taskSnapshots.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">No active missions. Engage voice command to deploy.</p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm">
                  {taskSnapshots.map((task) => (
                    <li
                      key={task.title}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                    >
                      <p className="font-semibold text-slate-100">{task.title}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Status: {task.status}</p>
                      {task.notes ? <p className="mt-1 text-xs text-slate-300">Notes: {task.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6">
              <h2 className="text-base font-semibold uppercase tracking-[0.3em] text-slate-400">
                Marketplace Control
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                {marketplaceSummary.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                  >
                    <p className="font-semibold text-slate-100">{item.name}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        item.status === "Queued"
                          ? "bg-amber-400/20 text-amber-200"
                          : "bg-slate-700/40 text-slate-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <footer className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-8 text-sm text-slate-400">
          <p>
            Voice agent commands to try: “Create task compile Flipkart price updates”, “Mark task Flipkart price updates
            as done”, “List tasks”, “Update task Myntra listing with photos”. Jarvis will keep your operations panel in
            sync.
          </p>
        </footer>
      </main>
    </div>
  );
}
