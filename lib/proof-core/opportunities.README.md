# PROOF Opportunity and Application Engine

Domain logic for opportunity publishing, discovery, matching and application tracking.

## Features

- Opportunity validation and lifecycle management.
- Publication and closing date checks.
- Remote, location, skill and type filters.
- Candidate skill matching.
- Duplicate application prevention.
- Application status transition rules.
- Candidate and company application queries.
- Application pipeline summaries.
- Conversion analytics.

## Production requirements

Database writes must use authenticated server-side operations.
Company ownership must be verified before editing opportunities.
Candidate identity must come from the authenticated session.
Supabase Row Level Security must enforce access to all records.
Client-provided skill scores are not verified credentials.
