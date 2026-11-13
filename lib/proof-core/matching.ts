import type {
  Candidate,
  Opportunity,
  SkillRequirement,
} from "./types";

export interface SkillMatch {
  skill: string;
  candidateScore: number;
  requiredScore: number;
  matched: boolean;
  weight: number;
}

export interface CandidateMatch {
  candidateId: string;
  opportunityId: string;
  score: number;
  label: "Excellent match" | "Good match" | "Potential match" | "Low match";
  matchedSkills: string[];
  missingSkills: string[];
  details: SkillMatch[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function findSkillScore(
  candidate: Candidate,
  skillName: string,
): number {
  const match = candidate.skills.find(
    (skill) => normalize(skill.skill) === normalize(skillName),
  );

  return match?.score ?? 0;
}

function matchLabel(score: number): CandidateMatch["label"] {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Good match";
  if (score >= 50) return "Potential match";
  return "Low match";
}

export function compareSkill(
  candidate: Candidate,
  requirement: SkillRequirement,
): SkillMatch {
  const candidateScore = findSkillScore(candidate, requirement.skill);

  return {
    skill: requirement.skill,
    candidateScore,
    requiredScore: requirement.minimumScore,
    matched: candidateScore >= requirement.minimumScore,
    weight: requirement.weight,
  };
}

export function matchCandidate(
  candidate: Candidate,
  opportunity: Opportunity,
): CandidateMatch {
  const details = opportunity.requirements.map((requirement) =>
    compareSkill(candidate, requirement),
  );

  const totalWeight = details.reduce(
    (sum, detail) => sum + detail.weight,
    0,
  );

  const weightedScore = totalWeight === 0
    ? 0
    : details.reduce((sum, detail) => {
        const ratio = Math.min(
          100,
          (detail.candidateScore / Math.max(1, detail.requiredScore)) * 100,
        );

        return sum + ratio * detail.weight;
      }, 0) / totalWeight;

  const requiredSkills = opportunity.requirements.filter(
    (requirement) => requirement.required,
  );

  const requiredMatched = requiredSkills.every((requirement) =>
    findSkillScore(candidate, requirement.skill) >= requirement.minimumScore,
  );

  const score = Math.round(
    requiredMatched ? weightedScore : Math.min(weightedScore, 49),
  );

  return {
    candidateId: candidate.id,
    opportunityId: opportunity.id,
    score,
    label: matchLabel(score),
    matchedSkills: details
      .filter((detail) => detail.matched)
      .map((detail) => detail.skill),
    missingSkills: details
      .filter((detail) => !detail.matched)
      .map((detail) => detail.skill),
    details,
  };
}

export function rankCandidates(
  candidates: Candidate[],
  opportunity: Opportunity,
): CandidateMatch[] {
  return candidates
    .map((candidate) => matchCandidate(candidate, opportunity))
    .sort((a, b) => b.score - a.score);
}

export function findMatchingOpportunities(
  candidate: Candidate,
  opportunities: Opportunity[],
  minimumMatch = 50,
): CandidateMatch[] {
  return opportunities
    .filter((opportunity) => opportunity.status === "published")
    .map((opportunity) => matchCandidate(candidate, opportunity))
    .filter((match) => match.score >= minimumMatch)
    .sort((a, b) => b.score - a.score);
}
