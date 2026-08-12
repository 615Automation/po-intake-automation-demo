import type { SyntheticPO } from "./types";

/**
 * All records below are synthetic. Company names, SKUs, prices, and addresses
 * are invented for demonstration and do not describe any real business.
 */

export interface CatalogItem {
  sku: string;
  description: string;
  listPrice: number;
}

export const CATALOG: CatalogItem[] = [
  { sku: "DEMO-BRACKET-S", description: "Sample mounting bracket, small", listPrice: 12.4 },
  { sku: "DEMO-BRACKET-L", description: "Sample mounting bracket, large", listPrice: 18.9 },
  { sku: "DEMO-PANEL-S", description: "Sample access panel, small", listPrice: 64.5 },
  { sku: "DEMO-PANEL-L", description: "Sample access panel, large", listPrice: 82.0 },
  { sku: "DEMO-FASTENER", description: "Sample fastener kit", listPrice: 39.75 },
  { sku: "DEMO-GASKET", description: "Sample gasket roll", listPrice: 27.6 },
];

export interface CustomerRecord {
  id: string;
  name: string;
  defaultTerms: string;
  creditLimit: number;
  openBalance: number;
}

export const CUSTOMERS: CustomerRecord[] = [
  {
    id: "DEMO-CUST-A",
    name: "Sample Customer A",
    defaultTerms: "Net 30",
    creditLimit: 50_000,
    openBalance: 8_200,
  },
  {
    id: "DEMO-CUST-B",
    name: "Sample Customer B",
    defaultTerms: "Net 45",
    creditLimit: 25_000,
    openBalance: 21_400,
  },
  {
    id: "DEMO-CUST-C",
    name: "Sample Customer C",
    defaultTerms: "Net 30",
    creditLimit: 75_000,
    openBalance: 0,
  },
];

/** PO numbers this "company" has already imported — used for duplicate checks. */
export const ALREADY_IMPORTED_PO_NUMBERS = ["DEMO-DUPLICATE-1", "DEMO-DUPLICATE-2"];

/** Price deviation beyond this fraction of list is a conflict, not a rounding. */
export const PRICE_TOLERANCE = 0.05;

export interface POScenario {
  id: string;
  label: string;
  blurb: string;
  po: SyntheticPO;
}

export const PO_SCENARIOS: POScenario[] = [
  {
    id: "clean",
    label: "Clean sample",
    blurb: "A well-formed order that should pass every check.",
    po: {
      poNumber: "DEMO-PO-1001",
      customerName: "Sample Customer A",
      poDate: "2026-08-03",
      shipTo: "100 Example Avenue, Dock A, Demo City, TN 00000",
      requestedShipDate: "2026-08-14",
      paymentTerms: "Net 30",
      lines: [
        { line: 1, sku: "DEMO-PANEL-L", description: "Sample access panel, large", qty: 24, unitPrice: 82.0 },
        { line: 2, sku: "DEMO-BRACKET-L", description: "Sample mounting bracket, large", qty: 48, unitPrice: 18.9 },
        { line: 3, sku: "DEMO-FASTENER", description: "Sample fastener kit", qty: 6, unitPrice: 39.75 },
      ],
      notes: "Synthetic sample only — reference demo job 1001.",
    },
  },
  {
    id: "incomplete",
    label: "Missing fields",
    blurb: "Missing a ship-to address and a requested date — a person has to ask.",
    po: {
      poNumber: "DEMO-PO-1002",
      customerName: "Sample Customer C",
      poDate: "2026-08-04",
      shipTo: "",
      requestedShipDate: "",
      paymentTerms: "Net 30",
      lines: [
        { line: 1, sku: "DEMO-PANEL-S", description: "Sample access panel, small", qty: 12, unitPrice: 64.5 },
        { line: 2, sku: "DEMO-GASKET", description: "Sample gasket roll", qty: 4, unitPrice: 27.6 },
      ],
      notes: "Ship-to to follow under separate cover.",
    },
  },
  {
    id: "conflicting",
    label: "Pricing conflict",
    blurb: "Prices that disagree with the current price list, plus an unfamiliar item code.",
    po: {
      poNumber: "DEMO-PO-1003",
      customerName: "Sample Customer B",
      poDate: "2026-08-02",
      shipTo: "300 Example Avenue, Gate B, Demo City, TN 00000",
      requestedShipDate: "2026-08-10",
      paymentTerms: "Net 45",
      lines: [
        { line: 1, sku: "DEMO-BRACKET-S", description: "Sample mounting bracket, small", qty: 200, unitPrice: 9.8 },
        { line: 2, sku: "DEMO-UNKNOWN", description: "Sample custom item", qty: 10, unitPrice: 95.0 },
        { line: 3, sku: "DEMO-GASKET", description: "Sample gasket roll", qty: 8, unitPrice: 27.6 },
      ],
      notes: "Synthetic sample — pricing intentionally conflicts.",
    },
  },
];
