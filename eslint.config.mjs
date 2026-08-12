import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/lookbook-shell.tsx"],
    rules: {
      // Legacy compatibility wrapper for the broader local workspace. The
      // prospect release uses a fixed PO route and never changes this mode.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "artifacts/**",
    "next-env.d.ts",
  ]),
]);
