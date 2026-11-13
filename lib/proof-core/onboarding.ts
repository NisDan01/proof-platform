export interface CandidateOnboarding {
  fullName: string;
  email: string;
  headline: string;
  location: string;
  bio: string;
  skills: string[];
  portfolioUrl?: string;
  resumeUrl?: string;
  availability?: "immediate" | "two_weeks" | "one_month" | "not_available";
}

export interface OnboardingResult {
  percentage: number;
  completed: string[];
  missing: string[];
  ready: boolean;
}

const REQUIRED_FIELDS: (keyof CandidateOnboarding)[] = [
  "fullName",
  "email",
  "headline",
  "location",
  "bio",
  "skills",
];

export function evaluateOnboarding(
  profile: CandidateOnboarding,
): OnboardingResult {
  const completed: string[] = [];
  const missing: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = profile[field];
    const valid = Array.isArray(value)
      ? value.length > 0
      : typeof value === "string" && value.trim().length > 0;

    (valid ? completed : missing).push(field);
  }

  if (profile.portfolioUrl) completed.push("portfolioUrl");
  if (profile.resumeUrl) completed.push("resumeUrl");
  if (profile.availability) completed.push("availability");

  const total = REQUIRED_FIELDS.length + 3;
  const percentage = Math.round((completed.length / total) * 100);

  return {
    percentage,
    completed,
    missing,
    ready: missing.length === 0,
  };
}

export function normalizeCandidateName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 100);
}

export function validatePortfolioUrl(value?: string): boolean {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function getOnboardingNextStep(
  result: OnboardingResult,
): string {
  if (result.ready && result.percentage >= 80) {
    return "Explore challenges and verify your skills.";
  }

  return result.missing.length
    ? `Complete your ${result.missing[0]} section.`
    : "Add a portfolio or resume to strengthen your profile.";
}
