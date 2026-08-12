export type LookbookMode =
  | "excel-erp"
  | "po-intake"
  | "predictive-decisions"
  | "permit-signals"
  | "custom-plugins";

export interface LookbookModeMeta {
  id: LookbookMode;
  label: string;
  description: string;
}

export const LOOKBOOK_STYLE_LOOK: Record<
  LookbookMode,
  | "excel-erp"
  | "po-intake"
  | "lead-generator"
  | "crm"
> = {
  "excel-erp": "excel-erp",
  "po-intake": "po-intake",
  "predictive-decisions": "crm",
  "permit-signals": "lead-generator",
  "custom-plugins": "excel-erp",
};

export const LOOKBOOK_MODES: LookbookModeMeta[] = [
  {
    id: "excel-erp",
    label: "ERP → Excel",
    description:
      "Run a P&L extract, then trace one Excel value to its supporting records.",
  },
  {
    id: "po-intake",
    label: "PO Intake",
    description: "Turn a supplied synthetic purchase order into a checked ERP-ready record.",
  },
  {
    id: "predictive-decisions",
    label: "Predictive Decisions",
    description:
      "Test a business decision against a transparent regression forecast and likely range.",
  },
  {
    id: "permit-signals",
    label: "Permit Leads",
    description: "Score a synthetic permit feed and approve one evidence-backed follow-up.",
  },
  {
    id: "custom-plugins",
    label: "Custom Plugins",
    description:
      "Configure a focused plugin for a Microsoft app or another business application.",
  },
] as const;

export const DEFAULT_LOOKBOOK_MODE: LookbookMode = "excel-erp";

export const LOOKBOOK_ROUTE_LOOK: Record<string, LookbookMode> = {
  "/": "excel-erp",
  "/enter": "excel-erp",
  "/demos/po-intake": "po-intake",
  "/demos/predictive-decisions": "predictive-decisions",
  "/demos/permit-signals": "permit-signals",
  "/demos/custom-plugins": "custom-plugins",
} as const;

const LOOKBOOK_ROUTE_ALIASES: Array<[string, LookbookMode]> = [
  ["/", "excel-erp"],
  ["/enter", "excel-erp"],
  ["/demos/po-intake", "po-intake"],
  ["/demos/predictive-decisions", "predictive-decisions"],
  ["/demos/permit-signals", "permit-signals"],
  ["/demos/custom-plugins", "custom-plugins"],
];

export function resolveLookFromPath(pathname: string): LookbookMode | null {
  const normalized = pathname.replace(/\/+$/u, "") || "/";
  if (LOOKBOOK_ROUTE_LOOK[normalized]) {
    return LOOKBOOK_ROUTE_LOOK[normalized];
  }
  for (const [prefix, mode] of LOOKBOOK_ROUTE_ALIASES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return mode;
    }
  }
  return null;
}

export function isLookbookMode(value: string): value is LookbookMode {
  return LOOKBOOK_MODES.some((mode) => mode.id === value);
}
