import type { POLine, SyntheticPO } from "./types";

export interface ExtractedPurchaseOrder {
  documentType: "purchase_order" | "other";
  po: SyntheticPO;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const safeString = (value: unknown, maxLength = 500) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const safeNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[$,]/gu, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

function normalizeLine(value: unknown, index: number): POLine | null {
  const line = asRecord(value);
  if (!line) return null;

  return {
    line: Math.trunc(safeNumber(line.line)) || index + 1,
    sku: safeString(line.sku, 120),
    description: safeString(line.description, 500),
    qty: safeNumber(line.qty),
    unitPrice: safeNumber(line.unitPrice),
  };
}

/**
 * Converts the model's tool input into the deterministic engine's existing
 * input type. Missing values stay blank so the engine can route them to review;
 * this layer never invents a customer, item, quantity, price, or date.
 */
export function normalizeExtractedPurchaseOrder(
  value: unknown,
): ExtractedPurchaseOrder | null {
  const input = asRecord(value);
  if (!input) return null;

  const documentType =
    input.documentType === "purchase_order" ? "purchase_order" : "other";
  const lines = Array.isArray(input.lines)
    ? input.lines
        .slice(0, 50)
        .map(normalizeLine)
        .filter((line): line is POLine => line !== null)
    : [];

  return {
    documentType,
    po: {
      poNumber: safeString(input.poNumber, 120),
      customerName: safeString(input.customerName, 240),
      poDate: safeString(input.poDate, 32),
      shipTo: safeString(input.shipTo, 500),
      requestedShipDate: safeString(input.requestedShipDate, 32),
      paymentTerms: safeString(input.paymentTerms, 120),
      lines,
      notes: safeString(input.notes, 1_000),
    },
  };
}
