import type {
  AnalysisDetail,
  AnalysisSummary,
  HealthResponse,
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
    throw new Error(
      `API request failed: ${response.status}`,
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


/*
 * İKİ EXCEL DOSYASINI
 * SCOPEDIFF BACKEND'E GÖNDERİR.
 */
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

  if (analysisName.trim()) {
    formData.append(
      'analysis_name',
      analysisName.trim(),
    )
  }

  const response = await fetch(
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
      // JSON hata gövdesi yoksa
      // varsayılan mesaj kullanılır.
    }

    throw new Error(
      message,
    )
  }

  return response.json()
}


/*
 * EXCEL RAPORU İNDİR
 */
export async function downloadAnalysisReport(
  analysisId: number,
): Promise<void> {
  const response = await fetch(
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
    document.createElement('a')

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