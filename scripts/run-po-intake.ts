import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PO_SCENARIOS } from "../src/lib/po-intake/data";
import { processPurchaseOrder } from "../src/lib/po-intake/engine";

async function main() {
  const outputDirectory = path.resolve("artifacts");
  const outputPath = path.join(outputDirectory, "po-intake-results.json");
  const runs = PO_SCENARIOS.map((scenario) => {
    const result = processPurchaseOrder(scenario.po);
    return {
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      poNumber: scenario.po.poNumber,
      status: result.status,
      fieldsExtracted: result.fieldsExtracted,
      issueCodes: result.issues.map((issue) => issue.code),
      stagedOrderNumber: result.erpOrder?.orderNumber ?? null,
    };
  });

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        engine: "src/lib/po-intake/engine.ts",
        sampleCount: runs.length,
        runs,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`Processed ${runs.length} synthetic POs with the production engine.`);
  console.log(`Artifact: ${outputPath}`);
}

void main();
