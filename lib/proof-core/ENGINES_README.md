# PROOF Core Engines

Independent deterministic domain engines for the PROOF platform.

## Modules

- candidate-ranking.ts: weighted skill matching and eligibility.
- skill-verification.ts: evidence status and expiry policy evaluation.
- recommendations.ts: ranked open-opportunity recommendations.
- pipeline-analytics.ts: stage counts, conversion and time-to-hire.
- engines.ts: stable public exports.
- engines.test.ts: automated regression tests.

## Safety boundary

These modules calculate domain results. They do not authenticate users,
authorize database access, verify external issuers, or issue credentials.

Production integrations must:
- derive candidate identity from the authenticated server session;
- load trusted evidence from protected database records;
- enforce company ownership and row-level security;
- persist final decisions through authorized server-side operations;
- treat browser-submitted scores as untrusted input.

## Test

Run:

    npx tsx --test lib/proof-core/engines.test.ts

Type-check:

    npx tsc --noEmit
