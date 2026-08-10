import type {
  AnalysisDetail,
  AnalysisSummary,
  HealthResponse,
} from '../types/api'

const API_BASE_URL = 'http://127.0.0.1:8000'

async function request<T>(
  path: string,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
  )

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status}`,
    )
  }

  return response.json()
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

export function getAnalyses(): Promise<
  AnalysisSummary[]
> {
  return request<AnalysisSummary[]>('/analyses')
}

export function getAnalysis(
  analysisId: number,
): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(
    `/analyses/${analysisId}`,
  )
}