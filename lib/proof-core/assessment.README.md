# PROOF Assessment Engine

A deterministic domain module for assessment evaluation.

## Features

- Assessment definition validation
- Question and option integrity checks
- Duplicate answer detection
- Weighted scoring
- Skill-level score breakdown
- Passing threshold evaluation
- Attempt duration validation
- Suspicious activity review flags
- Certification eligibility checks
- Assessment history summaries

## Example

```ts
import {
  evaluateAssessment,
  isCertificationEligible,
} from "./assessment";

const result = evaluateAssessment(assessment, attempt);

if (isCertificationEligible(result)) {
  // Send the result to a trusted server-side certification workflow.
}
```

## Security boundary

This module is domain logic, not an authorization system.

Production applications must:
- Authenticate the candidate on the server.
- Load assessment definitions from a trusted source.
- Never trust client-submitted scores.
- Keep answer keys away from public browser responses.
- Persist attempts through authorized server-side operations.
- Apply database Row Level Security.
- Treat activity flags as review signals, not proof of cheating.

A browser-reported tab-switch count is not tamper-proof.
Certification issuance must be performed by a trusted backend.
