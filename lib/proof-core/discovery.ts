export interface DiscoveryOpportunity {
  id: string;
  title: string;
  companyName: string;
  description: string;
  skills: string[];
  location: string;
  type: "job" | "internship" | "project" | "challenge";
  remote: boolean;
  createdAt: string;
}

export interface DiscoveryFilters {
  query?: string;
  skills?: string[];
  location?: string;
  type?: DiscoveryOpportunity["type"];
  remoteOnly?: boolean;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function searchOpportunities(
  items: DiscoveryOpportunity[],
  filters: DiscoveryFilters,
): DiscoveryOpportunity[] {
  const query = normalize(filters.query ?? "");
  const location = normalize(filters.location ?? "");
  const requiredSkills = (filters.skills ?? []).map(normalize);

  return items.filter((item) => {
    const searchable = normalize(
      `${item.title} ${item.companyName} ${item.description} ${item.skills.join(" ")}`,
    );

    if (query && !searchable.includes(query)) return false;
    if (location && !normalize(item.location).includes(location)) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.remoteOnly && !item.remote) return false;

    const availableSkills = item.skills.map(normalize);

    return requiredSkills.every((skill) =>
      availableSkills.includes(skill),
    );
  }).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function rankOpportunity(
  item: DiscoveryOpportunity,
  candidateSkills: string[],
): number {
  const candidate = new Set(candidateSkills.map(normalize));
  const required = item.skills.map(normalize);

  if (!required.length) return 0;

  const matches = required.filter((skill) => candidate.has(skill)).length;
  return Math.round((matches / required.length) * 100);
}

export function getRecommendedOpportunities(
  items: DiscoveryOpportunity[],
  candidateSkills: string[],
  limit = 10,
): (DiscoveryOpportunity & { matchScore: number })[] {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));

  return items
    .map((item) => ({
      ...item,
      matchScore: rankOpportunity(item, candidateSkills),
    }))
    .sort((a, b) =>
      b.matchScore - a.matchScore ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )
    .slice(0, safeLimit);
}

export function getOpportunityTypes(
  items: DiscoveryOpportunity[],
): Record<DiscoveryOpportunity["type"], number> {
  const counts = {
    job: 0,
    internship: 0,
    project: 0,
    challenge: 0,
  };

  for (const item of items) counts[item.type]++;

  return counts;
}
