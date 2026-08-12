/** Synthetic purchase-order document, as "received" from a customer email. */
export interface POLine {
  line: number;
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface SyntheticPO {
  poNumber: string;
  customerName: string;
  poDate: string; // ISO date
  shipTo: string;
  requestedShipDate: string; // ISO date, may be empty
  paymentTerms: string;
  lines: POLine[];
  notes?: string;
}

export type IssueSeverity = "blocking" | "review";

export interface IntakeIssue {
  code:
    | "missing_field"
    | "unknown_customer"
    | "unknown_sku"
    | "price_conflict"
    | "invalid_qty"
    | "duplicate_po"
    | "date_conflict"
    | "credit_review";
  severity: IssueSeverity;
  /** Which document field or line the issue is anchored to. */
  field?: string;
  line?: number;
  message: string;
  /** What a person would do about it — the Control Path stays human. */
  resolution: string;
}

export interface PipelineStep {
  id: "extract" | "validate" | "price" | "route";
  label: string;
  detail: string;
  outcome: "pass" | "flag" | "info";
}

export interface ErpOrderLine {
  line: number;
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
  extended: number;
}

export interface ErpOrder {
  system: string; // always labeled simulated by the UI
  orderNumber: string;
  customerId: string;
  customerName: string;
  paymentTerms: string;
  shipTo: string;
  requestedShipDate: string;
  lines: ErpOrderLine[];
  orderTotal: number;
}

export interface IntakeResult {
  status: "erp_ready" | "control_path";
  steps: PipelineStep[];
  issues: IntakeIssue[];
  /** Present only when status is erp_ready. */
  erpOrder?: ErpOrder;
  /** Count of fields successfully extracted from the document. */
  fieldsExtracted: number;
}
