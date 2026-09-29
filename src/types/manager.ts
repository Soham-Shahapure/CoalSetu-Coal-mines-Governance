export type ManagerObservationCategory =
  | 'VENTILATION'
  | 'STRATA_SUPPORT'
  | 'DANGER'
  | 'WATER'
  | 'GAS'
  | 'SAFETY_MATERIAL'
  | 'SAFETY_INFRINGEMENT'
  | 'DANGEROUS_OPERATION'
  | 'ACCIDENT'
  | 'FENCING'
  | 'SANITATION'
  | 'OTHER';

export type ManagerObservationSource = 'SIRDAR_INSPECTION' | 'OVERMAN_REPORT';
export type ManagerDataSource = 'LIVE_OPERATIONAL_DATA' | 'REPRESENTATIVE_DEMO_DATA';
export type DataConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ManagerObservation {
  id: string;
  mine_id: string;
  mine_name: string;
  category: ManagerObservationCategory;
  title: string;
  description: string;
  observed_at: string;
  source_type: ManagerObservationSource;
  source_id: string;
  source_number: string;
  source_inspection_id?: string;
  location?: string;
  action_recorded?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  severity_weight: number;
  manager_action_status: 'NOT_CREATED';
  demo_seeded?: boolean;
}

export interface RecurringPattern {
  category: ManagerObservationCategory;
  occurrence_count: number;
  report_count: number;
  first_observed: string;
  last_observed: string;
  source_record_ids: string[];
  description: string;
}

export interface RiskComponentBreakdown {
  key: string;
  score: number | null;
  weight: number;
  available: boolean;
  weighted_contribution: number | null;
}

export interface RiskComponents {
  severity_weighted_observations: number | null;
  recurring_observation_rate: number | null;
  observation_burden: number | null;
  overdue_action_rate: number | null;
  closure_performance_risk: number | null;
  closure_time_risk: number | null;
  available_components: string[];
  breakdown: RiskComponentBreakdown[];
}

export interface DataConfidence {
  level: DataConfidenceLevel;
  reports_analyzed: number;
  observations_analyzed: number;
  period_start: string | null;
  period_end: string | null;
  explanation: string;
}

export interface ManagerMineProfile {
  mine_id: string;
  mine_name: string;
  subsidiary: string;
  mine_type: 'UNDERGROUND';
  location: string;
  data_source: ManagerDataSource;
  report_count: number;
  observation_count: number;
  risk_score: number | null;
  risk_components: RiskComponents;
  recurring_categories: ManagerObservationCategory[];
  data_confidence: DataConfidence;
}

export interface ManagerAreaSummary {
  name: string;
  mine_count: number;
}

export interface ManagerOverviewSummary {
  submitted_records: number;
  observations: number;
  recurring_categories: number;
}

export interface ManagerAnalysisPeriod {
  from: string | null;
  to: string | null;
}

export interface ManagerOverview {
  area: ManagerAreaSummary;
  summary: ManagerOverviewSummary;
  analysis_period: ManagerAnalysisPeriod;
  mines: ManagerMineProfile[];
}

export interface ManagerMineDetail extends ManagerMineProfile {
  observations: ManagerObservation[];
  recurring_patterns: RecurringPattern[];
  source_summary: {
    sirdar_inspections: number;
    overman_reports: number;
  };
}

export type CorrectiveTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CorrectiveTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'SUBMITTED_FOR_VERIFICATION' | 'VERIFIED' | 'CANCELLED';

export interface CorrectiveTaskAssignee {
  user_id: string | null;
  name: string;
  employee_id: string;
  role: 'OVERMAN';
}

export interface CorrectiveTaskEvidence {
  id: string;
  type: 'NOTE' | 'IMAGE' | 'DOCUMENT';
  name?: string;
  description?: string;
  data_url?: string;
  created_at: string;
  created_by: string;
}

export interface CorrectiveTaskAuditEvent {
  id: string;
  event: 'CREATED' | 'ASSIGNED' | 'STARTED' | 'SUBMITTED_FOR_VERIFICATION' | 'VERIFIED' | 'RETURNED' | 'CANCELLED';
  actor_id: string;
  actor_name: string;
  occurred_at: string;
  note?: string;
}

export interface CorrectiveTask {
  id: string;
  task_number: string;
  mine_id: string;
  mine_name: string;
  title: string;
  description: string;
  priority: CorrectiveTaskPriority;
  assigned_to: CorrectiveTaskAssignee;
  created_by: { user_id: string; name: string; employee_id: string };
  created_at: string;
  due_date: string;
  status: CorrectiveTaskStatus;
  source_observation_ids: string[];
  evidence: CorrectiveTaskEvidence[];
  audit_history: CorrectiveTaskAuditEvent[];
  work_summary?: string;
  submitted_at?: string;
  verified_at?: string;
  verification_note?: string;
  return_note?: string;
}
