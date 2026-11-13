export interface HiringFunnel {
  views: number;
  applications: number;
  assessments: number;
  shortlisted: number;
  interviews: number;
  hires: number;
}

export interface FunnelMetric {
  stage: string;
  count: number;
  conversionFromPrevious: number;
  conversionFromViews: number;
}

function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function percentage(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 10000) / 100 : 0;
}

export function buildHiringFunnel(
  input: HiringFunnel,
): FunnelMetric[] {
  const stages = [
    ["Views", safeCount(input.views)],
    ["Applications", safeCount(input.applications)],
    ["Assessments", safeCount(input.assessments)],
    ["Shortlisted", safeCount(input.shortlisted)],
    ["Interviews", safeCount(input.interviews)],
    ["Hires", safeCount(input.hires)],
  ] as const;

  let previous = stages[0][1];

  return stages.map(([stage, count], index) => {
    const metric = {
      stage,
      count,
      conversionFromPrevious: index === 0 ? 100 : percentage(count, previous),
      conversionFromViews: percentage(count, stages[0][1]),
    };

    previous = count;
    return metric;
  });
}

export function calculateHiringRate(
  hires: number,
  applications: number,
): number {
  return percentage(safeCount(hires), safeCount(applications));
}

export function calculateAverageScore(scores: number[]): number {
  const valid = scores.filter(
    (score) => Number.isFinite(score) && score >= 0 && score <= 100,
  );

  if (!valid.length) return 0;

  return Math.round(
    valid.reduce((sum, score) => sum + score, 0) / valid.length,
  );
}

export function comparePeriods(
  current: number,
  previous: number,
): { difference: number; changePercent: number } {
  const difference = current - previous;

  return {
    difference,
    changePercent: previous > 0
      ? Math.round((difference / previous) * 10000) / 100
      : current > 0 ? 100 : 0,
  };
}

export function summarizeHiringPerformance(
  funnel: HiringFunnel,
): string {
  const rate = calculateHiringRate(
    funnel.hires,
    funnel.applications,
  );

  return `${safeCount(funnel.hires)} hires from ${safeCount(funnel.applications)} applications (${rate}% hiring rate).`;
}
