import {
  ALREADY_IMPORTED_PO_NUMBERS,
  CATALOG,
  CUSTOMERS,
  PRICE_TOLERANCE,
} from "./data";
import type {
  ErpOrder,
  IntakeIssue,
  IntakeResult,
  PipelineStep,
  SyntheticPO,
} from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The Documents to Trusted Records transformation: a synthetic PO document
 * either becomes a validated, ERP-ready order or enters the Control Path
 * with every reason stated and a human resolution attached. The engine is a
 * pure function so the demonstrator (and its tests) are fully deterministic.
 */
export function processPurchaseOrder(po: SyntheticPO): IntakeResult {
  const issues: IntakeIssue[] = [];

  // --- Extraction ------------------------------------------------------
  const headerFields: [string, string][] = [
    ["PO number", po.poNumber],
    ["Customer", po.customerName],
    ["PO date", po.poDate],
    ["Ship-to address", po.shipTo],
    ["Requested ship date", po.requestedShipDate],
    ["Payment terms", po.paymentTerms],
  ];
  const fieldsExtracted =
    headerFields.filter(([, v]) => v.trim() !== "").length + po.lines.length * 4;

  // --- Required fields --------------------------------------------------
  const required: [string, string, string][] = [
    ["PO number", po.poNumber, "poNumber"],
    ["Customer", po.customerName, "customerName"],
    ["Ship-to address", po.shipTo, "shipTo"],
    ["Requested ship date", po.requestedShipDate, "requestedShipDate"],
  ];
  for (const [label, value, field] of required) {
    if (value.trim() === "") {
      issues.push({
        code: "missing_field",
        severity: "blocking",
        field,
        message: `${label} is missing from the document.`,
        resolution: `Hold the order and ask the customer to confirm the ${label.toLowerCase()} before anything is created in the ERP.`,
      });
    }
  }

  // --- Customer master --------------------------------------------------
  const customer = CUSTOMERS.find(
    (c) => c.name.toLowerCase() === po.customerName.trim().toLowerCase(),
  );
  if (po.customerName.trim() !== "" && !customer) {
    issues.push({
      code: "unknown_customer",
      severity: "blocking",
      field: "customerName",
      message: `"${po.customerName}" does not match any customer on file.`,
      resolution:
        "A person confirms whether this is a new account or a renamed one, then sets it up deliberately — the system never invents a customer.",
    });
  }

  // --- Duplicate protection ----------------------------------------------
  if (ALREADY_IMPORTED_PO_NUMBERS.includes(po.poNumber.trim())) {
    issues.push({
      code: "duplicate_po",
      severity: "blocking",
      field: "poNumber",
      message: `PO ${po.poNumber} was already imported once.`,
      resolution:
        "Quarantine the document so the same order can never be entered twice; a person decides if this is a revision.",
    });
  }

  // --- Line validation ----------------------------------------------------
  for (const line of po.lines) {
    const item = CATALOG.find((c) => c.sku === line.sku);
    if (!item) {
      issues.push({
        code: "unknown_sku",
        severity: "blocking",
        line: line.line,
        message: `Line ${line.line}: item code ${line.sku} is not in the item master.`,
        resolution:
          "A person maps the customer's code to a real item or quotes the custom work — no guessed substitutions.",
      });
      continue;
    }
    if (!Number.isInteger(line.qty) || line.qty < 1) {
      issues.push({
        code: "invalid_qty",
        severity: "blocking",
        line: line.line,
        message: `Line ${line.line}: quantity ${line.qty} is not a valid order quantity.`,
        resolution: "Confirm the intended quantity with the customer before import.",
      });
    }
    const deviation = Math.abs(line.unitPrice - item.listPrice) / item.listPrice;
    if (deviation > PRICE_TOLERANCE) {
      issues.push({
        code: "price_conflict",
        severity: "blocking",
        line: line.line,
        message: `Line ${line.line}: PO price $${line.unitPrice.toFixed(2)} conflicts with the current list price $${item.listPrice.toFixed(2)} for ${line.sku}.`,
        resolution:
          "Route to sales to honor a quoted price or correct the PO — a price disagreement is never resolved silently.",
      });
    }
  }

  // --- Date sanity ---------------------------------------------------------
  if (
    po.requestedShipDate &&
    po.poDate &&
    po.requestedShipDate < po.poDate
  ) {
    issues.push({
      code: "date_conflict",
      severity: "review",
      field: "requestedShipDate",
      message: `Requested ship date ${po.requestedShipDate} is before the PO date ${po.poDate}.`,
      resolution: "Confirm the real need-by date before promising a ship date.",
    });
  }

  // --- Credit review --------------------------------------------------------
  const orderTotal = round2(
    po.lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0),
  );
  if (customer && customer.openBalance + orderTotal > customer.creditLimit) {
    issues.push({
      code: "credit_review",
      severity: "review",
      field: "customerName",
      message: `Order total $${orderTotal.toLocaleString()} would take ${customer.name} past its $${customer.creditLimit.toLocaleString()} credit limit.`,
      resolution:
        "Credit review by a person before release — the order is held, not rejected.",
    });
  }

  const clean = issues.length === 0;

  // --- Pipeline trace (what the viewer watches happen) -----------------------
  const validationCount = issues.length;
  const priceIssues = issues.filter(
    (i) => i.code === "price_conflict" || i.code === "unknown_sku",
  ).length;
  const steps: PipelineStep[] = [
    {
      id: "extract",
      label: "Read the document",
      detail: `${fieldsExtracted} fields extracted from the purchase order.`,
      outcome: "info",
    },
    {
      id: "validate",
      label: "Check completeness & identity",
      detail:
        validationCount - priceIssues === 0
          ? "Required fields present; customer and PO number check out."
          : `${validationCount - priceIssues} issue${validationCount - priceIssues === 1 ? "" : "s"} found in required fields, customer match, or duplicates.`,
      outcome: validationCount - priceIssues === 0 ? "pass" : "flag",
    },
    {
      id: "price",
      label: "Verify items & pricing",
      detail:
        priceIssues === 0
          ? "Every line matches the item master and current price list."
          : `${priceIssues} line${priceIssues === 1 ? "" : "s"} disagree${priceIssues === 1 ? "s" : ""} with the item master or price list.`,
      outcome: priceIssues === 0 ? "pass" : "flag",
    },
    {
      id: "route",
      label: clean ? "Create ERP-ready order" : "Route to Control Path",
      detail: clean
        ? "Validated order staged for the (simulated) ERP import."
        : "Nothing was created in the ERP. The document is quarantined with reasons attached for a person to resolve.",
      outcome: clean ? "pass" : "flag",
    },
  ];

  if (!clean) {
    return { status: "control_path", steps, issues, fieldsExtracted };
  }

  const erpOrder: ErpOrder = {
    system: "Simulated ERP",
    orderNumber: `SO-${orderNumberFrom(po.poNumber)}`,
    customerId: customer!.id,
    customerName: customer!.name,
    paymentTerms: po.paymentTerms || customer!.defaultTerms,
    shipTo: po.shipTo,
    requestedShipDate: po.requestedShipDate,
    lines: po.lines.map((l) => ({
      line: l.line,
      sku: l.sku,
      description: l.description,
      qty: l.qty,
      unitPrice: l.unitPrice,
      extended: round2(l.qty * l.unitPrice),
    })),
    orderTotal,
  };

  return { status: "erp_ready", steps, issues, erpOrder, fieldsExtracted };
}

/** Deterministic pseudo order number derived from the PO number. */
function orderNumberFrom(poNumber: string): string {
  let h = 7;
  for (const ch of poNumber) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  return String(10000 + (h % 90000));
}
