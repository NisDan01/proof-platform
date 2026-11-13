import type {
  Application,
  AuditEvent,
  Candidate,
  ChallengeAttempt,
} from "./types";

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined
    ? ""
    : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(
  headers: string[],
  rows: unknown[][],
): string {
  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = rows.map((row) =>
    headers.map((_, index) => escapeCsv(row[index])).join(","),
  );

  return [headerLine, ...dataLines].join("\r\n");
}

export function candidatesToCsv(candidates: Candidate[]): string {
  return toCsv(
    ["ID", "Name", "Email", "Experience Years", "Skill Count", "Created At"],
    candidates.map((candidate) => [
      candidate.id,
      candidate.name,
      candidate.email ?? "",
      candidate.experienceYears ?? 0,
      candidate.skills.length,
      candidate.createdAt,
    ]),
  );
}

export function attemptsToCsv(attempts: ChallengeAttempt[]): string {
  return toCsv(
    [
      "Attempt ID",
      "Candidate ID",
      "Challenge ID",
      "Skill",
      "Score",
      "Maximum Score",
      "Percentage",
      "Duration Seconds",
      "Completed At",
    ],
    attempts.map((attempt) => [
      attempt.id,
      attempt.candidateId,
      attempt.challengeId,
      attempt.skill,
      attempt.score,
      attempt.maxScore,
      attempt.maxScore > 0
        ? Math.round((attempt.score / attempt.maxScore) * 100)
        : 0,
      attempt.durationSeconds,
      attempt.completedAt,
    ]),
  );
}

export function applicationsToCsv(
  applications: Application[],
): string {
  return toCsv(
    [
      "Application ID",
      "Candidate ID",
      "Opportunity ID",
      "Stage",
      "Applied At",
      "Updated At",
      "Notes",
    ],
    applications.map((application) => [
      application.id,
      application.candidateId,
      application.opportunityId,
      application.stage,
      application.appliedAt,
      application.updatedAt,
      application.notes ?? "",
    ]),
  );
}

export function auditEventsToCsv(events: AuditEvent[]): string {
  return toCsv(
    [
      "Event ID",
      "Actor ID",
      "Action",
      "Resource",
      "Resource ID",
      "Timestamp",
    ],
    events.map((event) => [
      event.id,
      event.actorId,
      event.action,
      event.resource,
      event.resourceId,
      event.timestamp,
    ]),
  );
}
