import { describe, expect, it } from "vitest";
import { PO_SCENARIOS } from "./data";
import { processPurchaseOrder } from "./engine";
import type { SyntheticPO } from "./types";

const cleanPO = (): SyntheticPO =>
  structuredClone(PO_SCENARIOS.find((s) => s.id === "clean")!.po);

describe("processPurchaseOrder — clean document", () => {
  it("produces an ERP-ready order with correct totals", () => {
    const result = processPurchaseOrder(cleanPO());
    expect(result.status).toBe("erp_ready");
    expect(result.issues).toHaveLength(0);
    const order = result.erpOrder!;
    expect(order.system).toBe("Simulated ERP");
    expect(order.customerId).toBe("DEMO-CUST-A");
    expect(order.lines).toHaveLength(3);
    // 24 * 82.00 + 48 * 18.90 + 6 * 39.75 = 1968 + 907.20 + 238.50
    expect(order.orderTotal).toBeCloseTo(3113.7, 2);
    expect(order.lines[1].extended).toBeCloseTo(907.2, 2);
  });

  it("is deterministic (same input, same order number)", () => {
    const a = processPurchaseOrder(cleanPO());
    const b = processPurchaseOrder(cleanPO());
    expect(a.erpOrder!.orderNumber).toBe(b.erpOrder!.orderNumber);
  });

  it("marks every pipeline step as passing", () => {
    const result = processPurchaseOrder(cleanPO());
    const flagged = result.steps.filter((s) => s.outcome === "flag");
    expect(flagged).toHaveLength(0);
  });
});

describe("processPurchaseOrder — Control Path routing", () => {
  it("quarantines an incomplete PO with missing-field reasons", () => {
    const result = processPurchaseOrder(
      PO_SCENARIOS.find((s) => s.id === "incomplete")!.po,
    );
    expect(result.status).toBe("control_path");
    expect(result.erpOrder).toBeUndefined();
    const fields = result.issues
      .filter((i) => i.code === "missing_field")
      .map((i) => i.field);
    expect(fields).toContain("shipTo");
    expect(fields).toContain("requestedShipDate");
    // Every issue carries a human resolution — the Control Path is actionable.
    expect(result.issues.every((i) => i.resolution.length > 0)).toBe(true);
  });

  it("flags price conflicts and unknown SKUs on the conflicting PO", () => {
    const result = processPurchaseOrder(
      PO_SCENARIOS.find((s) => s.id === "conflicting")!.po,
    );
    expect(result.status).toBe("control_path");
    const codes = result.issues.map((i) => i.code);
    expect(codes).toContain("price_conflict");
    expect(codes).toContain("unknown_sku");
  });

  it("tolerates small price variances within tolerance", () => {
    const po = cleanPO();
    po.lines[0].unitPrice = 82.0 * 1.03; // 3% — inside 5% tolerance
    expect(processPurchaseOrder(po).status).toBe("erp_ready");
  });

  it("blocks a duplicate PO number", () => {
    const po = cleanPO();
    po.poNumber = "DEMO-DUPLICATE-1"; // already imported
    const result = processPurchaseOrder(po);
    expect(result.status).toBe("control_path");
    expect(result.issues.some((i) => i.code === "duplicate_po")).toBe(true);
  });

  it("routes an unknown customer to a person instead of inventing an account", () => {
    const po = cleanPO();
    po.customerName = "Totally New Ventures Inc.";
    const result = processPurchaseOrder(po);
    expect(result.status).toBe("control_path");
    expect(result.issues.some((i) => i.code === "unknown_customer")).toBe(true);
  });

  it("rejects non-integer or non-positive quantities", () => {
    const po = cleanPO();
    po.lines[0].qty = 0;
    const result = processPurchaseOrder(po);
    expect(result.issues.some((i) => i.code === "invalid_qty")).toBe(true);
  });

  it("holds an order that would exceed the customer's credit limit", () => {
    const po = cleanPO();
    po.customerName = "Sample Customer B"; // synthetic $25k limit, $21.4k open
    po.paymentTerms = "Net 45";
    po.lines = [
      {
        line: 1,
        sku: "DEMO-PANEL-L",
        description: "Powder-coated access panel, 14x14",
        qty: 100,
        unitPrice: 82.0,
      },
    ];
    const result = processPurchaseOrder(po);
    expect(result.status).toBe("control_path");
    expect(result.issues.some((i) => i.code === "credit_review")).toBe(true);
  });

  it("flags a requested ship date before the PO date for review", () => {
    const po = cleanPO();
    po.requestedShipDate = "2026-08-01"; // PO dated 2026-08-03
    const result = processPurchaseOrder(po);
    expect(result.issues.some((i) => i.code === "date_conflict")).toBe(true);
    expect(result.status).toBe("control_path");
  });
});
