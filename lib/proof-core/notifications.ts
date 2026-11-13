export type ProofNotificationType =
  | "application_update"
  | "new_message"
  | "challenge_result"
  | "skill_verified"
  | "interview_invite"
  | "opportunity_match"
  | "company_update"
  | "security_alert";

export interface ProofNotification {
  id: string;
  userId: string;
  type: ProofNotificationType;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
}

export function isNotificationValid(
  item: ProofNotification,
): boolean {
  return Boolean(
    item.id.trim() &&
    item.userId.trim() &&
    item.title.trim() &&
    item.body.trim() &&
    !Number.isNaN(Date.parse(item.createdAt)),
  );
}

export function getUnreadNotifications(
  items: ProofNotification[],
  userId: string,
): ProofNotification[] {
  return items.filter(
    (item) => item.userId === userId && !item.readAt,
  );
}

export function sortNotifications(
  items: ProofNotification[],
): ProofNotification[] {
  return [...items].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function countNotificationsByType(
  items: ProofNotification[],
): Partial<Record<ProofNotificationType, number>> {
  const result: Partial<Record<ProofNotificationType, number>> = {};

  for (const item of items) {
    result[item.type] = (result[item.type] ?? 0) + 1;
  }

  return result;
}

export function markNotificationRead(
  items: ProofNotification[],
  notificationId: string,
  readAt = new Date().toISOString(),
): ProofNotification[] {
  return items.map((item) =>
    item.id === notificationId
      ? { ...item, readAt }
      : item,
  );
}

export function buildActivityFeed(
  items: ProofNotification[],
  userId: string,
  limit = 20,
): ProofNotification[] {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));

  return sortNotifications(
    items.filter((item) => item.userId === userId),
  ).slice(0, safeLimit);
}
