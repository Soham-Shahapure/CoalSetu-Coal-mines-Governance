export const RISK_WEIGHTS = {
  severity_weighted_observations: 0.25,
  recurring_observation_rate: 0.20,
  overdue_action_rate: 0.20,
  observation_burden: 0.15,
  closure_performance_risk: 0.10,
  closure_time_risk: 0.10,
} as const;

export type RiskComponentKey = keyof typeof RISK_WEIGHTS;

export interface RiskComponentInput {
  key: RiskComponentKey;
  score: number | null;
  weight: number;
}

export interface RiskComponentBreakdown {
  key: RiskComponentKey;
  score: number | null;
  weight: number;
  available: boolean;
  weighted_contribution: number | null;
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Returns the weighted-average risk score using only currently available
 * components. Missing Phase 3B action/closure components are excluded from
 * both numerator and denominator rather than treated as zero risk.
 */
export function calculateRiskScore(components: RiskComponentInput[]): number | null {
  const available = components.filter((component) => typeof component.score === 'number');
  if (!available.length) return null;

  const numerator = available.reduce(
    (sum, component) => sum + clampScore(component.score as number) * component.weight,
    0,
  );
  const denominator = available.reduce((sum, component) => sum + component.weight, 0);

  return denominator ? Math.round(numerator / denominator) : null;
}

export function buildRiskBreakdown(components: RiskComponentInput[]): RiskComponentBreakdown[] {
  const availableWeight = components
    .filter((component) => typeof component.score === 'number')
    .reduce((sum, component) => sum + component.weight, 0);

  return components.map((component) => ({
    key: component.key,
    score: component.score === null ? null : clampScore(component.score),
    weight: component.weight,
    available: typeof component.score === 'number',
    weighted_contribution:
      typeof component.score === 'number' && availableWeight
        ? Number(((clampScore(component.score) * component.weight) / availableWeight).toFixed(2))
        : null,
  }));
}

export function normalizeSeverityWeightedObservationScore(weightedObservationTotal: number, reportCount: number): number {
  if (reportCount <= 0) return 0;
  return clampScore((weightedObservationTotal / Math.max(3, reportCount * 0.75)) * 100);
}

export function normalizeRecurringObservationScore(recurringCategories: number, totalCategories: number): number {
  if (totalCategories <= 0) return 0;
  return clampScore((recurringCategories / totalCategories / 0.5) * 100);
}

export function normalizeObservationBurdenScore(observationCount: number, reportCount: number): number {
  if (reportCount <= 0) return 0;
  return clampScore((observationCount / reportCount / 0.75) * 100);
}
