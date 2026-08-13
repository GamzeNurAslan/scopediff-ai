export type ProcessStage =
  | 'TASARIM'
  | 'GELISTIRME'
  | 'TEST'
  | 'TESLIM_HAZIR'
  | 'TAMAMLANDI'


export interface WorkItem {
  id: number
  external_id: string | null

  title: string

  portal_menu: string | null
  module: string | null

  developer: string | null
  analyst: string | null

  due_date: string | null
  due_status_text: string | null

  test_given_status: string | null
  analysis_status: string | null
  test_status: string | null

  current_stage: ProcessStage
  stage_override: ProcessStage | null

  is_blocked: boolean
  is_overdue: boolean

  notes: string | null

  source_file: string | null
  source_sheet: string | null
  source_row: number | null

  analysis_run_id: number | null
  analysis_name: string | null

  high_risk_change_count: number
  critical_risk_change_count: number
  defect_candidate_count: number

  needs_review: boolean

  created_at: string
  updated_at: string
}


export interface ProcessTrackingSummary {
  total: number
  active: number

  design: number
  development: number
  test: number
  delivery_ready: number
  completed: number

  blocked: number
  overdue: number
  needs_review: number
}


export interface ProcessImportResponse {
  filename: string

  imported_count: number
  updated_count: number
  skipped_count: number

  sheets: string[]
}


export interface CreateWorkItemInput {
  title: string
  portal_menu?: string
  module?: string
  developer?: string
  analyst?: string
  due_date?: string
  current_stage: ProcessStage
  is_blocked: boolean
  notes?: string
}


export interface WorkItemStageHistory {
  id: number
  work_item_id: number
  from_stage: ProcessStage | null
  to_stage: ProcessStage
  changed_by_user_id: string | null
  changed_by_name: string | null
  changed_by_role: string | null
  created_at: string
}
