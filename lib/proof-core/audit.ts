import type { AuditEvent } from "./types";

export interface AuditFilter {
  actorId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  from?: string;
  to?: string;
}

export function createAuditEvent(
  input: Omit<AuditEvent, "id" | "timestamp">,
  id = crypto.randomUUID(),
  timestamp = new Date().toISOString(),
): AuditEvent {
  return {
    ...input,
    id,
    timestamp,
  };
}

export function filterAuditEvents(
  events: AuditEvent[],
  filter: AuditFilter,
): AuditEvent[] {
  return events.filter((event) => {
    if (filter.actorId && event.actorId !== filter.actorId) return false;
    if (filter.action && event.action !== filter.action) return false;
    if (filter.resource && event.resource !== filter.resource) return false;
    if (filter.resourceId && event.resourceId !== filter.resourceId) {
      return false;
    }

    const timestamp = new Date(event.timestamp).getTime();

    if (filter.from && timestamp < new Date(filter.from).getTime()) {
      return false;
    }

    if (filter.to && timestamp > new Date(filter.to).getTime()) {
      return false;
    }

    return true;
  });
}

export function summarizeAuditEvents(
  events: AuditEvent[],
): Record<string, number> {
  return events.reduce<Record<string, number>>((summary, event) => {
    summary[event.action] = (summary[event.action] ?? 0) + 1;
    return summary;
  }, {});
}

export function latestAuditEvents(
  events: AuditEvent[],
  limit = 20,
): AuditEvent[] {
  const safeLimit = Math.max(0, Math.floor(limit));

  return [...events]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime(),
    )
    .slice(0, safeLimit);
}
