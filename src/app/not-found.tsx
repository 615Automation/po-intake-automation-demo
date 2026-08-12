import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-5 text-center">
      <div>
        <p className="text-xs font-black tracking-[0.16em] text-blue-700 uppercase">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          That page isn&apos;t part of this demo.
        </h1>
        <Link
          href="/demos/po-intake"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          Open the PO automator
        </Link>
      </div>
    </main>
  );
}
