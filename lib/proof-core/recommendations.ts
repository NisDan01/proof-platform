import {
  rankCandidate,
  type CandidateSkillEvidence,
  type SkillRequirement,
} from "./candidate-ranking";

export interface RecommendationCandidate {
  candidateId: string;
  skills: CandidateSkillEvidence[];
}

export interface RecommendationOpportunity {
  id: string;
  title: string;
  companyName: string;
  status: "open" | "paused" | "closed";
  requiredSkills: SkillRequirement[];
  remote?: boolean;
  location?: string;
}

export interface OpportunityRecommendation {
  opportunityId: string;
  title: string;
  companyName: string;
  matchScore: number;
  eligible: boolean;
  matchedSkills: string[];
  missingSkills: string[];
  remote: boolean;
  location: string | null;
}

export interface RecommendationOptions {
  limit?: number;
  minimumMatchScore?: number;
  eligibleOnly?: boolean;
}

export function recommendOpportunities(
  candidate: RecommendationCandidate,
  opportunities: RecommendationOpportunity[],
  options: RecommendationOptions = {},
): OpportunityRecommendation[] {
  const limit = options.limit ?? 10;
  const minimumScore = options.minimumMatchScore ?? 0;

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Recommendation limit must be between 1 and 100.");
  }

  if (
    !Number.isFinite(minimumScore) ||
    minimumScore < 0 ||
    minimumScore > 100
  ) {
    throw new Error("Minimum match score must be between 0 and 100.");
  }

  const seen = new Set<string>();

  const results = opportunities
    .filter((opportunity) => {
      if (!opportunity.id.trim() || !opportunity.title.trim()) {
        throw new Error("Opportunity ID and title are required.");
      }

      if (seen.has(opportunity.id)) {
        throw new Error("Opportunity IDs must be unique.");
      }

      seen.add(opportunity.id);
      return opportunity.status === "open";
    })
    .map((opportunity) => {
      const ranking = rankCandidate({
        candidateId: candidate.candidateId,
        skills: candidate.skills,
        requirements: opportunity.requiredSkills,
      });

      return {
        opportunityId: opportunity.id,
        title: opportunity.title,
        companyName: opportunity.companyName,
        matchScore: ranking.matchScore,
        eligible: ranking.eligible,
        matchedSkills: ranking.matchedSkills,
        missingSkills: ranking.missingSkills,
        remote: opportunity.remote ?? false,
        location: opportunity.location ?? null,
      };
    })
    .filter((item) => item.matchScore >= minimumScore)
    .filter((item) => !options.eligibleOnly || item.eligible)
    .sort((a, b) =>
      b.matchScore - a.matchScore ||
      a.title.localeCompare(b.title) ||
      a.opportunityId.localeCompare(b.opportunityId)
    );

  return results.slice(0, limit);
}
