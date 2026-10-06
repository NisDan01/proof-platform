export type CandidateSkill = {
  skill_id: string;
  score: number;
  verified: boolean;
};

export type RequiredSkill = {
  skill_id: string;
  required_score: number;
};

export function calculateMatchScore(
  candidateSkills: CandidateSkill[],
  requiredSkills: RequiredSkill[],
) {
  if (requiredSkills.length === 0) return 0;

  let total = 0;

  for (const required of requiredSkills) {
    const candidate = candidateSkills.find(
      (skill) => skill.skill_id === required.skill_id,
    );

    if (!candidate) continue;

    const scoreRatio = Math.min(
      candidate.score / Math.max(required.required_score, 1),
      1,
    );

    const verifiedBonus = candidate.verified ? 0.1 : 0;

    total += Math.min(scoreRatio + verifiedBonus, 1);
  }

  return Math.round((total / requiredSkills.length) * 100);
}

export function getMatchLabel(score: number) {
  if (score >= 90) return "Excellent match";
  if (score >= 75) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Partial match";
  return "Low match";
}
