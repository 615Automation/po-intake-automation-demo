"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { PO_SCENARIOS } from "@/lib/po-intake/data";
import { processPurchaseOrder } from "@/lib/po-intake/engine";
import type {
  IntakeResult,
  PipelineStep,
  SyntheticPO,
} from "@/lib/po-intake/types";

type RunState = "ready" | "extracting" | "checking" | "complete" | "error";
type Selection =
  | { kind: "upload"; file: File }
  | { kind: "sample"; scenarioId: string }
  | null;

interface ParsePayload {
  po?: SyntheticPO;
  error?: string;
}

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const AUTOMATION_URL =
  "https://github.com/615Automation/po-intake-automation-demo/actions/workflows/po-intake-scheduled.yml";

const STEP_MARK: Record<PipelineStep["outcome"], string> = {
  info: "→",
  pass: "✓",
  flag: "!",
};

const STEP_STYLE: Record<PipelineStep["outcome"], string> = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  pass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  flag: "border-amber-200 bg-amber-50 text-amber-700",
};

const money = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

function UnattendedMessage() {
  return (
    <aside className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
      <p className="text-xs font-black tracking-[0.16em] text-blue-700 uppercase">
        What happens in a live setup
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        You won&apos;t do this part.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
        You just did by hand what the automation does on its own. In a live
        setup it runs every few hours—or the moment a PO arrives—and the finished
        record is simply there. No page to open, no button to press, nobody
        assigned to remember.
      </p>
      <div className="mt-4 border-t border-blue-200 pt-4 text-xs leading-5 text-slate-600">
        <p>
          Runs on GitHub Actions—standard automation infrastructure. Nothing new
          for your team to host or remember.
        </p>
        <a
          href={AUTOMATION_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block font-bold text-blue-700 underline decoration-blue-300 underline-offset-4 hover:decoration-blue-700"
        >
          See the unattended automation run →
        </a>
      </div>
    </aside>
  );
}

export function PoIntakeDemo() {
  const [selection, setSelection] = useState<Selection>(null);
  const [dragActive, setDragActive] = useState(false);
  const [runState, setRunState] = useState<RunState>("ready");
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [activePo, setActivePo] = useState<SyntheticPO | null>(null);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  const extractedTotal = useMemo(
    () =>
      activePo?.lines.reduce(
        (sum, line) => sum + line.qty * line.unitPrice,
        0,
      ) ?? 0,
    [activePo],
  );

  useEffect(() => {
    if (runState !== "checking" || !result) return;

    if (visibleSteps < result.steps.length) {
      const timer = window.setTimeout(
        () => setVisibleSteps((count) => count + 1),
        visibleSteps === 0 ? 160 : 320,
      );
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => setRunState("complete"), 180);
    return () => window.clearTimeout(timer);
  }, [result, runState, visibleSteps]);

  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    [],
  );

  const clearRun = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setRunState("ready");
    setVisibleSteps(0);
    setActivePo(null);
    setResult(null);
    setSourceLabel("");
    setError(null);
  };

  const reset = () => {
    clearRun();
    setSelection(null);
    setDragActive(false);
  };

  const beginChecks = (po: SyntheticPO, label: string) => {
    setActivePo(po);
    setResult(processPurchaseOrder(po));
    setSourceLabel(label);
    setVisibleSteps(0);
    setError(null);
    setRunState("checking");
  };

  const chooseFile = (file: File | null) => {
    if (!file) return;

    clearRun();
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setSelection(null);
      setError("This demo accepts PDF files only. Try a PDF or use a sample PO.");
      setRunState("error");
      return;
    }
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      setSelection(null);
      setError("Use a PDF smaller than 4 MB, or try a sample PO.");
      setRunState("error");
      return;
    }

    setSelection({ kind: "upload", file });
  };

  const onFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0] ?? null);
    event.currentTarget.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    chooseFile(event.dataTransfer.files?.[0] ?? null);
  };

  const selectSample = (scenarioId: string) => {
    clearRun();
    setSelection({ kind: "sample", scenarioId });
  };

  const runSampleNow = (scenarioId: string) => {
    const scenario = PO_SCENARIOS.find((item) => item.id === scenarioId);
    if (!scenario) return;
    setSelection({ kind: "sample", scenarioId });
    beginChecks(scenario.po, `${scenario.label} · synthetic sample`);
  };

  const processSelection = async () => {
    if (!selection) return;

    if (selection.kind === "sample") {
      runSampleNow(selection.scenarioId);
      return;
    }

    setRunState("extracting");
    setError(null);
    setActivePo(null);
    setResult(null);
    setVisibleSteps(0);

    const controller = new AbortController();
    requestRef.current = controller;
    const formData = new FormData();
    formData.set("file", selection.file);

    try {
      const response = await fetch("/api/po-intake/parse", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const payload = (await response.json()) as ParsePayload;
      if (!response.ok || !payload.po) {
        throw new Error(
          payload.error ?? "That one didn't parse. Try a sample PO instead.",
        );
      }
      beginChecks(payload.po, `${selection.file.name} · live PDF extraction`);
    } catch (reason) {
      if (controller.signal.aborted) return;
      setError(
        reason instanceof Error
          ? reason.message
          : "That one didn't parse. Try a sample PO instead.",
      );
      setRunState("error");
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  const selectedScenario =
    selection?.kind === "sample"
      ? PO_SCENARIOS.find((item) => item.id === selection.scenarioId)
      : null;
  const selectionName =
    selection?.kind === "upload"
      ? selection.file.name
      : selectedScenario
        ? `${selectedScenario.label} · synthetic sample`
        : null;

  return (
    <div className="mt-8 space-y-5">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_24px_70px_rgba(35,75,135,0.12)]">
        <div className="p-5 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <span className="text-slate-700">PDF only · 4 MB max · 10 pages max</span>
            <span className="text-slate-500">3 live checks per 10 minutes</span>
          </div>

          <div
            className={`rounded-2xl border-2 border-dashed px-5 py-9 text-center transition-colors sm:px-8 ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : selection?.kind === "upload"
                  ? "border-emerald-300 bg-emerald-50/60"
                  : "border-slate-200 bg-slate-50/70"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              aria-label="Upload a PDF purchase order, up to 4 MB and 10 pages"
              onChange={onFileSelected}
            />
            <span
              aria-hidden="true"
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-sm font-black tracking-tight text-white shadow-sm"
            >
              PDF
            </span>

            {selection?.kind === "upload" ? (
              <>
                <p className="mt-5 text-sm font-semibold text-emerald-700">
                  Ready to read the actual PDF
                </p>
                <p className="mt-1 break-all text-base font-bold text-slate-900">
                  {selection.file.name}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-sm font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-700"
                >
                  Choose a different PDF
                </button>
              </>
            ) : (
              <>
                <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
                  Drop a purchase order PDF here
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  The demo reads the file itself—not its filename.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Choose a PDF
                </button>
              </>
            )}
          </div>

          <p className="mt-3 text-center text-xs leading-5 text-slate-500">
            Processed for this run and not saved by this demo. Server-side
            extraction uses Anthropic&apos;s commercial API; its retention terms apply.
          </p>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-center text-xs font-black tracking-[0.14em] text-slate-500 uppercase">
              Or use an always-available synthetic sample
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Synthetic purchase order samples">
              {PO_SCENARIOS.map((scenario) => {
                const selected = selectedScenario?.id === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => selectSample(scenario.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-950"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <span className="block text-sm font-bold">{scenario.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {scenario.blurb}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selection && runState === "ready" ? (
            <button
              type="button"
              onClick={() => void processSelection()}
              className="mt-6 flex w-full items-center justify-between rounded-xl bg-slate-950 px-5 py-4 text-left text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <span>Process {selectionName}</span>
              <span aria-hidden="true" className="text-lg">→</span>
            </button>
          ) : null}
        </div>

        {runState === "extracting" ? (
          <div className="border-t border-slate-100 bg-blue-50/60 p-6 text-center sm:p-8" aria-live="polite" aria-busy="true">
            <span aria-hidden="true" className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
            <p className="mt-4 text-sm font-bold text-slate-950">Reading the actual PDF…</p>
            <p className="mt-1 text-xs text-slate-500">Extracting the fields before any business rules run.</p>
          </div>
        ) : null}

        {(runState === "checking" || runState === "complete") && result ? (
          <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-8" aria-live="polite" aria-busy={runState === "checking"}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-blue-700 uppercase">
                  {runState === "checking" ? "Checking the record" : "Checks complete"}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {visibleSteps} of {result.steps.length} checks complete
                </p>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {Math.round((visibleSteps / result.steps.length) * 100)}%
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <span className="block h-full rounded-full bg-blue-600 transition-[width] duration-300" style={{ width: `${(visibleSteps / result.steps.length) * 100}%` }} />
            </div>
            <ol className="mt-5 grid gap-2 sm:grid-cols-2">
              {result.steps.map((step, index) => {
                const visible = index < visibleSteps;
                return (
                  <li key={step.id} className={`flex items-start gap-3 rounded-xl border p-3 transition ${visible ? "border-slate-200 bg-white" : "border-transparent bg-slate-100 text-slate-400"}`}>
                    <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-black ${visible ? STEP_STYLE[step.outcome] : "border-slate-200 bg-slate-50 text-slate-400"}`}>
                      {visible ? STEP_MARK[step.outcome] : index + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${visible ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
                      {visible ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.detail}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </section>

      {activePo && (runState === "checking" || runState === "complete") ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black tracking-[0.14em] text-slate-500 uppercase">Record read from the document</p>
            <p className="text-xs text-slate-500">{sourceLabel}</p>
          </div>
          <dl className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold text-slate-500">PO number</dt>
              <dd className="mt-1 break-words text-sm font-bold text-slate-950">{activePo.poNumber || "Missing"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Customer</dt>
              <dd className="mt-1 break-words text-sm font-bold text-slate-950">{activePo.customerName || "Missing"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Lines</dt>
              <dd className="mt-1 text-sm font-bold text-slate-950">{activePo.lines.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Document total</dt>
              <dd className="mt-1 text-sm font-bold text-slate-950">{money(extractedTotal)}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {runState === "error" && error ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8" aria-live="polite">
          <p className="text-xs font-black tracking-[0.16em] text-amber-700 uppercase">That one didn&apos;t parse</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">{error}</h2>
          <p className="mt-2 text-sm text-slate-600">The synthetic samples always work. Pick one to continue the walkthrough.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PO_SCENARIOS.map((scenario) => (
              <button key={scenario.id} type="button" onClick={() => runSampleNow(scenario.id)} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-bold text-amber-900 hover:border-amber-500">
                Try {scenario.label.toLowerCase()}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {runState === "complete" && result?.status === "erp_ready" && result.erpOrder ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-emerald-700 uppercase">Ready for ERP</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">PO validated successfully</h2>
            </div>
            <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white">No exceptions</span>
          </div>
          <dl className="mt-6 grid gap-4 border-t border-emerald-200 pt-5 sm:grid-cols-3">
            <div><dt className="text-xs font-semibold text-emerald-800/70">Order</dt><dd className="mt-1 font-bold text-slate-950">{result.erpOrder.orderNumber}</dd></div>
            <div><dt className="text-xs font-semibold text-emerald-800/70">Customer</dt><dd className="mt-1 font-bold text-slate-950">{result.erpOrder.customerName}</dd></div>
            <div><dt className="text-xs font-semibold text-emerald-800/70">Order total</dt><dd className="mt-1 font-bold text-slate-950">{money(result.erpOrder.orderTotal)}</dd></div>
          </dl>
          <p className="mt-5 text-xs text-emerald-900/65">Simulated handoff · nothing was posted to a live ERP</p>
          <UnattendedMessage />
          <button type="button" onClick={reset} className="mt-5 text-sm font-bold text-emerald-800 hover:text-emerald-950">Process another PO →</button>
        </section>
      ) : null}

      {runState === "complete" && result?.status === "control_path" ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8" aria-live="polite">
          <p className="text-xs font-black tracking-[0.16em] text-amber-700 uppercase">Held for review</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Nothing was posted</h2>
          <p className="mt-2 text-sm text-slate-600">The document was read, but the demo master data or business rules found an exception.</p>
          <ul className="mt-5 space-y-2">
            {result.issues.map((issue, index) => (
              <li key={`${issue.code}-${issue.field ?? issue.line ?? ""}-${index}`} className="rounded-xl border border-amber-200 bg-white/80 p-4">
                <p className="text-sm font-bold text-slate-900">{issue.message}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{issue.resolution}</p>
              </li>
            ))}
          </ul>
          <UnattendedMessage />
          <button type="button" onClick={reset} className="mt-5 text-sm font-bold text-amber-800 hover:text-amber-950">Process another PO →</button>
        </section>
      ) : null}
    </div>
  );
}
