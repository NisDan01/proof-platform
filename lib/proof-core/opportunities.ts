export type OpportunityType =
  | "full_time"
  | "part_time"
  | "internship"
  | "freelance"
  | "contract"
  | "project";

export type OpportunityStatus =
  | "draft"
  | "published"
  | "paused"
  | "closed"
  | "archived";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "assessment"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface Opportunity {
  id: string;
  companyId: string;
  title: string;
  description: string;
  type: OpportunityType;
  location: string;
  remote: boolean;
  requiredSkills: string[];
  preferredSkills: string[];
  minimumScore: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  openings: number;
  status: OpportunityStatus;
  publishedAt?: string;
  closesAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  candidateId: string;
  candidateName: string;
  skillScores: Record<string, number>;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

export interface OpportunityFilters {
  type?: OpportunityType;
  remote?: boolean;
  location?: string;
  skills?: string[];
  minimumScore?: number;
  search?: string;
}

export interface OpportunityValidation {
  valid: boolean;
  errors: string[];
}

export interface ApplicationMatch {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  preferredMatches: string[];
  eligible: boolean;
}

const APPLICATION_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  submitted: ["under_review", "withdrawn", "rejected"],
  under_review: ["assessment", "shortlisted", "rejected", "withdrawn"],
  assessment: ["shortlisted", "rejected", "withdrawn"],
  shortlisted: ["interview", "rejected", "withdrawn"],
  interview: ["offered", "rejected", "withdrawn"],
  offered: ["hired", "rejected", "withdrawn"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

const VALID_TYPES: OpportunityType[] = [
  "full_time",
  "part_time",
  "internship",
  "freelance",
  "contract",
  "project",
];

const VALID_STATUSES: OpportunityStatus[] = [
  "draft",
  "published",
  "paused",
  "closed",
  "archived",
];

function clean(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueSkills(skills: string[]): string[] {
  return [...new Set(skills.map(clean).filter(Boolean))];
}

function validDate(value?: string): boolean {
  return value === undefined || Number.isFinite(Date.parse(value));
}

export function validateOpportunity(
  opportunity: Opportunity,
): OpportunityValidation {
  const errors: string[] = [];

  if (!opportunity.companyId.trim()) {
    errors.push("Company ID is required.");
  }

  if (opportunity.title.trim().length < 5) {
    errors.push("Title must contain at least five characters.");
  }

  if (opportunity.description.trim().length < 30) {
    errors.push("Description must contain at least thirty characters.");
  }

  if (!VALID_TYPES.includes(opportunity.type)) {
    errors.push("Invalid opportunity type.");
  }

  if (!VALID_STATUSES.includes(opportunity.status)) {
    errors.push("Invalid opportunity status.");
  }

  if (!Number.isInteger(opportunity.openings) || opportunity.openings < 1) {
    errors.push("Openings must be a positive integer.");
  }

  if (
    !Number.isFinite(opportunity.minimumScore) ||
    opportunity.minimumScore < 0 ||
    opportunity.minimumScore > 100
  ) {
    errors.push("Minimum score must be between 0 and 100.");
  }

  if (
    opportunity.salaryMin !== undefined &&
    (!Number.isFinite(opportunity.salaryMin) || opportunity.salaryMin < 0)
  ) {
    errors.push("Minimum salary cannot be negative.");
  }

  if (
    opportunity.salaryMax !== undefined &&
    (!Number.isFinite(opportunity.salaryMax) || opportunity.salaryMax < 0)
  ) {
    errors.push("Maximum salary cannot be negative.");
  }

  if (
    opportunity.salaryMin !== undefined &&
    opportunity.salaryMax !== undefined &&
    opportunity.salaryMax < opportunity.salaryMin
  ) {
    errors.push("Maximum salary cannot be below minimum salary.");
  }

  if (!validDate(opportunity.closesAt)) {
    errors.push("Closing date is invalid.");
  }

  if (!validDate(opportunity.publishedAt)) {
    errors.push("Publication date is invalid.");
  }

  if (!validDate(opportunity.createdAt) || !validDate(opportunity.updatedAt)) {
    errors.push("Creation and update dates must be valid.");
  }

  if (!opportunity.currency.trim()) {
    errors.push("Currency is required.");
  }

  if (uniqueSkills(opportunity.requiredSkills).length === 0) {
    errors.push("At least one required skill is necessary.");
  }

  return { valid: errors.length === 0, errors };
}

export function isOpportunityOpen(
  opportunity: Opportunity,
  now = new Date(),
): boolean {
  if (opportunity.status !== "published") return false;
  if (opportunity.openings < 1) return false;

  if (
    opportunity.closesAt &&
    Date.parse(opportunity.closesAt) <= now.getTime()
  ) {
    return false;
  }

  return true;
}

export function publishOpportunity(
  opportunity: Opportunity,
  now = new Date(),
): Opportunity {
  const validation = validateOpportunity(opportunity);

  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  if (opportunity.status !== "draft" && opportunity.status !== "paused") {
    throw new Error("Only draft or paused opportunities can be published.");
  }

  if (
    opportunity.closesAt &&
    Date.parse(opportunity.closesAt) <= now.getTime()
  ) {
    throw new Error("Closing date must be in the future.");
  }

  return {
    ...opportunity,
    status: "published",
    publishedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function updateOpportunityStatus(
  opportunity: Opportunity,
  status: OpportunityStatus,
  now = new Date(),
): Opportunity {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid opportunity status.");
  }

  const allowed: Record<OpportunityStatus, OpportunityStatus[]> = {
    draft: ["published", "archived"],
    published: ["paused", "closed", "archived"],
    paused: ["published", "closed", "archived"],
    closed: ["archived"],
    archived: [],
  };

  if (!allowed[opportunity.status].includes(status)) {
    throw new Error(
      `Invalid status change: ${opportunity.status} -> ${status}`,
    );
  }

  return { ...opportunity, status, updatedAt: now.toISOString() };
}

export function calculateApplicationMatch(
  opportunity: Opportunity,
  skillScores: Record<string, number>,
): ApplicationMatch {
  const available = new Map(
    Object.entries(skillScores).map(([name, score]) => [clean(name), score]),
  );

  const required = uniqueSkills(opportunity.requiredSkills);
  const preferred = uniqueSkills(opportunity.preferredSkills);

  const matchedSkills = required.filter((skill) => {
    const score = available.get(skill);
    return score !== undefined && Number.isFinite(score) && score >= opportunity.minimumScore;
  });

  const missingSkills = required.filter((skill) => !matchedSkills.includes(skill));

  const preferredMatches = preferred.filter((skill) => {
    const score = available.get(skill);
    return score !== undefined && Number.isFinite(score) && score > 0;
  });

  const requiredCoverage =
    required.length === 0 ? 0 : matchedSkills.length / required.length;

  const preferredCoverage =
    preferred.length === 0 ? 1 : preferredMatches.length / preferred.length;

  const score = Math.round(
    (requiredCoverage * 0.8 + preferredCoverage * 0.2) * 100,
  );

  return {
    score,
    matchedSkills,
    missingSkills,
    preferredMatches,
    eligible: missingSkills.length === 0,
  };
}

export function filterOpportunities(
  opportunities: Opportunity[],
  filters: OpportunityFilters,
  now = new Date(),
): Opportunity[] {
  const search = clean(filters.search ?? "");
  const location = clean(filters.location ?? "");
  const skills = uniqueSkills(filters.skills ?? []);

  return opportunities.filter((opportunity) => {
    if (!isOpportunityOpen(opportunity, now)) return false;

    if (filters.type && opportunity.type !== filters.type) return false;
    if (filters.remote !== undefined && opportunity.remote !== filters.remote) {
      return false;
    }

    if (
      location &&
      !clean(opportunity.location).includes(location)
    ) {
      return false;
    }

    if (filters.minimumScore !== undefined &&
      opportunity.minimumScore > filters.minimumScore) {
      return false;
    }

    if (skills.length > 0) {
      const available = uniqueSkills([
        ...opportunity.requiredSkills,
        ...opportunity.preferredSkills,
      ]);

      if (!skills.every((skill) => available.includes(skill))) return false;
    }

    if (search) {
      const searchable = clean(
        `${opportunity.title} ${opportunity.description} ${opportunity.location} ${opportunity.requiredSkills.join(" ")}`,
      );

      if (!searchable.includes(search)) return false;
    }

    return true;
  });
}

export function sortOpportunitiesByNewest(
  opportunities: Opportunity[],
): Opportunity[] {
  return [...opportunities].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function canUpdateApplication(
  current: ApplicationStatus,
  next: ApplicationStatus,
): boolean {
  return APPLICATION_TRANSITIONS[current].includes(next);
}

export function updateApplicationStatus(
  application: OpportunityApplication,
  next: ApplicationStatus,
  now = new Date(),
): OpportunityApplication {
  if (!canUpdateApplication(application.status, next)) {
    throw new Error(
      `Invalid application transition: ${application.status} -> ${next}`,
    );
  }

  return {
    ...application,
    status: next,
    updatedAt: now.toISOString(),
  };
}

export function createApplication(
  opportunity: Opportunity,
  candidateId: string,
  candidateName: string,
  skillScores: Record<string, number>,
  existing: OpportunityApplication[] = [],
  now = new Date(),
): OpportunityApplication {
  if (!candidateId.trim()) throw new Error("Candidate ID is required.");
  if (!candidateName.trim()) throw new Error("Candidate name is required.");

  if (!isOpportunityOpen(opportunity, now)) {
    throw new Error("This opportunity is not accepting applications.");
  }

  const duplicate = existing.some(
    (application) =>
      application.opportunityId === opportunity.id &&
      application.candidateId === candidateId &&
      application.status !== "withdrawn",
  );

  if (duplicate) throw new Error("An active application already exists.");

  const match = calculateApplicationMatch(opportunity, skillScores);

  if (!match.eligible) {
    throw new Error(
      `Missing required skills: ${match.missingSkills.join(", ")}`,
    );
  }

  return {
    id: crypto.randomUUID(),
    opportunityId: opportunity.id,
    candidateId,
    candidateName: candidateName.trim(),
    skillScores: { ...skillScores },
    status: "submitted",
    appliedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function withdrawApplication(
  application: OpportunityApplication,
  now = new Date(),
): OpportunityApplication {
  if (!canUpdateApplication(application.status, "withdrawn")) {
    throw new Error("This application can no longer be withdrawn.");
  }

  return {
    ...application,
    status: "withdrawn",
    updatedAt: now.toISOString(),
  };
}

export function countApplicationsByStatus(
  applications: OpportunityApplication[],
): Record<ApplicationStatus, number> {
  const statuses = Object.keys(APPLICATION_TRANSITIONS) as ApplicationStatus[];

  const counts = Object.fromEntries(
    statuses.map((status) => [status, 0]),
  ) as Record<ApplicationStatus, number>;

  for (const application of applications) {
    counts[application.status] += 1;
  }

  return counts;
}

export function calculateApplicationConversion(
  applications: OpportunityApplication[],
): number {
  if (applications.length === 0) return 0;

  const hired = applications.filter(
    (application) => application.status === "hired",
  ).length;

  return Math.round((hired / applications.length) * 10000) / 100;
}

export function getCompanyApplications(
  applications: OpportunityApplication[],
  opportunityIds: string[],
): OpportunityApplication[] {
  const allowed = new Set(opportunityIds);

  return applications.filter((application) =>
    allowed.has(application.opportunityId),
  );
}

export function getCandidateApplications(
  applications: OpportunityApplication[],
  candidateId: string,
): OpportunityApplication[] {
  return applications
    .filter((application) => application.candidateId === candidateId)
    .slice()
    .sort(
      (a, b) => Date.parse(b.appliedAt) - Date.parse(a.appliedAt),
    );
}

export function summarizeOpportunities(
  opportunities: Opportunity[],
): Record<OpportunityStatus, number> {
  const counts: Record<OpportunityStatus, number> = {
    draft: 0,
    published: 0,
    paused: 0,
    closed: 0,
    archived: 0,
  };

  for (const opportunity of opportunities) {
    counts[opportunity.status] += 1;
  }

  return counts;
}
