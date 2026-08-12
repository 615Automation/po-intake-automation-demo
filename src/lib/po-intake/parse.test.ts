import { describe, expect, it } from "vitest";
import { normalizeExtractedPurchaseOrder } from "./parse";

describe("normalizeExtractedPurchaseOrder", () => {
  it("normalizes a model tool result without inventing missing values", () => {
    const extracted = normalizeExtractedPurchaseOrder({
      documentType: "purchase_order",
      poNumber: " DEMO-100 ",
      customerName: "Sample Customer",
      poDate: "2026-08-01",
      shipTo: "",
      requestedShipDate: "2026-08-15",
      paymentTerms: "Net 30",
      lines: [
        {
          line: "1",
          sku: "DEMO-ITEM-A",
          description: "Sample item",
          qty: "4",
          unitPrice: "$12.50",
        },
      ],
    });

    expect(extracted).toEqual({
      documentType: "purchase_order",
      po: {
        poNumber: "DEMO-100",
        customerName: "Sample Customer",
        poDate: "2026-08-01",
        shipTo: "",
        requestedShipDate: "2026-08-15",
        paymentTerms: "Net 30",
        lines: [
          {
            line: 1,
            sku: "DEMO-ITEM-A",
            description: "Sample item",
            qty: 4,
            unitPrice: 12.5,
          },
        ],
        notes: "",
      },
    });
  });

  it("marks an unrelated document as other", () => {
    expect(
      normalizeExtractedPurchaseOrder({ documentType: "invoice", lines: [] })
        ?.documentType,
    ).toBe("other");
  });

  it("rejects non-object tool input", () => {
    expect(normalizeExtractedPurchaseOrder("not an object")).toBeNull();
  });
});
