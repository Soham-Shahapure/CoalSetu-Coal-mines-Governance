import fs from 'fs';
import path from 'path';
import {
  User,
  Mine,
  District,
  Shift,
  InspectionData,
  InspectionSummary,
  InspectionStatus,
  ObservationCategory,
  SafetyMaterialType,
  OvermanReportData,
  OvermanReportSection,
  OvermanReportEntry,
  OvermanAssignment,
  OvermanSectionCode,
  STATUTORY_SECTIONS,
} from '../src/types/inspection.js';
import {
  ManagerObservation,
  ManagerObservationCategory,
  ManagerMineProfile,
  ManagerMineDetail,
  ManagerOverview,
  RecurringPattern,
  RiskComponents,
  DataConfidence,
  CorrectiveTask,
  CorrectiveTaskPriority,
} from '../src/types/manager.js';
import {
  RISK_WEIGHTS,
  buildRiskBreakdown,
  calculateRiskScore,
  normalizeObservationBurdenScore,
  normalizeRecurringObservationScore,
  normalizeSeverityWeightedObservationScore,
} from './managerRisk.js';

interface DatabaseSchema {
  users: User[];
  mines: Mine[];
  districts: District[];
  shifts: Shift[];
  overman_reports: OvermanReportData[];
  overman_report_sections: any[];
  overman_report_entries: OvermanReportEntry[];
  manager_demo_observations?: ManagerObservation[];
  corrective_tasks?: CorrectiveTask[];
  inspections: Array<{
    id: string;
    inspection_number: string;
    sirdar_id: string;
    mine_id: string;
    district_id: string;
    shift_id: string;
    inspection_date: string;
    persons_under_charge: number;
    other_remarks: string;
    status: InspectionStatus;
    created_at: string;
    submitted_at: string | null;
    device_info?: string;
    latitude?: number | null;
    longitude?: number | null;
    location_accuracy?: number | null;
  }>;
  inspection_periods: Array<{
    id: string;
    inspection_id: string;
    period_number: 1 | 2 | 3;
    start_time: string;
    end_time: string;
  }>;
  observations: Array<{
    id: string;
    inspection_id: string;
    category: ObservationCategory;
    has_deficiency: boolean;
    location_text?: string;
    description?: string;
    remedial_action?: string;
    remarks?: string;
  }>;
  safety_instructions: Array<{
    id: string;
    inspection_id: string;
    instruction: string;
    persons_instructed: number;
  }>;
  persons_ordered_out: Array<{
    id: string;
    inspection_id: string;
    occurred: boolean;
    person_name?: string;
    assigned_place?: string;
    actual_place?: string;
    reason?: string;
    action_taken?: string;
  }>;
  inexperienced_persons: Array<{
    id: string;
    inspection_id: string;
    present: boolean;
    person_name?: string;
    supervisor_name?: string;
  }>;
  safety_materials: Array<{
    id: string;
    inspection_id: string;
    material_type: SafetyMaterialType;
    status: 'ADEQUATE' | 'DEFICIENT' | 'AVAILABLE' | 'NOT_APPLICABLE';
    description?: string;
    remedial_action?: string;
    remarks?: string;
  }>;
  support_withdrawals: Array<{
    id: string;
    inspection_id: string;
    place: string;
    cogs_sleepers_withdrawn: number;
    props_withdrawn: number;
    other_support: string;
    means_of_withdrawal: string;
  }>;
  dangerous_places: Array<{
    id: string;
    inspection_id: string;
    observed: boolean;
    location?: string;
    nature_of_danger?: string;
    action_taken?: string;
    reported_by_other: boolean;
    reporting_person_name?: string;
    other_report_details?: string;
    other_report_action?: string;
  }>;
  dangerous_operations: Array<{
    id: string;
    inspection_id: string;
    occurred: boolean;
    operation_nature?: string;
    location?: string;
    danger?: string;
    precautions_taken?: string;
  }>;
  inactive_places: Array<{
    id: string;
    inspection_id: string;
    fenced: boolean;
    location?: string;
    entrance_details?: string;
    action_taken?: string;
  }>;
  gas_observations: Array<{
    id: string;
    inspection_id: string;
    detected: boolean;
    location?: string;
    gas_percentage?: string;
    action_taken?: string;
    recorded_at: string;
  }>;
  water_observations: Array<{
    id: string;
    inspection_id: string;
    observed: boolean;
    location?: string;
    details?: string;
    action_taken?: string;
    recorded_at: string;
  }>;
  accidents: Array<{
    id: string;
    inspection_id: string;
    occurred: boolean;
    cause_details?: string;
    first_aid_given_by?: string;
    remarks?: string;
  }>;
  successor_conferences: Array<{
    id: string;
    inspection_id: string;
    conducted: boolean;
    information_conveyed?: string;
    conveyed_to_person?: string;
  }>;
  egress_records: Array<{
    id: string;
    inspection_id: string;
    travelled: boolean;
    travel_date?: string;
    remarks?: string;
  }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mine_governance_store.json');

function managerCategoryForObservation(category: string): ManagerObservationCategory {
  const map: Record<string, ManagerObservationCategory> = {
    VENTILATION: 'VENTILATION', STRATA: 'STRATA_SUPPORT', GOAF_EDGE: 'DANGER', FENCING: 'FENCING', SANITATION: 'SANITATION',
  };
  return map[category] || 'OTHER';
}

function managerCategoryForSection(code: OvermanSectionCode): ManagerObservationCategory {
  const map: Record<OvermanSectionCode, ManagerObservationCategory> = {
    A: 'SAFETY_MATERIAL', B: 'VENTILATION', C: 'OTHER', D: 'OTHER', E: 'DANGER', F: 'STRATA_SUPPORT', G: 'OTHER', H: 'OTHER',
    I: 'WATER', J: 'SAFETY_INFRINGEMENT', K: 'SAFETY_INFRINGEMENT', L: 'OTHER', M: 'ACCIDENT', N: 'OTHER',
  };
  return map[code];
}

class RelationalDatabase {
  private data: DatabaseSchema;
  private nextId = 1000;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return this.migrateDatabase(parsed);
      } catch (err) {
        console.error('Failed to parse database file, re-initializing with seed data.', err);
      }
    }

    const initial = this.generateSeedData();
    this.saveToDisk(initial);
    return initial;
  }

  private migrateDatabase(data: any): DatabaseSchema {
    let modified = false;

    // 1. Ensure Phase 2 demo accounts exist
    if (!data.users) data.users = [];
    if (!data.users.some((u: any) => u.employee_id === 'O001')) {
      data.users.push({
        id: 'usr_overman_01',
        name: 'Arjun Singh',
        employee_id: 'O001',
        role: 'OVERMAN',
        email: 'arjun.singh@ecl.coal.gov.in',
        phone: '+91 98310 98765',
        status: 'ACTIVE',
        created_at: '2026-01-15T00:00:00Z',
      });
      modified = true;
    }
    if (!data.users.some((u: any) => u.employee_id === 'M001')) {
      data.users.push({
        id: 'usr_manager_01',
        name: 'R. Mehta',
        employee_id: 'M001',
        role: 'MANAGER',
        email: 'r.mehta@ecl.coal.gov.in',
        phone: '+91 98310 99999',
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00Z',
      });
      modified = true;
    }

    // S002 is retained only for historical referential integrity; it is no longer an active demo login.
    const historicalS002 = data.users.find((u: any) => u.employee_id === 'S002');
    if (historicalS002 && historicalS002.status !== 'INACTIVE') {
      historicalS002.status = 'INACTIVE';
      modified = true;
    }

    // 2. Ensure Overman report collections exist
    if (!data.overman_reports) {
      data.overman_reports = [];
      modified = true;
    }
    if (!data.overman_report_sections) {
      data.overman_report_sections = [];
      modified = true;
    }
    if (!data.overman_report_entries) {
      data.overman_report_entries = [];
      modified = true;
    }

    for (const report of data.overman_reports) {
      if (!Array.isArray(report.selected_source_inspection_ids)) {
        report.selected_source_inspection_ids = Array.isArray(report.assembled_from_inspection_ids)
          ? [...report.assembled_from_inspection_ids]
          : [];
        modified = true;
      }
    }

    // Phase 3A: representative Manager demo data is kept separate from statutory records.
    if (!Array.isArray(data.manager_demo_observations)) {
      data.manager_demo_observations = this.generatePhase3ADemoObservations();
      modified = true;
    }
    if (!Array.isArray(data.corrective_tasks)) {
      data.corrective_tasks = [];
      modified = true;
    }
    for (const demoMine of this.getPhase3ADemoMines()) {
      if (!data.mines.some((m: any) => m.id === demoMine.id)) {
        data.mines.push(demoMine);
        modified = true;
      }
    }

    // 3. Ensure a second submitted Sirdar inspection exists on Panel 4 with gas & dangerous place
    const panel4Inspections = (data.inspections || []).filter(
      (i: any) => i.status === 'SUBMITTED' && i.district_id === 'dist_jhanjhra_d2'
    );
    if (panel4Inspections.length < 2) {
      this.seedSecondInspection(data);
      modified = true;
    }

    if (modified) {
      this.saveToDisk(data);
    }

    return data as DatabaseSchema;
  }

  private seedSecondInspection(data: any): void {
    const secondInspId = 'insp_hist_002';
    if (data.inspections.some((i: any) => i.id === secondInspId)) return;

    data.inspections.push({
      id: secondInspId,
      inspection_number: 'INS-2026-000102',
      sirdar_id: 'usr_sirdar_01',
      mine_id: 'mine_jhanjhra_01',
      district_id: 'dist_jhanjhra_d2',
      shift_id: 'shift_aft_02',
      inspection_date: '2026-09-26',
      persons_under_charge: 28,
      other_remarks: 'Inflammable gas detected and cleared by auxiliary ventilation. Conveyor roller replaced following workman report.',
      status: 'SUBMITTED',
      created_at: '2026-09-26T14:15:00Z',
      submitted_at: '2026-09-26T21:45:00Z',
      device_info: 'Rugged Underground Intrinsically Safe Sirdar Terminal v1.2',
      latitude: null,
      longitude: null,
      location_accuracy: null,
    });

    data.inspection_periods.push(
      { id: 'ip_04', inspection_id: secondInspId, period_number: 1, start_time: '14:30', end_time: '16:30' },
      { id: 'ip_05', inspection_id: secondInspId, period_number: 2, start_time: '17:00', end_time: '19:00' },
      { id: 'ip_06', inspection_id: secondInspId, period_number: 3, start_time: '20:00', end_time: '21:30' }
    );

    data.observations.push(
      {
        id: 'obs_06',
        inspection_id: secondInspId,
        category: 'VENTILATION',
        has_deficiency: true,
        location_text: 'Panel 4 Tail Gate Face Return',
        description: 'Air velocity reduced due to damaged brattice cloth near face crosscut.',
        remedial_action: 'Brattice screen repaired and air flow restored to statutory requirement.',
        remarks: 'Overman advised for secondary brattice check.',
      },
      { id: 'obs_07', inspection_id: secondInspId, category: 'STRATA', has_deficiency: false },
      { id: 'obs_08', inspection_id: secondInspId, category: 'GOAF_EDGE', has_deficiency: false },
      { id: 'obs_09', inspection_id: secondInspId, category: 'FENCING', has_deficiency: false },
      { id: 'obs_10', inspection_id: secondInspId, category: 'SANITATION', has_deficiency: false }
    );

    data.gas_observations.push({
      id: 'gas_02',
      inspection_id: secondInspId,
      detected: true,
      location: 'Panel 4 Working Face Left Flank',
      gas_percentage: '0.65%',
      action_taken: 'Auxiliary fan duct advanced to within 4.5m of face; gas flushed out and cleared within 15 mins.',
      recorded_at: '2026-09-26T17:45:00Z',
    });

    data.dangerous_places.push(
      {
        id: 'dp_02',
        inspection_id: secondInspId,
        observed: true,
        location: 'Panel 4 Return Airway Crosscut 12',
        nature_of_danger: 'Excessive dry coal dust deposit and loose side coal spalling near old barrier.',
        action_taken: 'Substantial danger fence and warning board erected; Overman notified for urgent stone dusting.',
        reported_by_other: false,
      },
      {
        id: 'dp_03',
        inspection_id: secondInspId,
        observed: false,
        reported_by_other: true,
        reporting_person_name: 'Bimal Murmu (Machine Operator)',
        other_report_details: 'Unusual grating noise from Level 4 conveyor belt head roller bearing.',
        other_report_action: 'Conveyor isolated, locked out, and bearing lubricated before restarting.',
      }
    );

    data.safety_instructions.push({
      id: 'si_02',
      inspection_id: secondInspId,
      instruction: 'Continuous methane monitoring required; no person permitted within 10m of return airway crosscut 12.',
      persons_instructed: 18,
    });

    data.persons_ordered_out.push({
      id: 'po_02',
      inspection_id: secondInspId,
      occurred: true,
      person_name: 'Sanjoy Roy (Driller)',
      assigned_place: 'Face 1',
      actual_place: 'Fenced-off inactive goaf edge',
      reason: 'Found beyond statutory danger fence without safety lamp check.',
      action_taken: 'Sent out of district immediately; disciplinary safety report submitted to Overman.',
    });

    data.safety_materials.push(
      { id: 'sm_06', inspection_id: secondInspId, material_type: 'TIMBER', status: 'ADEQUATE' },
      { id: 'sm_07', inspection_id: secondInspId, material_type: 'BUNTON', status: 'ADEQUATE' },
      { id: 'sm_08', inspection_id: secondInspId, material_type: 'LADDER', status: 'AVAILABLE' },
      { id: 'sm_09', inspection_id: secondInspId, material_type: 'CO_DETECTION', status: 'AVAILABLE' },
      { id: 'sm_10', inspection_id: secondInspId, material_type: 'OTHER', status: 'ADEQUATE' }
    );

    data.water_observations.push({
      id: 'wat_02',
      inspection_id: secondInspId,
      observed: false,
      recorded_at: '2026-09-26T20:00:00Z',
    });

    data.accidents.push({
      id: 'acc_02',
      inspection_id: secondInspId,
      occurred: false,
    });

    data.successor_conferences.push({
      id: 'sc_02',
      inspection_id: secondInspId,
      conducted: true,
      information_conveyed: 'Handed over district with Crosscut 12 fenced and brattice intact.',
      conveyed_to_person: 'Rajesh Kumar (Relieving Sirdar)',
    });

    data.egress_records.push({
      id: 'eg_02',
      inspection_id: secondInspId,
      travelled: false,
    });
  }

  private saveToDisk(data: DatabaseSchema): void {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  private generateId(prefix: string): string {
    this.nextId++;
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  private generateSeedData(): DatabaseSchema {
    const users: User[] = [
      {
        id: 'usr_sirdar_01',
        name: 'Rajesh Kumar',
        employee_id: 'S001',
        role: 'SIRDAR',
        email: 'rajesh.kumar@ecl.coal.gov.in',
        phone: '+91 98310 12345',
        status: 'ACTIVE',
        created_at: '2026-01-10T00:00:00Z',
      },
      {
        id: 'usr_overman_01',
        name: 'Arjun Singh',
        employee_id: 'O001',
        role: 'OVERMAN',
        email: 'arjun.singh@ecl.coal.gov.in',
        phone: '+91 98310 98765',
        status: 'ACTIVE',
        created_at: '2026-01-15T00:00:00Z',
      },
      {
        id: 'usr_manager_01',
        name: 'R. Mehta',
        employee_id: 'M001',
        role: 'MANAGER',
        email: 'r.mehta@ecl.coal.gov.in',
        phone: '+91 98310 99999',
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

    const mines: Mine[] = [
      {
        id: 'mine_jhanjhra_01',
        mine_name: 'Jhanjhra Underground Mine',
        subsidiary: 'Eastern Coalfields Limited (ECL)',
        mine_type: 'UNDERGROUND',
        location: 'Paschim Bardhaman, West Bengal',
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00Z',
      },
      ...this.getPhase3ADemoMines(),
    ];

    const districts: District[] = [
      {
        id: 'dist_jhanjhra_d2',
        mine_id: 'mine_jhanjhra_01',
        district_name: 'Panel 4',
        seam_name: 'Seam III',
        description: 'Underground Continuous Miner Panel & Depillaring District',
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'dist_jhanjhra_d1',
        mine_id: 'mine_jhanjhra_01',
        district_name: 'Panel 2',
        seam_name: 'Seam II',
        description: 'Underground Development District',
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

    const shifts: Shift[] = [
      {
        id: 'shift_morn_01',
        mine_id: 'mine_jhanjhra_01',
        shift_name: 'Morning Shift',
        start_time: '06:00',
        end_time: '14:00',
        status: 'ACTIVE',
      },
      {
        id: 'shift_aft_02',
        mine_id: 'mine_jhanjhra_01',
        shift_name: 'Afternoon Shift',
        start_time: '14:00',
        end_time: '22:00',
        status: 'ACTIVE',
      },
      {
        id: 'shift_ngt_03',
        mine_id: 'mine_jhanjhra_01',
        shift_name: 'Night Shift',
        start_time: '22:00',
        end_time: '06:00',
        status: 'ACTIVE',
      },
    ];

    // Seed previous statutory submitted inspection (yesterday) for Rajesh Kumar
    const sampleInspectionId = 'insp_hist_001';
    const sampleInspNumber = 'INS-2026-000101';
    const sampleDate = '2026-09-25';

    const schema: DatabaseSchema = {
      users,
      mines,
      districts,
      shifts,
      inspections: [
        {
          id: sampleInspectionId,
          inspection_number: sampleInspNumber,
          sirdar_id: 'usr_sirdar_01',
          mine_id: 'mine_jhanjhra_01',
          district_id: 'dist_jhanjhra_d2',
          shift_id: 'shift_morn_01',
          inspection_date: sampleDate,
          persons_under_charge: 24,
          other_remarks: 'District condition normal. Strata support reinforced at Gallery 7.',
          status: 'SUBMITTED',
          created_at: '2026-09-25T08:15:00Z',
          submitted_at: '2026-09-25T15:50:00Z',
          device_info: 'Rugged Underground Intrinsically Safe Sirdar Terminal v1.2',
          latitude: null,
          longitude: null,
          location_accuracy: null,
        },
      ],
      inspection_periods: [
        { id: 'ip_01', inspection_id: sampleInspectionId, period_number: 1, start_time: '08:30', end_time: '10:30' },
        { id: 'ip_02', inspection_id: sampleInspectionId, period_number: 2, start_time: '11:00', end_time: '13:00' },
        { id: 'ip_03', inspection_id: sampleInspectionId, period_number: 3, start_time: '14:00', end_time: '15:30' },
      ],
      observations: [
        {
          id: 'obs_01',
          inspection_id: sampleInspectionId,
          category: 'VENTILATION',
          has_deficiency: false,
        },
        {
          id: 'obs_02',
          inspection_id: sampleInspectionId,
          category: 'STRATA',
          has_deficiency: true,
          location_text: 'Panel 4 / Gallery 7 Junction',
          description: 'Spalling of roof coal and minor side slip detected along crosscut.',
          remedial_action: 'Erected 2 additional hydraulic props and timber cogs. Area secured and tested.',
          remarks: 'Overman informed for secondary roof bolting in next shift.',
        },
        {
          id: 'obs_03',
          inspection_id: sampleInspectionId,
          category: 'GOAF_EDGE',
          has_deficiency: false,
        },
        {
          id: 'obs_04',
          inspection_id: sampleInspectionId,
          category: 'FENCING',
          has_deficiency: false,
        },
        {
          id: 'obs_05',
          inspection_id: sampleInspectionId,
          category: 'SANITATION',
          has_deficiency: false,
        },
      ],
      safety_instructions: [
        {
          id: 'si_01',
          inspection_id: sampleInspectionId,
          instruction: 'Use designated travelling roadway only; avoid walking beneath unsupported roof in Panel 4.',
          persons_instructed: 12,
        },
      ],
      persons_ordered_out: [
        {
          id: 'po_01',
          inspection_id: sampleInspectionId,
          occurred: false,
        },
      ],
      inexperienced_persons: [
        {
          id: 'ip_seed_01',
          inspection_id: sampleInspectionId,
          present: false,
        },
      ],
      safety_materials: [
        {
          id: 'sm_01',
          inspection_id: sampleInspectionId,
          material_type: 'TIMBER',
          status: 'ADEQUATE',
        },
        {
          id: 'sm_02',
          inspection_id: sampleInspectionId,
          material_type: 'BUNTON',
          status: 'ADEQUATE',
        },
        {
          id: 'sm_03',
          inspection_id: sampleInspectionId,
          material_type: 'LADDER',
          status: 'DEFICIENT',
          remarks: 'One inspection ladder rung cracked at Level 3 roadway.',
          remedial_action: 'Withdrawn from service and replacement requisitioned from Pit Head Store.',
        },
        {
          id: 'sm_04',
          inspection_id: sampleInspectionId,
          material_type: 'CO_DETECTION',
          status: 'AVAILABLE',
        },
        {
          id: 'sm_05',
          inspection_id: sampleInspectionId,
          material_type: 'OTHER',
          status: 'ADEQUATE',
          description: 'Flocked safety helmets and cap lamps in serviceable condition.',
        },
      ],
      support_withdrawals: [],
      dangerous_places: [
        {
          id: 'dp_01',
          inspection_id: sampleInspectionId,
          observed: false,
          reported_by_other: false,
        },
      ],
      dangerous_operations: [
        {
          id: 'do_01',
          inspection_id: sampleInspectionId,
          occurred: false,
        },
      ],
      inactive_places: [
        {
          id: 'inact_01',
          inspection_id: sampleInspectionId,
          fenced: false,
        },
      ],
      gas_observations: [
        {
          id: 'gas_01',
          inspection_id: sampleInspectionId,
          detected: false,
          recorded_at: '2026-09-25T15:45:00Z',
        },
      ],
      water_observations: [
        {
          id: 'wat_01',
          inspection_id: sampleInspectionId,
          observed: true,
          location: 'Gallery 7 Dip Side',
          details: 'Moderate roof dripping and floor seepage observed near face.',
          action_taken: 'Main drain cleared and auxiliary face pump initiated. Water level kept under 5 cm.',
          recorded_at: '2026-09-25T13:30:00Z',
        },
      ],
      accidents: [
        {
          id: 'acc_01',
          inspection_id: sampleInspectionId,
          occurred: false,
        },
      ],
      successor_conferences: [
        {
          id: 'sc_01',
          inspection_id: sampleInspectionId,
          conducted: true,
          information_conveyed: 'Briefed on strata support at Panel 4 / Gallery 7 and pump running status.',
          conveyed_to_person: 'S. K. Mukherjee (Afternoon Shift Sirdar)',
        },
      ],
      egress_records: [
        {
          id: 'eg_01',
          inspection_id: sampleInspectionId,
          travelled: false,
        },
      ],
      overman_reports: [],
      overman_report_sections: [],
      overman_report_entries: [],
      manager_demo_observations: this.generatePhase3ADemoObservations(),
      corrective_tasks: [],
    };

    return schema;
  }

  // --- QUERY METHODS ---

  public authenticate(employeeId: string): User | null {
    const user = this.data.users.find(
      (u) => u.employee_id.toUpperCase() === employeeId.trim().toUpperCase() && u.status === 'ACTIVE'
    );
    return user || null;
  }

  public getUserById(userId: string): User | null {
    return this.data.users.find((u) => u.id === userId) || null;
  }

  public getSirdarAssignment(userId: string): { user: User; mine: Mine; district: District; available_shifts: Shift[] } | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    // Sirdar S001 is assigned to Panel 4 / Seam III in Jhanjhra Mine.
    // Historical inactive S002 records retain their original Panel 2 assignment.
    const mine = this.data.mines[0];
    const district = user.employee_id === 'S002' ? this.data.districts[1] : this.data.districts[0];
    const available_shifts = this.data.shifts.filter((s) => s.mine_id === mine.id);

    return { user, mine, district, available_shifts };
  }

  public getOvermanAssignment(userId: string): OvermanAssignment | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    // Overman O001 is assigned to Jhanjhra Mine, Panel 4 (Seam III)
    const mine = this.data.mines[0];
    const district = this.data.districts.find((d) => d.district_name === 'Panel 4') || this.data.districts[0];
    const available_shifts = this.data.shifts.filter((s) => s.mine_id === mine.id);
    const current_shift = available_shifts[0]; // Morning Shift (06:00 - 14:00)

    return { user, mine, district, available_shifts, current_shift };
  }

  public getReceivedSirdarInspections(overmanId: string): InspectionSummary[] {
    const assignment = this.getOvermanAssignment(overmanId);
    if (!assignment) return [];

    // Fetch SUBMITTED inspections only for the Overman's assigned district
    // Never fetch DRAFT records!
    const submitted = (this.data.inspections || [])
      .filter((i) => i.status === 'SUBMITTED' && i.mine_id === assignment.mine.id && i.district_id === assignment.district.id)
      .sort((a, b) => new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime());

    return submitted.map((insp) => {
      const user = this.data.users.find((u) => u.id === insp.sirdar_id);
      const mine = this.data.mines.find((m) => m.id === insp.mine_id);
      const district = this.data.districts.find((d) => d.id === insp.district_id);
      const shift = this.data.shifts.find((s) => s.id === insp.shift_id);

      const periodCount = (this.data.inspection_periods || []).filter((p) => p.inspection_id === insp.id).length;
      const deficiencyCount = (this.data.observations || []).filter(
        (o) => o.inspection_id === insp.id && o.has_deficiency
      ).length;
      const gas = (this.data.gas_observations || []).find((g) => g.inspection_id === insp.id);
      const water = (this.data.water_observations || []).find((w) => w.inspection_id === insp.id);
      const accident = (this.data.accidents || []).find((a) => a.inspection_id === insp.id);

      return {
        id: insp.id,
        inspection_number: insp.inspection_number,
        sirdar_name: user?.name || 'Sirdar In-Charge',
        sirdar_employee_id: user?.employee_id || 'S001',
        mine_name: mine?.mine_name || 'Jhanjhra Underground Mine',
        district_name: district?.district_name || 'Panel 4',
        seam_name: district?.seam_name || 'Seam III',
        shift_name: shift?.shift_name || 'Morning Shift',
        shift_hours: shift ? `${shift.start_time} – ${shift.end_time}` : '06:00 – 14:00',
        inspection_date: insp.inspection_date,
        persons_under_charge: insp.persons_under_charge,
        period_count: periodCount,
        deficiency_count: deficiencyCount,
        gas_detected: gas ? gas.detected : false,
        water_seepage: water ? water.observed : false,
        accident_occurred: accident ? accident.occurred : false,
        status: insp.status,
        created_at: insp.created_at,
        submitted_at: insp.submitted_at,
      };
    });
  }

  public getOvermanReports(overmanId?: string): OvermanReportData[] {
    const list = this.data.overman_reports || [];
    if (overmanId) {
      return list
        .filter((r) => r.overman_id === overmanId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOvermanReportById(id: string): OvermanReportData | null {
    return (this.data.overman_reports || []).find((r) => r.id === id) || null;
  }

  public createOrGetOvermanDraft(
    overmanId: string,
    options?: { report_date?: string; shift_id?: string; district_id?: string }
  ): OvermanReportData {
    const assignment = this.getOvermanAssignment(overmanId);
    if (!assignment) throw new Error('Overman assignment not found.');

    const todayStr = options?.report_date || new Date().toISOString().split('T')[0];
    const shiftId = options?.shift_id || assignment.current_shift.id;
    const districtId = options?.district_id || assignment.district.id;

    // Check if an existing unsubmitted draft exists for this Overman / date / shift
    const existing = (this.data.overman_reports || []).find(
      (r) => r.overman_id === overmanId && r.report_date === todayStr && r.shift_id === shiftId && r.status !== 'SUBMITTED'
    );
    if (existing) {
      return existing;
    }

    const reportId = this.generateId('ovr_rep');
    const count = (this.data.overman_reports || []).length + 1;
    const reportNumber = `OVR-2026-${String(count).padStart(6, '0')}`;

    const sections: Record<OvermanSectionCode, OvermanReportSection> = {} as any;
    for (const spec of STATUTORY_SECTIONS) {
      sections[spec.code] = {
        code: spec.code,
        title: spec.title,
        statutory_clause: spec.statutory_clause,
        population_status: spec.is_overman_input_required ? 'OVERMAN_REQUIRED' : 'PENDING',
        is_overman_input_required: spec.is_overman_input_required,
        entries: [],
        overman_notes: '',
        structured_data: {},
      };
    }

    const shift = this.data.shifts.find((s) => s.id === shiftId) || assignment.current_shift;
    const district = this.data.districts.find((d) => d.id === districtId) || assignment.district;

    const newReport: OvermanReportData = {
      id: reportId,
      report_number: reportNumber,
      overman_id: overmanId,
      overman_name: assignment.user.name,
      overman_employee_id: assignment.user.employee_id,
      mine_id: assignment.mine.id,
      mine_name: assignment.mine.mine_name,
      district_id: district.id,
      district_name: district.district_name,
      seam_name: district.seam_name,
      shift_id: shift.id,
      shift_name: shift.shift_name,
      shift_hours: `${shift.start_time} – ${shift.end_time}`,
      report_date: todayStr,
      parts_of_mine_inspected: `${district.district_name} Working Faces, Return Roadways & Haulage Track`,
      status: 'DRAFT',
      assembled_from_inspection_ids: [],
      selected_source_inspection_ids: [],
      sections,
      created_at: new Date().toISOString(),
    };

    if (!this.data.overman_reports) {
      this.data.overman_reports = [];
    }
    this.data.overman_reports.push(newReport);
    this.saveToDisk(this.data);

    // Do not silently include every available Sirdar record.
    // The Overman explicitly selects source inspections before assembly.
    return newReport;
  }

  public assembleOvermanReport(reportId: string, overmanId: string): OvermanReportData {
    const report = (this.data.overman_reports || []).find((r) => r.id === reportId);
    if (!report) {
      throw new Error('Overman report not found.');
    }
    if (report.overman_id !== overmanId) {
      throw new Error('AUTH_ERROR: You can only assemble your own Overman reports.');
    }
    if (report.status === 'SUBMITTED') {
      throw new Error('IMMUTABLE_ERROR: Submitted Overman report is immutable and cannot be re-assembled.');
    }

    const assignment = this.getOvermanAssignment(overmanId);
    if (!assignment) {
      throw new Error('Overman assignment not found.');
    }

    // 1. Assemble only the source records explicitly selected by the Overman.
    // Never fetch DRAFT inspections and never trust client-side scope alone.
    const selectedIds = Array.isArray(report.selected_source_inspection_ids)
      ? Array.from(new Set(report.selected_source_inspection_ids))
      : [];
    const selectedIdSet = new Set(selectedIds);
    const submittedInspections = (this.data.inspections || [])
      .filter((i) => selectedIdSet.has(i.id))
      .sort((a, b) => new Date(a.submitted_at || a.created_at).getTime() - new Date(b.submitted_at || b.created_at).getTime());

    const invalidSelection = submittedInspections.length !== selectedIds.length || submittedInspections.some(
      (i) => i.status !== 'SUBMITTED' || i.mine_id !== assignment.mine.id || i.district_id !== assignment.district.id
    );
    if (invalidSelection) {
      throw new Error('VALIDATION_ERROR: One or more selected Sirdar inspection records are not submitted or are outside your authorized mine/district scope.');
    }

    // 2. Initialize or preserve sections
    const existingSections = report.sections || {};
    const newSections: Record<OvermanSectionCode, OvermanReportSection> = {} as any;

    for (const spec of STATUTORY_SECTIONS) {
      const existing = existingSections[spec.code];
      newSections[spec.code] = {
        code: spec.code,
        title: spec.title,
        statutory_clause: spec.statutory_clause,
        population_status: spec.is_overman_input_required
          ? existing?.structured_data && Object.keys(existing.structured_data).length > 0
            ? 'COMPLETED'
            : 'OVERMAN_REQUIRED'
          : 'PENDING',
        is_overman_input_required: spec.is_overman_input_required,
        // Preserve any existing Overman-entered custom entries!
        entries: (existing?.entries || []).filter((e) => e.entry_type === 'OVERMAN_INPUT'),
        overman_notes: existing?.overman_notes || '',
        structured_data: existing?.structured_data || {},
      };
    }

    const processedInspectionIds: string[] = [];

    // 3. Deterministically map each submitted Sirdar inspection
    for (const insp of submittedInspections) {
      processedInspectionIds.push(insp.id);
      const sirdar = this.data.users.find((u) => u.id === insp.sirdar_id);
      const sirdarName = sirdar?.name || 'Sirdar In-Charge';
      const sirdarEmpId = sirdar?.employee_id || 'S001';
      const sourceDate = insp.inspection_date;
      const sourceTime = insp.submitted_at
        ? new Date(insp.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'
        : undefined;

      // Rule 1: Sirdar safety-material deficiency -> Overman Section A (Safety Materials)
      const defMaterials = (this.data.safety_materials || []).filter(
        (sm) => sm.inspection_id === insp.id && sm.status === 'DEFICIENT'
      );
      for (const sm of defMaterials) {
        newSections['A'].entries.push({
          id: this.generateId('ent_a'),
          section_code: 'A',
          entry_type: 'AUTO',
          title: `Deficiency in ${sm.material_type}`,
          location: sm.description ? `${report.district_name} (${sm.description})` : `${report.district_name} Safety Supply Point`,
          details: sm.remarks || `Material ${sm.material_type} is deficient. ${sm.description || ''}`,
          action_taken: sm.remedial_action || 'Requisition submitted to colliery store',
          source_inspection_id: insp.id,
          source_inspection_number: insp.inspection_number,
          source_observation_id: sm.id,
          sirdar_name: sirdarName,
          sirdar_employee_id: sirdarEmpId,
          source_date: sourceDate,
          source_time: sourceTime,
          created_at: new Date().toISOString(),
        });
      }

      // Rule 2: Sirdar ventilation deficiency -> Overman Section B (Ventilation)
      const ventObs = (this.data.observations || []).filter(
        (o) => o.inspection_id === insp.id && o.category === 'VENTILATION' && o.has_deficiency
      );
      for (const vo of ventObs) {
        newSections['B'].entries.push({
          id: this.generateId('ent_b_vent'),
          section_code: 'B',
          entry_type: 'AUTO',
          title: 'Ventilation Adequacy Deficiency',
          location: vo.location_text || `${report.district_name} Return Airway / Working Face`,
          details: vo.description || 'Ventilation inadequacy observed by Sirdar',
          action_taken: vo.remedial_action || 'Air regulator / screen adjusted',
          source_inspection_id: insp.id,
          source_inspection_number: insp.inspection_number,
          source_observation_id: vo.id,
          sirdar_name: sirdarName,
          sirdar_employee_id: sirdarEmpId,
          source_date: sourceDate,
          source_time: sourceTime,
          created_at: new Date().toISOString(),
        });
      }

      // Rule 3: Sirdar inflammable gas observation -> Overman Section B (Ventilation)
      const gasObs = (this.data.gas_observations || []).filter(
        (g) => g.inspection_id === insp.id && (g.detected || (g.gas_percentage && g.gas_percentage !== '0.0%' && g.gas_percentage !== '0%'))
      );
      for (const go of gasObs) {
        newSections['B'].entries.push({
          id: this.generateId('ent_b_gas'),
          section_code: 'B',
          entry_type: 'AUTO',
          title: `Inflammable Gas Detected (${go.gas_percentage || 'CH₄ detected'})`,
          location: go.location || `${report.district_name} Working Face`,
          details: `Gas percentage observed: ${go.gas_percentage || 'Present'}. Sirdar gas testing conducted.`,
          action_taken: go.action_taken || 'Auxiliary ventilation boosted and area cleared',
          source_inspection_id: insp.id,
          source_inspection_number: insp.inspection_number,
          source_observation_id: go.id,
          sirdar_name: sirdarName,
          sirdar_employee_id: sirdarEmpId,
          source_date: sourceDate,
          source_time: sourceTime,
          created_at: new Date().toISOString(),
        });
      }

      // Rule 4 & 5: Sirdar dangerous places observed or reported -> Overman Section E (Danger)
      const dPlaces = (this.data.dangerous_places || []).filter((dp) => dp.inspection_id === insp.id);
      for (const dp of dPlaces) {
        if (dp.observed) {
          newSections['E'].entries.push({
            id: this.generateId('ent_e_obs'),
            section_code: 'E',
            entry_type: 'AUTO',
            title: 'Dangerous Place Observed',
            location: dp.location || `${report.district_name} Workings`,
            details: dp.nature_of_danger || 'Unsafe condition detected during shift inspection',
            action_taken: dp.action_taken || 'Substantial danger fence and board erected',
            source_inspection_id: insp.id,
            source_inspection_number: insp.inspection_number,
            source_observation_id: dp.id,
            sirdar_name: sirdarName,
            sirdar_employee_id: sirdarEmpId,
            source_date: sourceDate,
            source_time: sourceTime,
            created_at: new Date().toISOString(),
          });
        }
        if (dp.reported_by_other) {
          newSections['E'].entries.push({
            id: this.generateId('ent_e_rep'),
            section_code: 'E',
            entry_type: 'AUTO',
            title: `Danger Reported by ${dp.reporting_person_name || 'Workman'}`,
            location: dp.location || `${report.district_name} Section (Reported to Sirdar)`,
            details: dp.other_report_details || 'Danger reported by person',
            action_taken: dp.other_report_action || 'Inspected and secured immediately',
            source_inspection_id: insp.id,
            source_inspection_number: insp.inspection_number,
            source_observation_id: dp.id,
            sirdar_name: sirdarName,
            sirdar_employee_id: sirdarEmpId,
            source_date: sourceDate,
            source_time: sourceTime,
            created_at: new Date().toISOString(),
          });
        }
      }

      // Rule 6: Sirdar roof/support deficiency -> Overman Section F (Support Strata)
      const strataObs = (this.data.observations || []).filter(
        (o) => o.inspection_id === insp.id && o.category === 'STRATA' && o.has_deficiency
      );
      for (const so of strataObs) {
        newSections['F'].entries.push({
          id: this.generateId('ent_f'),
          section_code: 'F',
          entry_type: 'AUTO',
          title: 'Roof / Side Strata Deficiency',
          location: so.location_text || `${report.district_name} Roadway / Face`,
          details: so.description || 'Roof/side spalling observed',
          action_taken: so.remedial_action || 'Additional timber cogs and hydraulic props erected',
          source_inspection_id: insp.id,
          source_inspection_number: insp.inspection_number,
          source_observation_id: so.id,
          sirdar_name: sirdarName,
          sirdar_employee_id: sirdarEmpId,
          source_date: sourceDate,
          source_time: sourceTime,
          created_at: new Date().toISOString(),
        });
      }

      // Rule 7: Sirdar abnormal water seepage -> Overman Section I (Abnormal Water Seepage)
      const waterObs = (this.data.water_observations || []).filter(
        (w) => w.inspection_id === insp.id && w.observed
      );
      for (const wo of waterObs) {
        newSections['I'].entries.push({
          id: this.generateId('ent_i'),
          section_code: 'I',
          entry_type: 'AUTO',
          title: 'Abnormal Water Seepage / Accumulation',
          location: wo.location || `${report.district_name} Dip / Incline`,
          details: wo.details || 'Water seepage detected',
          action_taken: wo.action_taken || 'Face pump operated and channels cleared',
          source_inspection_id: insp.id,
          source_inspection_number: insp.inspection_number,
          source_observation_id: wo.id,
          sirdar_name: sirdarName,
          sirdar_employee_id: sirdarEmpId,
          source_date: sourceDate,
          source_time: sourceTime,
          created_at: new Date().toISOString(),
        });
      }

      // Rule 8: Sirdar person ordered out -> Overman Section J (Persons Sent Out)
      const poObs = (this.data.persons_ordered_out || []).filter(
        (p) => p.inspection_id === insp.id && p.occurred
      );
      for (const po of poObs) {
        newSections['J'].entries.push({
          id: this.generateId('ent_j'),
          section_code: 'J',
          entry_type: 'AUTO',
          title: `Person Sent Out: ${po.person_name || 'Workman'}`,
          location: po.actual_place || `${report.district_name} Working Area`,
          details: `Assigned: ${po.assigned_place || 'Designated Face'}. Reason: ${po.reason || 'Safety breach'}.`,
          action_taken: po.action_taken || 'Ordered out of district',
          source_inspection_id: insp.id,
          source_inspection_number: insp.inspection_number,
          source_observation_id: po.id,
          sirdar_name: sirdarName,
          sirdar_employee_id: sirdarEmpId,
          source_date: sourceDate,
          source_time: sourceTime,
          created_at: new Date().toISOString(),
        });
      }

      // Rule 9: Sirdar safety instructions -> Overman Section K (Safety Directions)
      const sInst = (this.data.safety_instructions || []).filter((s) => s.inspection_id === insp.id);
      for (const si of sInst) {
        newSections['K'].entries.push({
          id: this.generateId('ent_k'),
          section_code: 'K',
          entry_type: 'AUTO',
          title: 'Sirdar Safety Direction',
          location: `${report.district_name} Travelling & Working Roadways`,
          details: `${si.instruction} (${si.persons_instructed} workmen instructed)`,
          action_taken: 'Communicated and acknowledged on site',
          source_inspection_id: insp.id,
          source_inspection_number: insp.inspection_number,
          source_observation_id: si.id,
          sirdar_name: sirdarName,
          sirdar_employee_id: sirdarEmpId,
          source_date: sourceDate,
          source_time: sourceTime,
          created_at: new Date().toISOString(),
        });
      }

      // Rule 10: Sirdar accident / first aid -> Overman Section M (Accident)
      const accObs = (this.data.accidents || []).filter((a) => a.inspection_id === insp.id && a.occurred);
      for (const ao of accObs) {
        newSections['M'].entries.push({
          id: this.generateId('ent_m'),
          section_code: 'M',
          entry_type: 'AUTO',
          title: 'Personal Injury / Accident',
          location: `${report.district_name} Working Places`,
          details: ao.cause_details || 'Accident occurred during shift',
          action_taken: `First aid administered by: ${ao.first_aid_given_by || 'First Aider'}. ${ao.remarks || ''}`,
          source_inspection_id: insp.id,
          source_inspection_number: insp.inspection_number,
          source_observation_id: ao.id,
          sirdar_name: sirdarName,
          sirdar_employee_id: sirdarEmpId,
          source_date: sourceDate,
          source_time: sourceTime,
          created_at: new Date().toISOString(),
        });
      }

      // Rule 11: Sirdar other remarks -> Overman Section N (Other Remarks)
      if (insp.other_remarks && insp.other_remarks.trim().length > 0) {
        newSections['N'].entries.push({
          id: this.generateId('ent_n_sirdar'),
          section_code: 'N',
          entry_type: 'AUTO',
          title: `Sirdar Shift Remarks (${insp.inspection_number})`,
          location: report.district_name,
          details: insp.other_remarks,
          action_taken: 'Incorporated into Overman composite review',
          source_inspection_id: insp.id,
          source_inspection_number: insp.inspection_number,
          sirdar_name: sirdarName,
          sirdar_employee_id: sirdarEmpId,
          source_date: sourceDate,
          source_time: sourceTime,
          created_at: new Date().toISOString(),
        });
      }
    }

    // 4. Update population status for each section
    for (const spec of STATUTORY_SECTIONS) {
      const sec = newSections[spec.code];
      if (spec.is_overman_input_required) {
        const hasStructured = sec.structured_data && Object.keys(sec.structured_data).length > 0;
        const hasNotes = sec.overman_notes && sec.overman_notes.trim().length > 0;
        sec.population_status = hasStructured || hasNotes ? 'COMPLETED' : 'OVERMAN_REQUIRED';
      } else {
        if (sec.entries.length > 0) {
          sec.population_status = 'AUTO_POPULATED';
        } else {
          sec.population_status = 'COMPLETED'; // Nil observation from Sirdars across shift
        }
      }
    }

    report.sections = newSections;
    report.assembled_from_inspection_ids = Array.from(new Set(processedInspectionIds));
    report.selected_source_inspection_ids = Array.from(new Set(selectedIds));
    report.updated_at = new Date().toISOString();

    // Check if ready for review
    const requiredSectionsComplete = STATUTORY_SECTIONS.filter((s) => s.is_overman_input_required).every(
      (s) => newSections[s.code].population_status === 'COMPLETED'
    );
    if (requiredSectionsComplete) {
      report.status = 'READY_FOR_REVIEW';
    } else {
      report.status = 'DRAFT';
    }

    this.saveToDisk(this.data);
    return report;
  }

  public updateOvermanReport(
    reportId: string,
    overmanId: string,
    updates: Partial<OvermanReportData>
  ): OvermanReportData {
    const report = (this.data.overman_reports || []).find((r) => r.id === reportId);
    if (!report) throw new Error('Overman report not found.');
    if (report.overman_id !== overmanId) {
      throw new Error('AUTH_ERROR: You can only update your own Overman reports.');
    }
    if (report.status === 'SUBMITTED') {
      throw new Error('IMMUTABLE_ERROR: Submitted Overman report is immutable and cannot be modified.');
    }

    if (updates.selected_source_inspection_ids !== undefined) {
      const selectedIds = Array.from(new Set(updates.selected_source_inspection_ids || []));
      const assignment = this.getOvermanAssignment(overmanId);
      if (!assignment) throw new Error('AUTH_ERROR: Overman assignment not found.');
      const selectedInspections = (this.data.inspections || []).filter((i) => selectedIds.includes(i.id));
      if (selectedInspections.length !== selectedIds.length) {
        throw new Error('VALIDATION_ERROR: One or more selected Sirdar inspection records do not exist.');
      }
      const unauthorized = selectedInspections.some(
        (i) => i.status !== 'SUBMITTED' || i.mine_id !== assignment.mine.id || i.district_id !== assignment.district.id
      );
      if (unauthorized) {
        throw new Error('AUTH_ERROR: One or more selected Sirdar inspection records are outside your authorized mine/district scope or are not submitted.');
      }
      report.selected_source_inspection_ids = selectedIds;
    }

    if (updates.parts_of_mine_inspected !== undefined) {
      report.parts_of_mine_inspected = updates.parts_of_mine_inspected;
    }

    if (updates.sections) {
      for (const [code, secUpdate] of Object.entries(updates.sections)) {
        const targetSec = report.sections[code as OvermanSectionCode];
        if (targetSec) {
          if (secUpdate.overman_notes !== undefined) {
            targetSec.overman_notes = secUpdate.overman_notes;
          }
          if (secUpdate.structured_data !== undefined) {
            targetSec.structured_data = { ...targetSec.structured_data, ...secUpdate.structured_data };
          }
          if (secUpdate.entries !== undefined) {
            const autoEntries = targetSec.entries.filter((e) => e.entry_type === 'AUTO');
            const customEntries = secUpdate.entries.filter((e) => e.entry_type === 'OVERMAN_INPUT');
            targetSec.entries = [...autoEntries, ...customEntries];
          }
          if (targetSec.is_overman_input_required) {
            const hasData =
              (targetSec.structured_data && Object.keys(targetSec.structured_data).length > 0) ||
              (targetSec.overman_notes && targetSec.overman_notes.trim().length > 0);
            targetSec.population_status = hasData ? 'COMPLETED' : 'OVERMAN_REQUIRED';
          }
        }
      }
    }

    const requiredSectionsComplete = STATUTORY_SECTIONS.filter((s) => s.is_overman_input_required).every(
      (s) => report.sections[s.code]?.population_status === 'COMPLETED'
    );
    if (requiredSectionsComplete) {
      report.status = 'READY_FOR_REVIEW';
    }

    report.updated_at = new Date().toISOString();
    this.saveToDisk(this.data);
    return report;
  }

  public submitOvermanReport(
    reportId: string,
    overmanId: string,
    updates?: Partial<OvermanReportData>
  ): OvermanReportData {
    if (updates) {
      this.updateOvermanReport(reportId, overmanId, updates);
    }
    const report = (this.data.overman_reports || []).find((r) => r.id === reportId);
    if (!report) throw new Error('Overman report not found.');
    if (report.overman_id !== overmanId) {
      throw new Error('AUTH_ERROR: You can only submit your own Overman reports.');
    }
    if (report.status === 'SUBMITTED') {
      throw new Error('IMMUTABLE_ERROR: Report has already been submitted and sealed.');
    }

    report.status = 'SUBMITTED';
    report.submitted_at = new Date().toISOString();
    report.updated_at = report.submitted_at;

    this.saveToDisk(this.data);
    return report;
  }

  public getShifts(): Shift[] {
    return [...this.data.shifts];
  }

  private getPhase3ADemoMines(): Mine[] {
    return [
      { id: 'mine_representative_b', mine_name: 'Representative Mine B', subsidiary: 'Representative Demo Dataset', mine_type: 'UNDERGROUND', location: 'Representative Underground Area B', status: 'ACTIVE', created_at: '2026-09-01T00:00:00Z' },
      { id: 'mine_representative_c', mine_name: 'Representative Mine C', subsidiary: 'Representative Demo Dataset', mine_type: 'UNDERGROUND', location: 'Representative Underground Area C', status: 'ACTIVE', created_at: '2026-09-01T00:00:00Z' },
    ];
  }

  private generatePhase3ADemoObservations(): ManagerObservation[] {
    const make = (mineId: string, mineName: string, category: ManagerObservationCategory, count: number, recordCount: number, severity: 'LOW' | 'MEDIUM' | 'HIGH', title: string, description: string) => {
      const weight = severity === 'HIGH' ? 0.75 : severity === 'MEDIUM' ? 0.5 : 0.25;
      return Array.from({ length: count }, (_, index): ManagerObservation => ({
        id: `mgr_demo_${mineId}_${category}_${index + 1}`,
        mine_id: mineId, mine_name: mineName, category, title, description,
        observed_at: `2026-09-${String(18 + index).padStart(2, '0')}T${String(8 + (index % 4) * 3).padStart(2, '0')}:00:00Z`,
        source_type: 'SIRDAR_INSPECTION', source_id: `demo_${mineId}_${(index % recordCount) + 1}`,
        source_number: `DEMO-${mineId.endsWith('b') ? 'B' : 'C'}-${String(index + 1).padStart(3, '0')}`,
        location: `Representative ${mineId.endsWith('b') ? 'B' : 'C'} working district`,
        action_recorded: 'Recorded for management review.', severity, severity_weight: weight,
        manager_action_status: 'NOT_CREATED', demo_seeded: true,
      }));
    };
    return [
      ...make('mine_representative_b', 'Representative Mine B', 'VENTILATION', 6, 10, 'HIGH', 'Ventilation observation', 'Repeated ventilation-related observation in representative demo records.'),
      ...make('mine_representative_b', 'Representative Mine B', 'STRATA_SUPPORT', 3, 10, 'MEDIUM', 'Strata/support observation', 'Support-related observation in representative demo records.'),
      ...make('mine_representative_b', 'Representative Mine B', 'WATER', 2, 10, 'MEDIUM', 'Water seepage observation', 'Water seepage in representative demo records.'),
      ...make('mine_representative_b', 'Representative Mine B', 'DANGER', 2, 10, 'HIGH', 'Danger observation', 'Dangerous condition in representative demo records.'),
      ...make('mine_representative_c', 'Representative Mine C', 'VENTILATION', 1, 10, 'MEDIUM', 'Ventilation observation', 'Occasional ventilation observation in representative demo records.'),
      ...make('mine_representative_c', 'Representative Mine C', 'STRATA_SUPPORT', 1, 10, 'MEDIUM', 'Strata/support observation', 'Single support-related observation in representative demo records.'),
      ...make('mine_representative_c', 'Representative Mine C', 'WATER', 1, 10, 'MEDIUM', 'Water seepage observation', 'Single water observation in representative demo records.'),
    ];
  }

  private managerSeverity(category: ManagerObservationCategory): { severity: 'LOW' | 'MEDIUM' | 'HIGH'; weight: number } {
    // Transparent MVP analytic heuristic only; this is not a DGMS severity classification.
    if (['ACCIDENT', 'GAS', 'DANGER', 'DANGEROUS_OPERATION'].includes(category)) return { severity: 'HIGH', weight: 0.75 };
    if (['VENTILATION', 'STRATA_SUPPORT', 'WATER', 'SAFETY_MATERIAL', 'SAFETY_INFRINGEMENT'].includes(category)) return { severity: 'MEDIUM', weight: 0.5 };
    return { severity: 'LOW', weight: 0.25 };
  }

  private normalizeManagerObservation(params: Omit<ManagerObservation, 'severity' | 'severity_weight' | 'manager_action_status' | 'mine_name'> & { mine_name: string }): ManagerObservation {
    const severity = this.managerSeverity(params.category);
    return { ...params, severity: severity.severity, severity_weight: severity.weight, manager_action_status: 'NOT_CREATED' };
  }

  private getManagerObservationsForMine(mineId: string): ManagerObservation[] {
    const mine = this.data.mines.find((m) => m.id === mineId);
    if (!mine) return [];
    const observations: ManagerObservation[] = [];
    const inspections = (this.data.inspections || []).filter((i) => i.status === 'SUBMITTED' && i.mine_id === mineId);
    for (const insp of inspections) {
      const observedAt = insp.submitted_at || `${insp.inspection_date}T12:00:00Z`;
      const add = (category: ManagerObservationCategory, sourceId: string, sourceNumber: string, title: string, description: string, location?: string, actionRecorded?: string) => {
        observations.push(this.normalizeManagerObservation({
          id: `mgr_sirdar_${sourceId}_${category}`, mine_id: mineId, mine_name: mine.mine_name, category, title, description,
          observed_at: observedAt, source_type: 'SIRDAR_INSPECTION', source_id: insp.id, source_number: sourceNumber,
          source_inspection_id: insp.id, location, action_recorded: actionRecorded,
        }));
      };
      for (const o of (this.data.observations || []).filter((x) => x.inspection_id === insp.id && x.has_deficiency)) {
        const category = managerCategoryForObservation(o.category);
        add(category, o.id, insp.inspection_number, `${category.replace(/_/g, ' ')} deficiency`, o.description || 'Deficiency recorded during Sirdar inspection.', o.location_text, o.remedial_action);
      }
      for (const x of (this.data.safety_materials || []).filter((x) => x.inspection_id === insp.id && x.status === 'DEFICIENT')) add('SAFETY_MATERIAL', x.id, insp.inspection_number, 'Safety material deficiency', x.description || `${x.material_type} recorded as deficient.`, undefined, x.remedial_action);
      for (const x of (this.data.dangerous_places || []).filter((x) => x.inspection_id === insp.id && (x.observed || x.reported_by_other))) add('DANGER', x.id, insp.inspection_number, x.observed ? 'Dangerous place observed' : 'Danger reported by another person', x.nature_of_danger || x.other_report_details || 'Dangerous condition recorded.', x.location, x.action_taken || x.other_report_action);
      for (const x of (this.data.dangerous_operations || []).filter((x) => x.inspection_id === insp.id && x.occurred)) add('DANGEROUS_OPERATION', x.id, insp.inspection_number, 'Dangerous operation', x.danger || x.operation_nature || 'Dangerous operation recorded.', x.location, x.precautions_taken);
      for (const x of (this.data.gas_observations || []).filter((x) => x.inspection_id === insp.id && (x.detected || !!x.gas_percentage))) add('GAS', x.id, insp.inspection_number, 'Gas observation', `Gas percentage observed: ${x.gas_percentage || 'present'}.`, x.location, x.action_taken);
      for (const x of (this.data.water_observations || []).filter((x) => x.inspection_id === insp.id && x.observed)) add('WATER', x.id, insp.inspection_number, 'Water seepage observation', x.details || 'Water seepage recorded.', x.location, x.action_taken);
      for (const x of (this.data.accidents || []).filter((x) => x.inspection_id === insp.id && x.occurred)) add('ACCIDENT', x.id, insp.inspection_number, 'Accident recorded', x.cause_details || 'Accident recorded during inspection.', undefined, x.first_aid_given_by || x.remarks);
      for (const x of (this.data.persons_ordered_out || []).filter((x) => x.inspection_id === insp.id && x.occurred)) add('SAFETY_INFRINGEMENT', x.id, insp.inspection_number, 'Person ordered out', x.reason || 'Person ordered out for a safety-related reason.', x.actual_place || x.assigned_place, x.action_taken);
    }
    // Only Overman-authored entries are additional observations. AUTO entries are already represented by source Sirdar records.
    for (const report of (this.data.overman_reports || []).filter((r) => r.status === 'SUBMITTED' && r.mine_id === mineId)) {
      for (const section of Object.values(report.sections || {})) {
        for (const entry of section.entries || []) {
          if (entry.entry_type !== 'OVERMAN_INPUT') continue;
          observations.push(this.normalizeManagerObservation({
            id: `mgr_overman_${entry.id}`, mine_id: mineId, mine_name: mine.mine_name,
            category: managerCategoryForSection(section.code), title: entry.title || `Overman ${section.code} observation`, description: entry.details,
            observed_at: entry.source_date || report.report_date, source_type: 'OVERMAN_REPORT', source_id: report.id, source_number: report.report_number,
            source_inspection_id: entry.source_inspection_id, location: entry.location, action_recorded: entry.action_taken,
          }));
        }
      }
    }
    return [...observations, ...(this.data.manager_demo_observations || []).filter((x) => x.mine_id === mineId)]
      .sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime());
  }

  private buildRecurringPatterns(observations: ManagerObservation[]): RecurringPattern[] {
    const groups = new Map<ManagerObservationCategory, ManagerObservation[]>();
    for (const o of observations) groups.set(o.category, [...(groups.get(o.category) || []), o]);
    return Array.from(groups.entries()).filter(([, list]) => list.length >= 2).map(([category, list]) => {
      const sorted = [...list].sort((a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime());
      const sourceIds = Array.from(new Set(list.map((o) => o.source_id)));
      return { category, occurrence_count: list.length, report_count: sourceIds.length, first_observed: sorted[0].observed_at, last_observed: sorted[sorted.length - 1].observed_at, source_record_ids: sourceIds, description: `${list.length} observations across ${sourceIds.length} submitted record(s).` };
    }).sort((a, b) => b.occurrence_count - a.occurrence_count);
  }

  private buildRiskComponents(reportCount: number, observations: ManagerObservation[]): RiskComponents {
    const emptyInputs = [
      { key: 'severity_weighted_observations' as const, score: 0, weight: RISK_WEIGHTS.severity_weighted_observations },
      { key: 'recurring_observation_rate' as const, score: 0, weight: RISK_WEIGHTS.recurring_observation_rate },
      { key: 'overdue_action_rate' as const, score: null, weight: RISK_WEIGHTS.overdue_action_rate },
      { key: 'observation_burden' as const, score: 0, weight: RISK_WEIGHTS.observation_burden },
      { key: 'closure_performance_risk' as const, score: null, weight: RISK_WEIGHTS.closure_performance_risk },
      { key: 'closure_time_risk' as const, score: null, weight: RISK_WEIGHTS.closure_time_risk },
    ];

    if (!reportCount || !observations.length) {
      return {
        severity_weighted_observations: 0,
        recurring_observation_rate: 0,
        observation_burden: 0,
        overdue_action_rate: null,
        closure_performance_risk: null,
        closure_time_risk: null,
        available_components: [],
        breakdown: buildRiskBreakdown(emptyInputs.map((x) => ({ ...x, score: null }))),
      };
    }

    const weighted = observations.reduce((sum, observation) => sum + observation.severity_weight, 0);
    const categoryCounts = new Map<ManagerObservationCategory, number>();
    for (const observation of observations) {
      categoryCounts.set(observation.category, (categoryCounts.get(observation.category) || 0) + 1);
    }

    const recurring = Array.from(categoryCounts.values()).filter((count) => count >= 2).length;
    const severityScore = Math.round(normalizeSeverityWeightedObservationScore(weighted, reportCount));
    const recurringScore = Math.round(normalizeRecurringObservationScore(recurring, categoryCounts.size));
    const burdenScore = Math.round(normalizeObservationBurdenScore(observations.length, reportCount));

    const inputs = [
      { key: 'severity_weighted_observations' as const, score: severityScore, weight: RISK_WEIGHTS.severity_weighted_observations },
      { key: 'recurring_observation_rate' as const, score: recurringScore, weight: RISK_WEIGHTS.recurring_observation_rate },
      { key: 'overdue_action_rate' as const, score: null, weight: RISK_WEIGHTS.overdue_action_rate },
      { key: 'observation_burden' as const, score: burdenScore, weight: RISK_WEIGHTS.observation_burden },
      { key: 'closure_performance_risk' as const, score: null, weight: RISK_WEIGHTS.closure_performance_risk },
      { key: 'closure_time_risk' as const, score: null, weight: RISK_WEIGHTS.closure_time_risk },
    ];

    return {
      severity_weighted_observations: severityScore,
      recurring_observation_rate: recurringScore,
      observation_burden: burdenScore,
      overdue_action_rate: null,
      closure_performance_risk: null,
      closure_time_risk: null,
      available_components: inputs.filter((input) => typeof input.score === 'number').map((input) => input.key),
      breakdown: buildRiskBreakdown(inputs),
    };
  }

  private buildRiskScore(c: RiskComponents): number | null {
    return calculateRiskScore([
      { key: 'severity_weighted_observations', score: c.severity_weighted_observations, weight: RISK_WEIGHTS.severity_weighted_observations },
      { key: 'recurring_observation_rate', score: c.recurring_observation_rate, weight: RISK_WEIGHTS.recurring_observation_rate },
      { key: 'overdue_action_rate', score: c.overdue_action_rate, weight: RISK_WEIGHTS.overdue_action_rate },
      { key: 'observation_burden', score: c.observation_burden, weight: RISK_WEIGHTS.observation_burden },
      { key: 'closure_performance_risk', score: c.closure_performance_risk, weight: RISK_WEIGHTS.closure_performance_risk },
      { key: 'closure_time_risk', score: c.closure_time_risk, weight: RISK_WEIGHTS.closure_time_risk },
    ]);
  }

  private buildConfidence(reportCount: number, observations: ManagerObservation[]): DataConfidence {
    const dates = observations.map((o) => o.observed_at).sort();
    const level = reportCount >= 10 && observations.length >= 15 ? 'HIGH' : reportCount >= 5 && observations.length >= 7 ? 'MEDIUM' : 'LOW';
    return { level, reports_analyzed: reportCount, observations_analyzed: observations.length, period_start: dates[0]?.slice(0, 10) || null, period_end: dates.at(-1)?.slice(0, 10) || null, explanation: `${reportCount} submitted records and ${observations.length} normalized observations analyzed.` };
  }

  private buildManagerProfile(mine: Mine): ManagerMineProfile {
    const observations = this.getManagerObservationsForMine(mine.id);
    const sirdarReports = (this.data.inspections || []).filter((i) => i.status === 'SUBMITTED' && i.mine_id === mine.id).length;
    const overmanReports = (this.data.overman_reports || []).filter((r) => r.status === 'SUBMITTED' && r.mine_id === mine.id).length;
    const demoReports = new Set((this.data.manager_demo_observations || []).filter((o) => o.mine_id === mine.id).map((o) => o.source_id)).size;
    const reportCount = sirdarReports + overmanReports + demoReports;
    const components = this.buildRiskComponents(reportCount, observations);
    const patterns = this.buildRecurringPatterns(observations);
    return {
      mine_id: mine.id, mine_name: mine.mine_name, subsidiary: mine.subsidiary, mine_type: mine.mine_type, location: mine.location,
      data_source: mine.id === 'mine_jhanjhra_01' ? 'LIVE_OPERATIONAL_DATA' : 'REPRESENTATIVE_DEMO_DATA',
      report_count: reportCount, observation_count: observations.length, risk_score: this.buildRiskScore(components), risk_components: components,
      recurring_categories: patterns.map((p) => p.category), data_confidence: this.buildConfidence(reportCount, observations),
    };
  }

  public getManagerOverview(managerId: string): ManagerOverview {
    const manager = this.getUserById(managerId);
    if (!manager || manager.role !== 'MANAGER') throw new Error('AUTH_ERROR: Manager account not found.');
    const mines = this.data.mines.filter((m) => m.status === 'ACTIVE').map((m) => this.buildManagerProfile(m));
    const observations = mines.flatMap((m) => this.getManagerObservationsForMine(m.mine_id));
    const patterns = this.buildRecurringPatterns(observations);
    const dates = observations.map((o) => o.observed_at).sort();
    return { area: { name: 'Jhanjhra Area', mine_count: mines.length }, summary: { submitted_records: mines.reduce((s, m) => s + m.report_count, 0), observations: observations.length, recurring_categories: new Set(patterns.map((p) => p.category)).size }, analysis_period: { from: dates[0]?.slice(0, 10) || null, to: dates.at(-1)?.slice(0, 10) || null }, mines };
  }

  public getManagerMineProfiles(managerId: string): ManagerMineProfile[] { return this.getManagerOverview(managerId).mines; }

  public getManagerMineDetail(managerId: string, mineId: string): ManagerMineDetail | null {
    const manager = this.getUserById(managerId);
    if (!manager || manager.role !== 'MANAGER') throw new Error('AUTH_ERROR: Manager account not found.');
    const mine = this.data.mines.find((m) => m.id === mineId && m.status === 'ACTIVE');
    if (!mine) return null;
    const profile = this.buildManagerProfile(mine);
    const observations = this.getManagerObservationsForMine(mineId);
    return { ...profile, observations, recurring_patterns: this.buildRecurringPatterns(observations), source_summary: {
      sirdar_inspections: (this.data.inspections || []).filter((i) => i.status === 'SUBMITTED' && i.mine_id === mineId).length,
      overman_reports: (this.data.overman_reports || []).filter((r) => r.status === 'SUBMITTED' && r.mine_id === mineId).length,
    }};
  }


  public getManagerTaskAssignees(managerId: string, mineId: string): Array<{ user_id: string | null; name: string; employee_id: string; role: 'OVERMAN' }> {
    const manager = this.getUserById(managerId);
    if (!manager || manager.role !== 'MANAGER') throw new Error('AUTH_ERROR: Manager account not found.');
    const mine = this.data.mines.find((m) => m.id === mineId && m.status === 'ACTIVE');
    if (!mine) throw new Error('VALIDATION_ERROR: Mine not found.');

    const activeOvermen = this.data.users
      .filter((u) => u.status === 'ACTIVE' && u.role === 'OVERMAN')
      .filter((u) => this.getOvermanAssignment(u.id)?.mine.id === mineId)
      .map((u) => ({ user_id: u.id, name: u.name, employee_id: u.employee_id, role: 'OVERMAN' as const }));

    if (activeOvermen.length) return activeOvermen;
    if (mine.id === 'mine_representative_b') return [{ user_id: null, name: 'Representative Overman — Mine B', employee_id: 'REP-B', role: 'OVERMAN' }];
    if (mine.id === 'mine_representative_c') return [{ user_id: null, name: 'Representative Overman — Mine C', employee_id: 'REP-C', role: 'OVERMAN' }];
    return [];
  }

  public getManagerTasks(managerId: string, mineId?: string): CorrectiveTask[] {
    const manager = this.getUserById(managerId);
    if (!manager || manager.role !== 'MANAGER') throw new Error('AUTH_ERROR: Manager account not found.');
    return (this.data.corrective_tasks || [])
      .filter((task) => !mineId || task.mine_id === mineId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getManagerTaskById(managerId: string, taskId: string): CorrectiveTask | null {
    const manager = this.getUserById(managerId);
    if (!manager || manager.role !== 'MANAGER') throw new Error('AUTH_ERROR: Manager account not found.');
    return (this.data.corrective_tasks || []).find((task) => task.id === taskId) || null;
  }

  public createManagerTask(
    managerId: string,
    input: {
      mine_id: string;
      title: string;
      description: string;
      priority: CorrectiveTaskPriority;
      due_date: string;
      assigned_to_user_id?: string | null;
      assigned_to_employee_id?: string;
      source_observation_ids?: string[];
    }
  ): CorrectiveTask {
    const manager = this.getUserById(managerId);
    if (!manager || manager.role !== 'MANAGER') throw new Error('AUTH_ERROR: Manager account not found.');
    const mine = this.data.mines.find((m) => m.id === input.mine_id && m.status === 'ACTIVE');
    if (!mine) throw new Error('VALIDATION_ERROR: Mine not found.');
    if (!input.title?.trim()) throw new Error('VALIDATION_ERROR: Task title is required.');
    if (!input.description?.trim()) throw new Error('VALIDATION_ERROR: Task description is required.');
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(input.priority)) throw new Error('VALIDATION_ERROR: Invalid task priority.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.due_date || '')) throw new Error('VALIDATION_ERROR: A due date is required.');

    const assignees = this.getManagerTaskAssignees(managerId, mine.id);
    const assignee = assignees.find((a) => input.assigned_to_user_id ? a.user_id === input.assigned_to_user_id : a.employee_id === input.assigned_to_employee_id);
    if (!assignee) throw new Error('VALIDATION_ERROR: Select an authorized Overman assignee for this mine.');

    const validObservationIds = new Set(this.getManagerObservationsForMine(mine.id).map((o) => o.id));
    const sourceObservationIds = Array.from(new Set(input.source_observation_ids || []));
    if (sourceObservationIds.some((id) => !validObservationIds.has(id))) {
      throw new Error('VALIDATION_ERROR: One or more linked observations do not belong to the selected mine.');
    }

    const now = new Date().toISOString();
    const taskId = this.generateId('task');
    const count = (this.data.corrective_tasks || []).length + 1;
    const task: CorrectiveTask = {
      id: taskId,
      task_number: `ACT-2026-${String(count).padStart(5, '0')}`,
      mine_id: mine.id,
      mine_name: mine.mine_name,
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      assigned_to: assignee,
      created_by: { user_id: manager.id, name: manager.name, employee_id: manager.employee_id },
      created_at: now,
      due_date: input.due_date,
      status: 'OPEN',
      source_observation_ids: sourceObservationIds,
      evidence: [],
      audit_history: [{ id: this.generateId('audit'), event: 'CREATED', actor_id: manager.id, actor_name: manager.name, occurred_at: now, note: 'Corrective action created by Manager.' }, { id: this.generateId('audit'), event: 'ASSIGNED', actor_id: manager.id, actor_name: manager.name, occurred_at: now, note: `Assigned to ${assignee.name}.` }],
    };
    if (!this.data.corrective_tasks) this.data.corrective_tasks = [];
    this.data.corrective_tasks.push(task);
    this.saveToDisk(this.data);
    return task;
  }

  public getOvermanTasks(overmanId: string): CorrectiveTask[] {
    const overman = this.getUserById(overmanId);
    if (!overman || overman.role !== 'OVERMAN') throw new Error('AUTH_ERROR: Overman account not found.');
    return (this.data.corrective_tasks || [])
      .filter((task) => task.assigned_to.user_id === overmanId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOvermanTaskById(overmanId: string, taskId: string): CorrectiveTask | null {
    const overman = this.getUserById(overmanId);
    if (!overman || overman.role !== 'OVERMAN') throw new Error('AUTH_ERROR: Overman account not found.');
    return (this.data.corrective_tasks || []).find((task) => task.id === taskId && task.assigned_to.user_id === overmanId) || null;
  }

  public startOvermanTask(overmanId: string, taskId: string): CorrectiveTask {
    const overman = this.getUserById(overmanId);
    if (!overman || overman.role !== 'OVERMAN') throw new Error('AUTH_ERROR: Overman account not found.');
    const task = (this.data.corrective_tasks || []).find((item) => item.id === taskId && item.assigned_to.user_id === overmanId);
    if (!task) throw new Error('NOT_FOUND_ERROR: Corrective action not found.');
    if (task.status !== 'OPEN') throw new Error('VALIDATION_ERROR: Only an open action can be started.');
    const now = new Date().toISOString();
    task.status = 'IN_PROGRESS';
    task.return_note = undefined;
    task.audit_history.push({ id: this.generateId('audit'), event: 'STARTED', actor_id: overman.id, actor_name: overman.name, occurred_at: now, note: 'Overman started the corrective action.' });
    this.saveToDisk(this.data);
    return task;
  }

  public submitOvermanTask(
    overmanId: string,
    taskId: string,
    input: { work_summary: string; evidence: Array<{ type: 'NOTE' | 'IMAGE' | 'DOCUMENT'; name?: string; description?: string; data_url?: string }> }
  ): CorrectiveTask {
    const overman = this.getUserById(overmanId);
    if (!overman || overman.role !== 'OVERMAN') throw new Error('AUTH_ERROR: Overman account not found.');
    const task = (this.data.corrective_tasks || []).find((item) => item.id === taskId && item.assigned_to.user_id === overmanId);
    if (!task) throw new Error('NOT_FOUND_ERROR: Corrective action not found.');
    if (task.status !== 'IN_PROGRESS') throw new Error('VALIDATION_ERROR: Start the action before submitting it for verification.');
    if (!input.work_summary?.trim()) throw new Error('VALIDATION_ERROR: Describe the corrective work completed.');
    if (!Array.isArray(input.evidence) || input.evidence.length === 0) throw new Error('VALIDATION_ERROR: Add at least one evidence note or attachment.');
    if (input.evidence.length > 6) throw new Error('VALIDATION_ERROR: A maximum of six evidence items is allowed.');

    const now = new Date().toISOString();
    const evidence = input.evidence.map((item) => {
      if (!['NOTE', 'IMAGE', 'DOCUMENT'].includes(item.type)) throw new Error('VALIDATION_ERROR: Invalid evidence type.');
      if (!item.description?.trim() && !item.data_url) throw new Error('VALIDATION_ERROR: Each evidence item needs a note or an attachment.');
      if (item.data_url && (!/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/i.test(item.data_url) || item.data_url.length > 4_500_000)) {
        throw new Error('VALIDATION_ERROR: Attachments must be PNG, JPEG, WEBP or PDF and no larger than 3 MB.');
      }
      return { id: this.generateId('evidence'), type: item.type, name: item.name?.slice(0, 180), description: item.description?.trim().slice(0, 2000), data_url: item.data_url, created_at: now, created_by: overman.id };
    });

    task.work_summary = input.work_summary.trim().slice(0, 5000);
    task.evidence = [...(task.evidence || []), ...evidence];
    task.status = 'SUBMITTED_FOR_VERIFICATION';
    task.submitted_at = now;
    task.return_note = undefined;
    task.verification_note = undefined;
    task.audit_history.push({ id: this.generateId('audit'), event: 'SUBMITTED_FOR_VERIFICATION', actor_id: overman.id, actor_name: overman.name, occurred_at: now, note: 'Corrective work and supporting evidence submitted for Manager verification.' });
    this.saveToDisk(this.data);
    return task;
  }

  public verifyManagerTask(managerId: string, taskId: string, note?: string): CorrectiveTask {
    const manager = this.getUserById(managerId);
    if (!manager || manager.role !== 'MANAGER') throw new Error('AUTH_ERROR: Manager account not found.');
    const task = (this.data.corrective_tasks || []).find((item) => item.id === taskId);
    if (!task) throw new Error('NOT_FOUND_ERROR: Corrective action not found.');
    if (task.status !== 'SUBMITTED_FOR_VERIFICATION') throw new Error('VALIDATION_ERROR: Only submitted actions can be verified.');
    const now = new Date().toISOString();
    task.status = 'VERIFIED';
    task.verified_at = now;
    task.verification_note = note?.trim().slice(0, 2000) || 'Corrective action and submitted evidence verified by Manager.';
    task.return_note = undefined;
    task.audit_history.push({ id: this.generateId('audit'), event: 'VERIFIED', actor_id: manager.id, actor_name: manager.name, occurred_at: now, note: task.verification_note });
    this.saveToDisk(this.data);
    return task;
  }

  public returnManagerTask(managerId: string, taskId: string, reason: string): CorrectiveTask {
    const manager = this.getUserById(managerId);
    if (!manager || manager.role !== 'MANAGER') throw new Error('AUTH_ERROR: Manager account not found.');
    const task = (this.data.corrective_tasks || []).find((item) => item.id === taskId);
    if (!task) throw new Error('NOT_FOUND_ERROR: Corrective action not found.');
    if (task.status !== 'SUBMITTED_FOR_VERIFICATION') throw new Error('VALIDATION_ERROR: Only submitted actions can be returned.');
    if (!reason?.trim()) throw new Error('VALIDATION_ERROR: Provide a reason for returning the action.');
    const now = new Date().toISOString();
    task.status = 'IN_PROGRESS';
    task.return_note = reason.trim().slice(0, 2000);
    task.verification_note = undefined;
    task.audit_history.push({ id: this.generateId('audit'), event: 'RETURNED', actor_id: manager.id, actor_name: manager.name, occurred_at: now, note: task.return_note });
    this.saveToDisk(this.data);
    return task;
  }

  public getMines(): Mine[] {
    return [...this.data.mines];
  }

  public getDistricts(mineId?: string): District[] {
    if (mineId) {
      return this.data.districts.filter((d) => d.mine_id === mineId);
    }
    return [...this.data.districts];
  }

  public getInspectionsSummary(sirdarId: string): InspectionSummary[] {
    const sirdarInspections = this.data.inspections
      .filter((i) => i.sirdar_id === sirdarId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return sirdarInspections.map((insp) => {
      const user = this.data.users.find((u) => u.id === insp.sirdar_id);
      const mine = this.data.mines.find((m) => m.id === insp.mine_id);
      const district = this.data.districts.find((d) => d.id === insp.district_id);
      const shift = this.data.shifts.find((s) => s.id === insp.shift_id);

      const periods = this.data.inspection_periods.filter((p) => p.inspection_id === insp.id);
      const defObs = this.data.observations.filter((o) => o.inspection_id === insp.id && o.has_deficiency);
      const gas = this.data.gas_observations.find((g) => g.inspection_id === insp.id);
      const water = this.data.water_observations.find((w) => w.inspection_id === insp.id);
      const accident = this.data.accidents.find((a) => a.inspection_id === insp.id);

      return {
        id: insp.id,
        inspection_number: insp.inspection_number,
        sirdar_name: user?.name || 'Sirdar',
        sirdar_employee_id: user?.employee_id || '',
        mine_name: mine?.mine_name || 'Underground Mine',
        district_name: district?.district_name || 'District',
        seam_name: district?.seam_name || 'Seam',
        shift_name: shift?.shift_name || 'Shift',
        shift_hours: shift ? `${shift.start_time} – ${shift.end_time}` : '',
        inspection_date: insp.inspection_date,
        persons_under_charge: insp.persons_under_charge,
        period_count: periods.length,
        deficiency_count: defObs.length,
        gas_detected: !!(gas && gas.detected),
        water_seepage: !!(water && water.observed),
        accident_occurred: !!(accident && accident.occurred),
        status: insp.status,
        created_at: insp.created_at,
        submitted_at: insp.submitted_at,
      };
    });
  }

  public getInspectionFull(id: string): (InspectionData & { mine?: Mine; district?: District; shift?: Shift; sirdar?: User }) | null {
    const insp = this.data.inspections.find((i) => i.id === id);
    if (!insp) return null;

    const user = this.data.users.find((u) => u.id === insp.sirdar_id);
    const mine = this.data.mines.find((m) => m.id === insp.mine_id);
    const district = this.data.districts.find((d) => d.id === insp.district_id);
    const shift = this.data.shifts.find((s) => s.id === insp.shift_id);

    const periods = this.data.inspection_periods
      .filter((p) => p.inspection_id === insp.id)
      .sort((a, b) => a.period_number - b.period_number);

    const rawObs = this.data.observations.filter((o) => o.inspection_id === insp.id);
    const categories: ObservationCategory[] = ['VENTILATION', 'STRATA', 'GOAF_EDGE', 'FENCING', 'SANITATION'];
    const deficiencies: Record<ObservationCategory, any> = {} as any;
    categories.forEach((cat) => {
      const match = rawObs.find((o) => o.category === cat);
      deficiencies[cat] = match || { category: cat, has_deficiency: false };
    });

    const safetyInstructions = this.data.safety_instructions.filter((s) => s.inspection_id === insp.id);
    const personOrderedOut = this.data.persons_ordered_out.find((p) => p.inspection_id === insp.id) || { occurred: false };
    const inexperiencedPerson = this.data.inexperienced_persons.find((p) => p.inspection_id === insp.id) || { present: false };

    const rawMat = this.data.safety_materials.filter((m) => m.inspection_id === insp.id);
    const matTypes: SafetyMaterialType[] = ['TIMBER', 'BUNTON', 'LADDER', 'CO_DETECTION', 'OTHER'];
    const safetyMaterials: Record<SafetyMaterialType, any> = {} as any;
    matTypes.forEach((mt) => {
      const match = rawMat.find((m) => m.material_type === mt);
      safetyMaterials[mt] = match || { material_type: mt, status: 'ADEQUATE' };
    });

    const egress = this.data.egress_records.find((e) => e.inspection_id === insp.id) || { travelled: false };
    const supportWithdrawn = this.data.support_withdrawals.filter((w) => w.inspection_id === insp.id);
    const dangerousPlaces = this.data.dangerous_places.find((d) => d.inspection_id === insp.id) || {
      observed: false,
      reported_by_other: false,
    };
    const dangerousOperations = this.data.dangerous_operations.find((d) => d.inspection_id === insp.id) || { occurred: false };
    const inactivePlaces = this.data.inactive_places.find((i) => i.inspection_id === insp.id) || { fenced: false };
    const gas = this.data.gas_observations.find((g) => g.inspection_id === insp.id) || { detected: false };
    const water = this.data.water_observations.find((w) => w.inspection_id === insp.id) || { observed: false };
    const accident = this.data.accidents.find((a) => a.inspection_id === insp.id) || { occurred: false };
    const successor = this.data.successor_conferences.find((s) => s.inspection_id === insp.id) || { conducted: false };

    return {
      id: insp.id,
      inspection_number: insp.inspection_number,
      sirdar_id: insp.sirdar_id,
      mine_id: insp.mine_id,
      district_id: insp.district_id,
      shift_id: insp.shift_id,
      inspection_date: insp.inspection_date,
      persons_under_charge: insp.persons_under_charge,
      inspection_periods: periods,
      deficiencies,
      safety_instructions: safetyInstructions,
      person_ordered_out: personOrderedOut,
      inexperienced_person: inexperiencedPerson,
      safety_materials: safetyMaterials,
      egress_record: egress,
      support_withdrawals_occurred: supportWithdrawn.length > 0,
      support_withdrawals: supportWithdrawn,
      dangerous_places: dangerousPlaces,
      dangerous_operations: dangerousOperations,
      inactive_places: inactivePlaces,
      gas_observation: gas,
      water_observation: water,
      accident_observation: accident,
      successor_conference: successor,
      other_remarks: insp.other_remarks || '',
      status: insp.status,
      created_at: insp.created_at,
      submitted_at: insp.submitted_at,
      device_info: insp.device_info,
      latitude: insp.latitude,
      longitude: insp.longitude,
      location_accuracy: insp.location_accuracy,
      mine,
      district,
      shift,
      sirdar: user,
    };
  }

  // --- SAVE DRAFT METHOD ---
  public saveDraft(payload: InspectionData, sirdarId: string): InspectionData {
    // 1. If payload has an existing ID, verify it exists and is NOT SUBMITTED
    let inspId = payload.id;
    if (inspId) {
      const existing = this.data.inspections.find((i) => i.id === inspId);
      if (existing) {
        if (existing.status === 'SUBMITTED') {
          throw new Error('IMMUTABLE_ERROR: Cannot modify a submitted statutory inspection. Record is permanently sealed.');
        }
        if (existing.sirdar_id !== sirdarId) {
          throw new Error('AUTH_ERROR: You can only edit your own draft inspection.');
        }
      }
    } else {
      inspId = this.generateId('insp');
    }

    // Verify foreign keys
    const user = this.data.users.find((u) => u.id === sirdarId);
    if (!user) throw new Error('Invalid Sirdar identity');

    const mine = this.data.mines.find((m) => m.id === payload.mine_id) || this.data.mines[0];
    const district = this.data.districts.find((d) => d.id === payload.district_id) || this.data.districts[0];
    const shift = this.data.shifts.find((s) => s.id === payload.shift_id) || this.data.shifts[0];

    const inspectionIndex = this.data.inspections.findIndex((i) => i.id === inspId);
    const existing = inspectionIndex >= 0 ? this.data.inspections[inspectionIndex] : null;

    const inspectionRecord = {
      id: inspId,
      inspection_number: existing?.inspection_number || `DRAFT-${Date.now().toString().slice(-6)}`,
      sirdar_id: sirdarId,
      mine_id: mine.id,
      district_id: district.id,
      shift_id: shift.id,
      inspection_date: payload.inspection_date || new Date().toISOString().split('T')[0],
      persons_under_charge: Number(payload.persons_under_charge) || 0,
      other_remarks: payload.other_remarks || '',
      status: 'DRAFT' as InspectionStatus,
      created_at: existing?.created_at || new Date().toISOString(),
      submitted_at: null,
      device_info: payload.device_info || 'Sirdar Web Terminal',
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      location_accuracy: payload.location_accuracy ?? null,
    };

    if (existing) {
      this.data.inspections[inspectionIndex] = inspectionRecord;
      this.clearChildRecords(inspId);
    } else {
      this.data.inspections.push(inspectionRecord);
    }

    this.saveChildRecords(inspId, payload);
    this.saveToDisk(this.data);

    return this.getInspectionFull(inspId)!;
  }

  // --- SUBMIT ATOMIC METHOD ---
  public submitInspection(payload: InspectionData, sirdarId: string): InspectionData {
    // 1. Immutability validation: if record already submitted, abort
    if (payload.id) {
      const existing = this.data.inspections.find((i) => i.id === payload.id);
      if (existing) {
        if (existing.status === 'SUBMITTED') {
          throw new Error('IMMUTABLE_ERROR: Statutory report is already submitted and cannot be modified or re-submitted.');
        }
        if (existing.sirdar_id !== sirdarId) {
          throw new Error('AUTH_ERROR: You can only submit your own inspection draft.');
        }
      }
    }

    // 2. Statutory validation checks under G.S.R. 977(E)
    this.validateStatutorySubmission(payload);

    // 3. Atomically assign unique statutory inspection number
    const today = new Date();
    const year = today.getFullYear();
    const count = this.data.inspections.filter((i) => i.status === 'SUBMITTED').length + 124;
    const inspectionNumber = `INS-${year}-${String(count).padStart(6, '0')}`;

    let inspId = payload.id;
    if (!inspId) {
      inspId = this.generateId('insp');
    }

    const inspectionIndex = this.data.inspections.findIndex((i) => i.id === inspId);
    const existing = inspectionIndex >= 0 ? this.data.inspections[inspectionIndex] : null;

    const submittedTimestamp = new Date().toISOString();

    const inspectionRecord = {
      id: inspId,
      inspection_number: inspectionNumber,
      sirdar_id: sirdarId,
      mine_id: payload.mine_id,
      district_id: payload.district_id,
      shift_id: payload.shift_id,
      inspection_date: payload.inspection_date,
      persons_under_charge: Number(payload.persons_under_charge),
      other_remarks: payload.other_remarks || '',
      status: 'SUBMITTED' as InspectionStatus,
      created_at: existing?.created_at || submittedTimestamp,
      submitted_at: submittedTimestamp,
      device_info: payload.device_info || 'Sirdar Mobile Field Applet v1.0',
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      location_accuracy: payload.location_accuracy ?? null,
    };

    if (existing) {
      this.data.inspections[inspectionIndex] = inspectionRecord;
      this.clearChildRecords(inspId);
    } else {
      this.data.inspections.push(inspectionRecord);
    }

    this.saveChildRecords(inspId, payload);
    this.saveToDisk(this.data);

    console.log(`[STATUTORY LOG] Inspection ${inspectionNumber} permanently sealed and committed for Sirdar ${sirdarId}`);
    return this.getInspectionFull(inspId)!;
  }

  // --- DELETE DRAFT (Submitted records CANNOT be deleted) ---
  public deleteDraft(id: string, sirdarId: string): boolean {
    const existing = this.data.inspections.find((i) => i.id === id);
    if (!existing) return false;

    if (existing.status === 'SUBMITTED') {
      throw new Error('IMMUTABLE_ERROR: Under statutory regulations, submitted inspections cannot be deleted.');
    }

    if (existing.sirdar_id !== sirdarId) {
      throw new Error('AUTH_ERROR: You can only delete your own draft inspection.');
    }

    this.data.inspections = this.data.inspections.filter((i) => i.id !== id);
    this.clearChildRecords(id);
    this.saveToDisk(this.data);
    return true;
  }

  private clearChildRecords(inspId: string): void {
    this.data.inspection_periods = this.data.inspection_periods.filter((p) => p.inspection_id !== inspId);
    this.data.observations = this.data.observations.filter((o) => o.inspection_id !== inspId);
    this.data.safety_instructions = this.data.safety_instructions.filter((s) => s.inspection_id !== inspId);
    this.data.persons_ordered_out = this.data.persons_ordered_out.filter((p) => p.inspection_id !== inspId);
    this.data.inexperienced_persons = this.data.inexperienced_persons.filter((p) => p.inspection_id !== inspId);
    this.data.safety_materials = this.data.safety_materials.filter((m) => m.inspection_id !== inspId);
    this.data.support_withdrawals = this.data.support_withdrawals.filter((w) => w.inspection_id !== inspId);
    this.data.dangerous_places = this.data.dangerous_places.filter((d) => d.inspection_id !== inspId);
    this.data.dangerous_operations = this.data.dangerous_operations.filter((d) => d.inspection_id !== inspId);
    this.data.inactive_places = this.data.inactive_places.filter((i) => i.inspection_id !== inspId);
    this.data.gas_observations = this.data.gas_observations.filter((g) => g.inspection_id !== inspId);
    this.data.water_observations = this.data.water_observations.filter((w) => w.inspection_id !== inspId);
    this.data.accidents = this.data.accidents.filter((a) => a.inspection_id !== inspId);
    this.data.successor_conferences = this.data.successor_conferences.filter((s) => s.inspection_id !== inspId);
    this.data.egress_records = this.data.egress_records.filter((e) => e.inspection_id !== inspId);
  }

  private saveChildRecords(inspId: string, payload: InspectionData): void {
    // 1. Periods
    if (payload.inspection_periods && payload.inspection_periods.length > 0) {
      payload.inspection_periods.forEach((p) => {
        if (p.start_time && p.end_time) {
          this.data.inspection_periods.push({
            id: this.generateId('ip'),
            inspection_id: inspId,
            period_number: p.period_number,
            start_time: p.start_time,
            end_time: p.end_time,
          });
        }
      });
    }

    // 2. Observations (5 statutory deficiency categories)
    if (payload.deficiencies) {
      const cats: ObservationCategory[] = ['VENTILATION', 'STRATA', 'GOAF_EDGE', 'FENCING', 'SANITATION'];
      cats.forEach((cat) => {
        const item = payload.deficiencies[cat];
        if (item) {
          this.data.observations.push({
            id: this.generateId('obs'),
            inspection_id: inspId,
            category: cat,
            has_deficiency: Boolean(item.has_deficiency),
            location_text: item.location_text || '',
            description: item.description || '',
            remedial_action: item.remedial_action || '',
            remarks: item.remarks || '',
          });
        }
      });
    }

    // 3. Safety instructions
    if (payload.safety_instructions && payload.safety_instructions.length > 0) {
      payload.safety_instructions.forEach((si) => {
        if (si.instruction && si.instruction.trim().length > 0) {
          this.data.safety_instructions.push({
            id: this.generateId('si'),
            inspection_id: inspId,
            instruction: si.instruction.trim(),
            persons_instructed: Number(si.persons_instructed) || 0,
          });
        }
      });
    }

    // 4. Person ordered out
    if (payload.person_ordered_out) {
      this.data.persons_ordered_out.push({
        id: this.generateId('po'),
        inspection_id: inspId,
        occurred: Boolean(payload.person_ordered_out.occurred),
        person_name: payload.person_ordered_out.person_name || '',
        assigned_place: payload.person_ordered_out.assigned_place || '',
        actual_place: payload.person_ordered_out.actual_place || '',
        reason: payload.person_ordered_out.reason || '',
        action_taken: payload.person_ordered_out.action_taken || '',
      });
    }

    // 5. Inexperienced persons
    if (payload.inexperienced_person) {
      this.data.inexperienced_persons.push({
        id: this.generateId('iperson'),
        inspection_id: inspId,
        present: Boolean(payload.inexperienced_person.present),
        person_name: payload.inexperienced_person.person_name || '',
        supervisor_name: payload.inexperienced_person.supervisor_name || '',
      });
    }

    // 6. Safety materials checklist
    if (payload.safety_materials) {
      const types: SafetyMaterialType[] = ['TIMBER', 'BUNTON', 'LADDER', 'CO_DETECTION', 'OTHER'];
      types.forEach((mt) => {
        const item = payload.safety_materials[mt];
        if (item) {
          this.data.safety_materials.push({
            id: this.generateId('sm'),
            inspection_id: inspId,
            material_type: mt,
            status: item.status,
            description: item.description || '',
            remedial_action: item.remedial_action || '',
            remarks: item.remarks || '',
          });
        }
      });
    }

    // 7. Support withdrawals
    if (payload.support_withdrawals_occurred && payload.support_withdrawals) {
      payload.support_withdrawals.forEach((sw) => {
        if (sw.place) {
          this.data.support_withdrawals.push({
            id: this.generateId('sw'),
            inspection_id: inspId,
            place: sw.place,
            cogs_sleepers_withdrawn: Number(sw.cogs_sleepers_withdrawn) || 0,
            props_withdrawn: Number(sw.props_withdrawn) || 0,
            other_support: sw.other_support || '',
            means_of_withdrawal: sw.means_of_withdrawal || '',
          });
        }
      });
    }

    // 8. Dangerous places
    if (payload.dangerous_places) {
      this.data.dangerous_places.push({
        id: this.generateId('dp'),
        inspection_id: inspId,
        observed: Boolean(payload.dangerous_places.observed),
        location: payload.dangerous_places.location || '',
        nature_of_danger: payload.dangerous_places.nature_of_danger || '',
        action_taken: payload.dangerous_places.action_taken || '',
        reported_by_other: Boolean(payload.dangerous_places.reported_by_other),
        reporting_person_name: payload.dangerous_places.reporting_person_name || '',
        other_report_details: payload.dangerous_places.other_report_details || '',
        other_report_action: payload.dangerous_places.other_report_action || '',
      });
    }

    // 9. Dangerous operations
    if (payload.dangerous_operations) {
      this.data.dangerous_operations.push({
        id: this.generateId('do'),
        inspection_id: inspId,
        occurred: Boolean(payload.dangerous_operations.occurred),
        operation_nature: payload.dangerous_operations.operation_nature || '',
        location: payload.dangerous_operations.location || '',
        danger: payload.dangerous_operations.danger || '',
        precautions_taken: payload.dangerous_operations.precautions_taken || '',
      });
    }

    // 10. Inactive places
    if (payload.inactive_places) {
      this.data.inactive_places.push({
        id: this.generateId('inact'),
        inspection_id: inspId,
        fenced: Boolean(payload.inactive_places.fenced),
        location: payload.inactive_places.location || '',
        entrance_details: payload.inactive_places.entrance_details || '',
        action_taken: payload.inactive_places.action_taken || '',
      });
    }

    // 11. Gas observation
    if (payload.gas_observation) {
      this.data.gas_observations.push({
        id: this.generateId('gas'),
        inspection_id: inspId,
        detected: Boolean(payload.gas_observation.detected),
        location: payload.gas_observation.location || '',
        gas_percentage: payload.gas_observation.gas_percentage || '',
        action_taken: payload.gas_observation.action_taken || '',
        recorded_at: new Date().toISOString(),
      });
    }

    // 12. Water seepage observation
    if (payload.water_observation) {
      this.data.water_observations.push({
        id: this.generateId('wat'),
        inspection_id: inspId,
        observed: Boolean(payload.water_observation.observed),
        location: payload.water_observation.location || '',
        details: payload.water_observation.details || '',
        action_taken: payload.water_observation.action_taken || '',
        recorded_at: new Date().toISOString(),
      });
    }

    // 13. Accident
    if (payload.accident_observation) {
      this.data.accidents.push({
        id: this.generateId('acc'),
        inspection_id: inspId,
        occurred: Boolean(payload.accident_observation.occurred),
        cause_details: payload.accident_observation.cause_details || '',
        first_aid_given_by: payload.accident_observation.first_aid_given_by || '',
        remarks: payload.accident_observation.remarks || '',
      });
    }

    // 14. Successor conference
    if (payload.successor_conference) {
      this.data.successor_conferences.push({
        id: this.generateId('sc'),
        inspection_id: inspId,
        conducted: Boolean(payload.successor_conference.conducted),
        information_conveyed: payload.successor_conference.information_conveyed || '',
        conveyed_to_person: payload.successor_conference.conveyed_to_person || '',
      });
    }

    // 15. Egress record
    if (payload.egress_record) {
      this.data.egress_records.push({
        id: this.generateId('eg'),
        inspection_id: inspId,
        travelled: Boolean(payload.egress_record.travelled),
        travel_date: payload.egress_record.travel_date || '',
        remarks: payload.egress_record.remarks || '',
      });
    }
  }

  private validateStatutorySubmission(payload: InspectionData): void {
    if (!payload.mine_id) throw new Error('VALIDATION_ERROR: Assigned Mine is required.');
    if (!payload.district_id) throw new Error('VALIDATION_ERROR: Assigned District is required.');
    if (!payload.shift_id) throw new Error('VALIDATION_ERROR: Shift selection is required.');
    if (!payload.inspection_date) throw new Error('VALIDATION_ERROR: Inspection date is required.');

    // Inspection periods: at least one complete period
    const validPeriods = (payload.inspection_periods || []).filter((p) => p.start_time && p.end_time);
    if (validPeriods.length === 0) {
      throw new Error('VALIDATION_ERROR: At least one complete inspection period (Start & End Time) must be recorded.');
    }

    validPeriods.forEach((p) => {
      if (p.start_time >= p.end_time) {
        throw new Error(`VALIDATION_ERROR: In Period ${p.period_number}, end time (${p.end_time}) cannot be before or equal to start time (${p.start_time}).`);
      }
    });

    if (payload.persons_under_charge === undefined || payload.persons_under_charge === null || payload.persons_under_charge < 0) {
      throw new Error('VALIDATION_ERROR: Number of persons working under charge must be specified (minimum 0).');
    }

    // Deficiencies conditional validation
    if (payload.deficiencies) {
      Object.entries(payload.deficiencies).forEach(([category, obs]) => {
        if (obs.has_deficiency) {
          if (!obs.location_text?.trim()) {
            throw new Error(`VALIDATION_ERROR: Location is required for deficiency in ${category}.`);
          }
          if (!obs.description?.trim()) {
            throw new Error(`VALIDATION_ERROR: Description is required for deficiency in ${category}.`);
          }
          if (!obs.remedial_action?.trim()) {
            throw new Error(`VALIDATION_ERROR: Remedial action is required for deficiency in ${category}.`);
          }
        }
      });
    }

    // Gas conditional validation
    if (payload.gas_observation?.detected) {
      if (!payload.gas_observation.location?.trim()) {
        throw new Error('VALIDATION_ERROR: Location is required when inflammable gas is detected.');
      }
      if (!payload.gas_observation.gas_percentage?.trim()) {
        throw new Error('VALIDATION_ERROR: Gas percentage is required when inflammable gas is detected.');
      }
      if (!payload.gas_observation.action_taken?.trim()) {
        throw new Error('VALIDATION_ERROR: Action taken is required when inflammable gas is detected.');
      }
    }

    // Water conditional validation
    if (payload.water_observation?.observed) {
      if (!payload.water_observation.location?.trim()) {
        throw new Error('VALIDATION_ERROR: Location is required when abnormal water seepage is observed.');
      }
      if (!payload.water_observation.details?.trim()) {
        throw new Error('VALIDATION_ERROR: Seepage details are required when abnormal water seepage is observed.');
      }
      if (!payload.water_observation.action_taken?.trim()) {
        throw new Error('VALIDATION_ERROR: Action taken is required when abnormal water seepage is observed.');
      }
    }

    // Accident conditional validation
    if (payload.accident_observation?.occurred) {
      if (!payload.accident_observation.cause_details?.trim()) {
        throw new Error('VALIDATION_ERROR: Cause and details are required when an accident occurs.');
      }
      if (!payload.accident_observation.first_aid_given_by?.trim()) {
        throw new Error('VALIDATION_ERROR: First aid provider name/designation is required for an accident.');
      }
    }
  }
}

export const db = new RelationalDatabase();
