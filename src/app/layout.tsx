import type { Metadata } from "next";
import { LookbookShell } from "@/components/lookbook-shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://po-intake-automation-demo.vercel.app",
  ),
  title: {
    default: "Purchase Order Automator",
    template: "%s · Purchase Order Automator",
  },
  description:
    "See a purchase-order PDF become a checked, ERP-ready record or a clear exception.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LookbookShell withToolbar={false}>{children}</LookbookShell>
      </body>
    </html>
  );
}
