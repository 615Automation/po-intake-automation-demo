# Purchase Order Automation Demo

A sanitized, public demonstration of a purchase-order intake workflow.

At `/demos/po-intake`, a visitor can:

- upload a real PDF purchase order (up to 4 MB and 10 pages);
- watch its extracted fields pass through deterministic customer, duplicate,
  item, price, date, and credit controls;
- see a clean order staged for a simulated ERP or an exception held with a
  stated human next step; and
- use three conspicuously synthetic samples if live parsing is unavailable.

The upload is processed server-side for the current request and is not saved by
this application. It uses Anthropic's commercial API for PDF extraction; the API
provider's data-handling and retention terms apply. The server-side key is never
sent to the browser.

## Unattended operation

The same deterministic engine runs on a six-hour GitHub Actions schedule. Each
run processes every synthetic scenario and uploads `po-intake-results.json` as a
workflow artifact. The scheduled workflow is also manually dispatchable.

## Local development

```bash
npm install
npm run dev
```

Set `ANTHROPIC_API_KEY` in `.env.local` to enable live PDF extraction. Never use
a `NEXT_PUBLIC_` variable for the key. Synthetic samples and all deterministic
tests work without an API key.

```bash
npm run test
npm run build
npm run po:intake:batch
npm run po:intake:sample-pdf
```

The prospect-facing release contains only this PO demo, its parser, and the
shared deterministic engine. Unrelated workspace demos and internal planning
documents are explicitly excluded from both the public repository and Vercel.

## Data boundary

All bundled companies, identifiers, addresses, items, and amounts use explicit
`Sample` and `DEMO-*` labels. There are no client documents, customer rosters,
third-party logos, or production credentials in this repository.
