import type {
  AnalysisDetail,
  AnalysisSummary,
  DefectAnalysisResult,
  HealthResponse,
  HistoryCatalog,
  RequirementHistory,
} from '../types/api'


const API_BASE_URL =
  'http://127.0.0.1:8000'


async function request<T>(
  path: string,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
  )

  if (!response.ok) {
    let message =
      `API request failed: ${response.status}`

    try {
      const errorBody =
        await response.json()

      if (
        typeof errorBody.detail
        === 'string'
      ) {
        message =
          errorBody.detail
      }
    } catch {
      // Varsayılan mesaj.
    }

    throw new Error(
      message,
    )
  }

  return response.json()
}


export function getHealth():
Promise<HealthResponse> {
  return request<HealthResponse>(
    '/health',
  )
}


export function getAnalyses():
Promise<AnalysisSummary[]> {
  return request<AnalysisSummary[]>(
    '/analyses',
  )
}


export function getAnalysis(
  analysisId: number,
): Promise<AnalysisDetail> {
  return request<AnalysisDetail>(
    `/analyses/${analysisId}`,
  )
}


export async function compareRequirementFiles(
  sourceFile: File,
  targetFile: File,
  analysisName: string,
): Promise<AnalysisDetail> {
  const formData =
    new FormData()

  formData.append(
    'source_file',
    sourceFile,
  )

  formData.append(
    'target_file',
    targetFile,
  )

  if (
    analysisName.trim()
  ) {
    formData.append(
      'analysis_name',
      analysisName.trim(),
    )
  }

  const response =
    await fetch(
      `${API_BASE_URL}/analyses/compare`,
      {
        method: 'POST',
        body: formData,
      },
    )

  if (!response.ok) {
    let message =
      'Karşılaştırma işlemi başarısız oldu.'

    try {
      const errorBody =
        await response.json()

      if (
        typeof errorBody.detail
        === 'string'
      ) {
        message =
          errorBody.detail
      }

    } catch {
      // Varsayılan mesaj.
    }

    throw new Error(
      message,
    )
  }

  return response.json()
}


export async function analyzeDefect(
  analysisId: number,
  defectText: string,
  topK: number = 5,
): Promise<DefectAnalysisResult> {

  const response =
    await fetch(
      `${API_BASE_URL}/analyses/${analysisId}/defect-rankings`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          defect_text:
            defectText.trim(),

          top_k:
            topK,

          min_relevance:
            0.0,
        }),
      },
    )

  if (!response.ok) {
    let message =
      'Defect analizi tamamlanamadı.'

    try {
      const errorBody =
        await response.json()

      if (
        typeof errorBody.detail
        === 'string'
      ) {
        message =
          errorBody.detail
      }

    } catch {
      // Varsayılan mesaj.
    }

    throw new Error(
      message,
    )
  }

  return response.json()
}


/* =====================================================
   HISTORY
   ===================================================== */


export function getHistoryCatalog():
Promise<HistoryCatalog> {
  return request<HistoryCatalog>(
    '/history/requirements',
  )
}


export function getRequirementHistory(
  requirementId: string,
): Promise<RequirementHistory> {

  return request<RequirementHistory>(
    `/history/requirements/${
      encodeURIComponent(
        requirementId,
      )
    }`,
  )
}


export async function downloadAnalysisReport(
  analysisId: number,
): Promise<void> {

  const response =
    await fetch(
      `${API_BASE_URL}/analyses/${analysisId}/report`,
    )

  if (!response.ok) {
    throw new Error(
      `Report download failed: ${response.status}`,
    )
  }

  const blob =
    await response.blob()

  const downloadUrl =
    window.URL.createObjectURL(
      blob,
    )

  const link =
    document.createElement(
      'a',
    )

  link.href =
    downloadUrl

  link.download =
    `ScopeDiff_Analysis_${analysisId}.xlsx`

  document.body.appendChild(
    link,
  )

  link.click()

  link.remove()

  window.URL.revokeObjectURL(
    downloadUrl,
  )
}