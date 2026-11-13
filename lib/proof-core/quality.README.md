# PROOF Quality & Reliability Engine

A deterministic domain utility module for the PROOF hiring platform.

## Capabilities

- Normalize text and search queries.
- Validate candidate scores.
- Classify score bands.
- Calculate weighted evaluation scores.
- Build bounded pagination metadata.
- Escape CSV values against spreadsheet formula injection.
- Build CSV exports.
- Summarize validation issues.
- Compare candidate scores.
- Build structured quality results.
- Generate normalized record keys.
- Calculate assessment pass rates.
- Build candidate score summaries.

## Security notes

This module provides input hygiene and data formatting utilities.
It is not an authorization boundary or a replacement for server-side
authentication, database constraints, or Supabase Row Level Security.

CSV escaping reduces formula injection risk when opening exported files
in spreadsheet applications. Production exports should still be reviewed
for the destination application's behavior.

Scores received from a browser must never be treated as verified evidence.
The trusted backend must calculate and persist official assessment results.

## Testing

Run:

    npm run test:quality

Run TypeScript validation:

    npx tsc --noEmit
