export type UserRole = 'SIRDAR' | 'OVERMAN' | 'MANAGER';

export interface User {
  id: string;
  name: string;
  employee_id: string;
  role: UserRole;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Mine {
  id: string;
  mine_name: string;
  subsidiary: string;
  mine_type: 'UNDERGROUND';
  location: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface District {
  id: string;
  mine_id: string;
  district_name: string;
  seam_name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Shift {
  id: string;
  mine_id: string;
  shift_name: string;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SirdarAssignment {
  user: User;
  mine: Mine;
  district: District;
  available_shifts: Shift[];
}

export interface InspectionPeriod {
  id?: string;
  inspection_id?: string;
  period_number: 1 | 2 | 3;
  start_time: string;
  end_time: string;
}

export type ObservationCategory =
  | 'VENTILATION'
  | 'STRATA'
  | 'GOAF_EDGE'
  | 'FENCING'
  | 'SANITATION';

export interface SectionDeficiencyObservation {
  category: ObservationCategory;
  has_deficiency: boolean;
  location_text?: string;
  description?: string;
  remedial_action?: string;
  remarks?: string;
}

export interface SafetyInstruction {
  id?: string;
  instruction: string;
  persons_instructed: number;
}

export interface PersonOrderedOut {
  id?: string;
  occurred: boolean;
  person_name?: string;
  assigned_place?: string;
  actual_place?: string;
  reason?: string;
  action_taken?: string;
}

export interface InexperiencedPerson {
  id?: string;
  present: boolean;
  person_name?: string;
  supervisor_name?: string;
}

export type SafetyMaterialType = 'TIMBER' | 'BUNTON' | 'LADDER' | 'CO_DETECTION' | 'OTHER';

export interface SafetyMaterialItem {
  material_type: SafetyMaterialType;
  status: 'ADEQUATE' | 'DEFICIENT' | 'AVAILABLE' | 'NOT_APPLICABLE';
  description?: string; // used for 'OTHER'
  remedial_action?: string;
  remarks?: string;
}

export interface SupportWithdrawal {
  id?: string;
  place: string;
  cogs_sleepers_withdrawn: number;
  props_withdrawn: number;
  other_support: string;
  means_of_withdrawal: string;
}

export interface DangerousPlaceObservation {
  observed: boolean;
  location?: string;
  nature_of_danger?: string;
  action_taken?: string;
  reported_by_other: boolean;
  reporting_person_name?: string;
  other_report_details?: string;
  other_report_action?: string;
}

export interface DangerousOperation {
  occurred: boolean;
  operation_nature?: string;
  location?: string;
  danger?: string;
  precautions_taken?: string;
}

export interface InactivePlaceFencing {
  fenced: boolean;
  location?: string;
  entrance_details?: string;
  action_taken?: string;
}

export interface GasObservation {
  detected: boolean;
  location?: string;
  gas_percentage?: string; // Sirdar enters observed value (e.g. "0.4%")
  action_taken?: string;
}

export interface WaterObservation {
  observed: boolean;
  location?: string;
  details?: string;
  action_taken?: string;
}

export interface AccidentObservation {
  occurred: boolean;
  cause_details?: string;
  first_aid_given_by?: string;
  remarks?: string;
}

export interface SuccessorConference {
  conducted: boolean;
  information_conveyed?: string;
  conveyed_to_person?: string;
}

export interface EgressRecord {
  travelled: boolean;
  travel_date?: string;
  remarks?: string;
}

export type InspectionStatus = 'DRAFT' | 'SUBMITTED';

export interface InspectionData {
  id?: string;
  inspection_number?: string; // e.g. INS-2026-000123
  sirdar_id: string;
  mine_id: string;
  district_id: string;
  shift_id: string;
  inspection_date: string; // YYYY-MM-DD
  persons_under_charge: number;

  // Periods (1 to 3)
  inspection_periods: InspectionPeriod[];

  // Deficiencies (5 statutory cards)
  deficiencies: Record<ObservationCategory, SectionDeficiencyObservation>;

  // Safety instructions
  safety_instructions: SafetyInstruction[];

  // Persons ordered out
  person_ordered_out: PersonOrderedOut;

  // Inexperienced persons
  inexperienced_person: InexperiencedPerson;

  // Safety materials checklist
  safety_materials: Record<SafetyMaterialType, SafetyMaterialItem>;

  // Second egress
  egress_record: EgressRecord;

  // Support withdrawals
  support_withdrawals_occurred: boolean;
  support_withdrawals: SupportWithdrawal[];

  // Dangerous places
  dangerous_places: DangerousPlaceObservation;

  // Dangerous operations
  dangerous_operations: DangerousOperation;

  // Inactive places
  inactive_places: InactivePlaceFencing;

  // Gas
  gas_observation: GasObservation;

  // Water seepage
  water_observation: WaterObservation;

  // Accidents
  accident_observation: AccidentObservation;

  // Successor conference
  successor_conference: SuccessorConference;

  // Other remarks / descriptive report
  other_remarks: string;

  // Metadata
  status: InspectionStatus;
  created_at: string;
  submitted_at?: string | null;
  device_info?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
}

export interface InspectionSummary {
  id: string;
  inspection_number: string;
  sirdar_name: string;
  sirdar_employee_id: string;
  mine_name: string;
  district_name: string;
  seam_name: string;
  shift_name: string;
  shift_hours: string;
  inspection_date: string;
  persons_under_charge: number;
  period_count: number;
  deficiency_count: number;
  gas_detected: boolean;
  water_seepage: boolean;
  accident_occurred: boolean;
  status: InspectionStatus;
  created_at: string;
  submitted_at?: string | null;
}

// ================= PHASE 2: OVERMAN DAILY REPORT TYPES =================
// Statutory basis: Coal Mines Regulations 2017, Regulation 47(7)(d), Form G.S.R. 972(E)

export type OvermanReportStatus = 'DRAFT' | 'READY_FOR_REVIEW' | 'SUBMITTED';

export type SectionPopulationStatus =
  | 'AUTO_POPULATED'
  | 'OVERMAN_REQUIRED'
  | 'COMPLETED'
  | 'PENDING';

export type OvermanSectionCode =
  | 'A' // Safety Materials
  | 'B' // Ventilation
  | 'C' // Stone Dusting / Barriers
  | 'D' // Haulage
  | 'E' // Danger
  | 'F' // Support Strata
  | 'G' // Hand Plan
  | 'H' // Working Faces within 10m
  | 'I' // Abnormal Water Seepage
  | 'J' // Persons Sent Out
  | 'K' // Safety Directions
  | 'L' // Conference with Successor
  | 'M' // Accident / First Aid
  | 'N'; // Other Remarks

export interface OvermanReportEntry {
  id: string;
  section_code: OvermanSectionCode;
  entry_type: 'AUTO' | 'OVERMAN_INPUT';
  title?: string;
  location?: string;
  details: string;
  action_taken?: string;
  source_inspection_id?: string;
  source_inspection_number?: string;
  source_observation_id?: string;
  sirdar_name?: string;
  sirdar_employee_id?: string;
  source_date?: string;
  source_time?: string;
  created_at: string;
}

export interface OvermanReportSection {
  code: OvermanSectionCode;
  title: string;
  statutory_clause: string;
  population_status: SectionPopulationStatus;
  is_overman_input_required: boolean;
  entries: OvermanReportEntry[];
  overman_notes?: string;
  structured_data?: Record<string, any>;
}

export interface OvermanReportData {
  id: string;
  report_number: string; // e.g. OVR-2026-000101
  overman_id: string;
  overman_name?: string;
  overman_employee_id?: string;
  mine_id: string;
  mine_name?: string;
  district_id: string;
  district_name?: string;
  seam_name?: string;
  shift_id: string;
  shift_name?: string;
  shift_hours?: string;
  report_date: string;
  parts_of_mine_inspected: string;
  status: OvermanReportStatus;
  assembled_from_inspection_ids: string[];
  selected_source_inspection_ids: string[];
  sections: Record<OvermanSectionCode, OvermanReportSection>;
  created_at: string;
  updated_at?: string;
  submitted_at?: string | null;
}

export interface OvermanAssignment {
  user: User;
  mine: Mine;
  district: District;
  available_shifts: Shift[];
  current_shift: Shift;
}

export interface DemoAccount {
  employee_id: string;
  name: string;
  role: UserRole;
  designation: string;
  assignment_hint: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    employee_id: 'S001',
    name: 'Rajesh Kumar',
    role: 'SIRDAR',
    designation: 'Mining Sirdar (Panel 4 / Seam III)',
    assignment_hint: 'Jhanjhra Underground Mine • Panel 4',
  },
  {
    employee_id: 'O001',
    name: 'Arjun Singh',
    role: 'OVERMAN',
    designation: 'Statutory Underground Overman',
    assignment_hint: 'Jhanjhra Underground Mine • Panel 4 (Seam III)',
  },
  {
    employee_id: 'M001',
    name: 'R. Mehta',
    role: 'MANAGER',
    designation: 'Manager',
    assignment_hint: 'Jhanjhra Area • Colliery Headquarters',
  },
];

export const STATUTORY_SECTIONS: Array<{
  code: OvermanSectionCode;
  title: string;
  statutory_clause: string;
  is_overman_input_required: boolean;
}> = [
  {
    code: 'A',
    title: 'Safety Materials',
    statutory_clause: 'CMR 47(7)(d)(i) — Supply & condition of timber, brattice, buntons, ladders and CO detectors',
    is_overman_input_required: false,
  },
  {
    code: 'B',
    title: 'Ventilation & Gas',
    statutory_clause: 'CMR 47(7)(d)(ii) — Ventilation adequacy, stopping conditions and inflammable gas detection',
    is_overman_input_required: false,
  },
  {
    code: 'C',
    title: 'Stone Dusting & Barriers',
    statutory_clause: 'CMR 47(7)(d)(iii) — Heavy stone dusting along roadways and stone dust barrier maintenance',
    is_overman_input_required: true,
  },
  {
    code: 'D',
    title: 'Haulage & Transport Roadways',
    statutory_clause: 'CMR 47(7)(d)(iv) — Haulage tracks, safety appliances, runaway switches and signalling',
    is_overman_input_required: true,
  },
  {
    code: 'E',
    title: 'Danger & Fencing of Places',
    statutory_clause: 'CMR 47(7)(d)(v) — Dangerous places observed or reported and fencing erected',
    is_overman_input_required: false,
  },
  {
    code: 'F',
    title: 'Support & Strata Control',
    statutory_clause: 'CMR 47(7)(d)(vi) — Systematic support rules (SSR), roof/side stability and remedial props',
    is_overman_input_required: false,
  },
  {
    code: 'G',
    title: 'Hand Plan & Working Faces',
    statutory_clause: 'CMR 47(7)(d)(vii) — Maintenance of daily working hand plan showing face advance positions',
    is_overman_input_required: true,
  },
  {
    code: 'H',
    title: 'Working Faces Within 10m',
    statutory_clause: 'CMR 47(7)(d)(viii) — Proximity of working faces approaching within 10m of other workings/water',
    is_overman_input_required: true,
  },
  {
    code: 'I',
    title: 'Abnormal Water Seepage',
    statutory_clause: 'CMR 47(7)(d)(ix) — Water accumulations, unusual floor heaving and pumping operations',
    is_overman_input_required: false,
  },
  {
    code: 'J',
    title: 'Persons Sent Out for Safety Infringement',
    statutory_clause: 'CMR 47(7)(d)(x) — Persons ordered out of workings due to non-compliance or danger',
    is_overman_input_required: false,
  },
  {
    code: 'K',
    title: 'Safety Directions Issued',
    statutory_clause: 'CMR 47(7)(d)(xi) — Orders and safety instructions conveyed to sirdars and workmen',
    is_overman_input_required: false,
  },
  {
    code: 'L',
    title: 'Conference with Successor',
    statutory_clause: 'CMR 47(7)(d)(xii) — Handover conference with relieving overman regarding district conditions',
    is_overman_input_required: true,
  },
  {
    code: 'M',
    title: 'Accident & First Aid',
    statutory_clause: 'CMR 47(7)(d)(xiii) — Dangerous occurrences, personal injuries and first-aid medical assistance',
    is_overman_input_required: false,
  },
  {
    code: 'N',
    title: 'Other Remarks & Summary',
    statutory_clause: 'CMR 47(7)(d)(xiv) — Overall district safety compliance and statutory summary',
    is_overman_input_required: false,
  },
];
