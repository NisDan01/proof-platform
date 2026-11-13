# PROOF Hiring Workflow

A deterministic domain module for candidate screening and recruitment workflows.

## Responsibilities

- Candidate eligibility evaluation.
- Required skill coverage.
- Hiring stage transition validation.
- Immutable candidate state transitions.
- Audit event generation.
- Candidate ranking.
- Pipeline stage summaries.
- Hiring conversion metrics.
- Policy validation.
- Candidate comparison.

## Security boundary

This module is domain logic, not an authorization system. Production database
operations must independently verify the authenticated user, company ownership,
and row-level security policies. Client-provided scores must never be treated as
verified evidence.

## Testing

The workflow test module uses dependency-free assertions and can be run with a
TypeScript runtime. TypeScript compilation should be checked before committing.
