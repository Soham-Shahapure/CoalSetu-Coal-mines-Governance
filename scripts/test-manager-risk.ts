import assert from 'node:assert/strict';
import {
  RISK_WEIGHTS,
  buildRiskBreakdown,
  calculateRiskScore,
  normalizeObservationBurdenScore,
  normalizeRecurringObservationScore,
  normalizeSeverityWeightedObservationScore,
} from '../server/managerRisk.js';

const availableOnly = [
  { key: 'severity_weighted_observations' as const, score: 80, weight: RISK_WEIGHTS.severity_weighted_observations },
  { key: 'recurring_observation_rate' as const, score: 60, weight: RISK_WEIGHTS.recurring_observation_rate },
  { key: 'overdue_action_rate' as const, score: null, weight: RISK_WEIGHTS.overdue_action_rate },
  { key: 'observation_burden' as const, score: 40, weight: RISK_WEIGHTS.observation_burden },
  { key: 'closure_performance_risk' as const, score: null, weight: RISK_WEIGHTS.closure_performance_risk },
  { key: 'closure_time_risk' as const, score: null, weight: RISK_WEIGHTS.closure_time_risk },
];

assert.equal(calculateRiskScore(availableOnly), 63);
assert.equal(normalizeSeverityWeightedObservationScore(3, 4), 100);
assert.equal(normalizeRecurringObservationScore(1, 4), 50);
assert.equal(normalizeObservationBurdenScore(3, 4), 100);

const breakdown = buildRiskBreakdown(availableOnly);
const severity = breakdown.find((item) => item.key === 'severity_weighted_observations');
const overdue = breakdown.find((item) => item.key === 'overdue_action_rate');
assert.equal(severity?.available, true);
assert.equal(severity?.weighted_contribution, 33.33);
assert.equal(overdue?.available, false);
assert.equal(overdue?.weighted_contribution, null);

assert.equal(Object.values(RISK_WEIGHTS).reduce((sum, value) => sum + value, 0), 1);

console.log('Manager risk engine tests passed.');
console.log('Phase 3A available-component score:', calculateRiskScore(availableOnly));
console.log('Breakdown:', JSON.stringify(breakdown, null, 2));
