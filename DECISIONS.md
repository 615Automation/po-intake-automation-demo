# PO intake demo shipping decisions

- The prospect-facing repository and Vercel project are public and use the
  neutral name `po-intake-automation-demo`; no existing client project is reused.
- Live uploads use the real server-side extraction path. The browser accepts
  PDF only, up to 4 MB and 10 pages, and the API key never enters the client.
- The parser uses the pinned Claude Haiku 4.5 model and passes its structured
  output into the existing deterministic validation engine unchanged.
- Live parsing is limited to three requests per IP every ten minutes in the app
  and is also protected by a Vercel WAF rate-limit rule in production.
- The demo does not save uploaded files or extracted records. The UI accurately
  states that Anthropic's commercial API handling and retention terms apply; it
  does not claim that third-party processing has zero retention.
- Bundled records use conspicuous `Sample` and `DEMO-*` labels. Internal root
  planning documents and architecture notes are ignored and never enter the
  public repository.
- The public repository and Vercel upload contain only `/demos/po-intake`, its
  parser, and the deterministic PO engine. Pre-existing gallery code remains in
  the local workspace but is excluded from the release boundary.
- The GitHub repository is public because the acceptance criteria require a
  prospect to see a real green scheduled-automation run without requesting access.
