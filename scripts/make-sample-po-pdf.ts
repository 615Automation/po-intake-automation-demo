import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PO_SCENARIOS } from "../src/lib/po-intake/data";

async function main() {
  const po = PO_SCENARIOS[0].po;
  const document = await PDFDocument.create();
  const page = document.addPage([612, 792]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.08, 0.12, 0.18);
  let y = 742;

  const line = (text: string, size = 11, isBold = false) => {
    page.drawText(text, {
      x: 54,
      y,
      size,
      font: isBold ? bold : regular,
      color: dark,
    });
    y -= size + 9;
  };

  line("SYNTHETIC PURCHASE ORDER", 18, true);
  line(`PO Number: ${po.poNumber}`, 12, true);
  line(`Customer: ${po.customerName}`);
  line(`PO Date: ${po.poDate}`);
  line(`Ship To: ${po.shipTo}`);
  line(`Requested Ship Date: ${po.requestedShipDate}`);
  line(`Payment Terms: ${po.paymentTerms}`);
  y -= 12;
  line("LINE ITEMS", 12, true);
  for (const item of po.lines) {
    line(
      `${item.line}. ${item.sku} | ${item.description} | Qty ${item.qty} | Unit $${item.unitPrice.toFixed(2)}`,
      10,
    );
  }
  y -= 12;
  line(`Notes: ${po.notes ?? ""}`, 10);
  line("All names, identifiers, addresses, items, and amounts are synthetic.", 9, true);

  const outputDirectory = path.resolve("artifacts");
  const outputPath = path.join(outputDirectory, "sample-purchase-order.pdf");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, await document.save());
  console.log(`Created synthetic test PDF: ${outputPath}`);
}

void main();
