import type { Metadata } from "next";
import Link from "next/link";
import { PoIntakeDemo } from "./po-intake-demo";

export const metadata: Metadata = {
  title: "Purchase Order Automator",
  description:
    "See a real purchase-order PDF become a checked, ERP-ready record or a clear exception.",
  openGraph: {
    title: "Purchase Order Automator",
    description:
      "See a real purchase-order PDF become a checked, ERP-ready record or a clear exception.",
    type: "website",
    images: [
      {
        url: "/po-intake-og.png",
        width: 1731,
        height: 909,
        alt: "A generic purchase order moving through extraction and validation into an ERP-ready record",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Purchase Order Automator",
    description:
      "See a real purchase-order PDF become a checked, ERP-ready record or a clear exception.",
    images: ["/po-intake-og.png"],
  },
};

export default function PoIntakePage() {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f7faff_0%,#edf4ff_52%,#f8fafc_100%)] text-slate-950">
      <header className="border-b border-blue-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="text-sm font-black tracking-tight text-slate-950 hover:text-blue-700">
            615 Automation
          </Link>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-blue-700 uppercase">
            Live document demo
          </span>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <section className="mx-auto max-w-3xl">
          <p className="text-xs font-black tracking-[0.18em] text-blue-700 uppercase">
            Purchase order automator
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl">
            From purchase order to ERP-ready record.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Upload one customer PO. The demo reads the actual PDF, checks customer,
            item, pricing, and duplicate rules, then stages a clean order or holds it
            with a clear reason. Synthetic samples are always available.
          </p>

          <PoIntakeDemo />
        </section>
      </main>

      <footer className="border-t border-blue-100 bg-white/70">
        <div className="mx-auto flex max-w-4xl flex-col gap-1 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-bold text-slate-700">615 Automation</p>
          <p>Demo master data · Simulated ERP · No live posting</p>
        </div>
      </footer>
    </div>
  );
}
