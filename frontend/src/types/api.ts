export interface HealthResponse {
  status: string
  service: string
}


export interface RequirementChange {
  id: number

  old_requirement_id: string | null
  new_requirement_id: string | null

  old_requirement_text: string | null
  new_requirement_text: string | null

  detailed_change_types: string[]

  change_type: string

  risk_score: number
  risk_level: string
  confidence: number | null

  explanation: string | null
}


export interface DefectRanking {
  id: number

  defect_id: string | null
  defect_text: string

  change_id: string | null

  relevance_score: number
  rank_position: number

  reason: string | null
}


export interface AnalysisSummary {
  id: number

  analysis_name: string

  source_version: string | null
  target_version: string | null

  created_at: string

  requirement_change_count: number
  defect_ranking_count: number
}


export interface AnalysisDetail {
  id: number

  analysis_name: string

  source_version: string | null
  target_version: string | null

  created_at: string

  requirement_changes: RequirementChange[]
  defect_rankings: DefectRanking[]
}


export interface DefectCandidate {
  change_id: string

  old_requirement_id: string | null
  new_requirement_id: string | null

  old_requirement_text: string | null
  new_requirement_text: string | null

  detailed_change_types: string[]

  change_type: string

  risk_score: number
  risk_level: string
  confidence: number | null

  semantic_similarity: number
  keyword_overlap: number
  relevance_score: number

  rank: number
  reason: string
}


export interface DefectAnalysisResult {
  analysis_id: number
  analysis_name: string

  defect_id: string
  defect_text: string

  candidate_count: number

  candidates: DefectCandidate[]
}


/* =====================================================
   HISTORY
   ===================================================== */


export interface HistoryCatalogItem {
  requirement_id: string
  module: string

  version_count: number

  first_version: string
  latest_version: string

  highest_risk: string | null

  current_text: string
}


export interface HistoryCatalog {
  modules: string[]

  requirements: HistoryCatalogItem[]
}


export interface HistorySummary {
  requirement_id: string
  module: string

  first_version: string
  latest_version: string

  version_count: number
  transition_count: number

  highest_risk: string | null

  change_types: string[]

  current_text: string
}


export interface HistoryTimelineItem {
  requirement_id: string
  module: string

  version: string
  version_label: string

  requirement_text: string

  previous_version: string | null
  transition_id: string | null

  change_type: string
  risk_level: string

  change_explanation: string

  is_initial_version: boolean
  is_current_version: boolean
}


export interface RequirementHistory {
  summary: HistorySummary

  timeline: HistoryTimelineItem[]
}