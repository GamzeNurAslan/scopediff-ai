import type {
  AnalysisDetail,
  AnalysisSummary,
  HistoryCatalog,
  RequirementHistory,
  RequirementField,
  RequirementFilePreview,
} from '../types/api'


export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV
    ? '/api'
    : 'http://127.0.0.1:8001')


export async function translateContentBatch(
  texts: string[],
  targetLanguage: string,
): Promise<string[]> {
  const response =
    await fetch(
      `${API_BASE_URL}/translate/content`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          target_language: targetLanguage,
        }),
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'İçerikler çevrilemedi.',
      ),
    )
  }

  const data =
    await response.json() as {
      translations?: string[]
    }

  return data.translations ?? texts
}




export interface HealthResponse {
  status: string
  service: string
}


export interface AnalysisCreatorInput {
  userId: string
  fullName: string
  corporateEmail: string
  department: string
  role: string
}


export interface CompareRequirementFilesInput {
  sourceFile: File
  targetFile: File

  analysisName?: string

  sourceSheet?: string
  targetSheet?: string

  sourceMapping?: Partial<Record<RequirementField, string | null>>
  targetMapping?: Partial<Record<RequirementField, string | null>>

  creator?:
    AnalysisCreatorInput
}


export interface DefectAnalysisRequest {
  defect_id?:
    string | null

  defect_text: string

  top_k?: number
  min_relevance?: number
}


export interface DefectCandidate {
  change_id: string

  old_requirement_id:
    string | null

  new_requirement_id:
    string | null

  old_requirement_text:
    string | null

  new_requirement_text:
    string | null

  detailed_change_types:
    string[]

  change_type: string

  risk_score: number
  risk_level: string

  confidence:
    number | null

  semantic_similarity:
    number

  keyword_overlap:
    number

  relevance_score:
    number

  rank: number

  reason: string
}


export interface DefectAnalysisResponse {
  analysis_id: number
  analysis_name: string

  defect_id: string
  defect_text: string

  candidate_count: number

  candidates:
    DefectCandidate[]
}




async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data =
      await response.json()

    if (
      data
      && typeof data.detail
      === 'string'
    ) {
      return data.detail
    }

    if (
      data
      && Array.isArray(
        data.detail,
      )
    ) {
      return data.detail
        .map(
          (
            item:
              {
                msg?: string
              },
          ) =>
            item.msg
            ?? 'Geçersiz istek.',
        )
        .join(' ')
    }

  } catch {
  }

  return fallback
}


async function getJson<T>(
  url: string,
  fallbackError: string,
  options?: RequestInit,
): Promise<T> {
  const response =
    await fetch(
      url,
      options,
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        fallbackError,
      ),
    )
  }

  return (
    await response.json()
  ) as T
}




export async function getHealth():
Promise<HealthResponse> {
  return getJson<HealthResponse>(
    `${API_BASE_URL}/health`,
    'Backend bağlantısı kurulamadı.',
  )
}




export async function getAnalyses():
Promise<AnalysisSummary[]> {
  return getJson<
    AnalysisSummary[]
  >(
    `${API_BASE_URL}/analyses`,
    'Analiz listesi alınamadı.',
  )
}


export async function getAnalysis(
  analysisId: number,
): Promise<AnalysisDetail> {
  return getJson<
    AnalysisDetail
  >(
    `${API_BASE_URL}/analyses/${analysisId}`,
    'Analiz detayları alınamadı.',
  )
}




export async function previewRequirementFile(
  file: File,
): Promise<RequirementFilePreview> {
  const formData = new FormData()
  formData.append('file', file)

  return getJson<RequirementFilePreview>(
    `${API_BASE_URL}/requirements/preview`,
    'Gereksinim dosyası önizlenemedi.',
    {
      method: 'POST',
      body: formData,
    },
  )
}


export async function compareRequirementFiles(
  sourceOrInput:
    | File
    | CompareRequirementFilesInput
    | string,

  targetOrSource?: File,

  nameOrTarget?:
    | string
    | File,

  creator?:
    AnalysisCreatorInput,
): Promise<AnalysisDetail> {
  let sourceFile: File
  let targetFile: File

  let analysisName = ''

  let sourceSheet = ''
  let targetSheet = ''

  let sourceMapping:
    Partial<Record<RequirementField, string | null>> = {}

  let targetMapping:
    Partial<Record<RequirementField, string | null>> = {}

  let creatorInput =
    creator


  if (
    typeof sourceOrInput
      === 'object'
    && !(
      sourceOrInput
      instanceof File
    )
    && 'sourceFile'
      in sourceOrInput
  ) {
    sourceFile =
      sourceOrInput.sourceFile

    targetFile =
      sourceOrInput.targetFile

    analysisName =
      sourceOrInput.analysisName
      ?? ''

    sourceSheet =
      sourceOrInput.sourceSheet
      ?? ''

    targetSheet =
      sourceOrInput.targetSheet
      ?? ''

    sourceMapping =
      sourceOrInput.sourceMapping
      ?? {}

    targetMapping =
      sourceOrInput.targetMapping
      ?? {}

    creatorInput =
      sourceOrInput.creator

  } else if (
    sourceOrInput
    instanceof File
  ) {
    if (
      !(
        targetOrSource
        instanceof File
      )
    ) {
      throw new Error(
        'Hedef gereksinim dosyası eksik.',
      )
    }

    sourceFile =
      sourceOrInput

    targetFile =
      targetOrSource

    analysisName =
      typeof nameOrTarget
        === 'string'
        ? nameOrTarget
        : ''

  } else {
    if (
      !(
        targetOrSource
        instanceof File
      )
      || !(
        nameOrTarget
        instanceof File
      )
    ) {
      throw new Error(
        'Kaynak veya hedef '
        + 'gereksinim dosyası eksik.',
      )
    }

    analysisName =
      sourceOrInput

    sourceFile =
      targetOrSource

    targetFile =
      nameOrTarget
  }


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


  formData.append(
    'analysis_name',
    analysisName.trim(),
  )


  if (sourceSheet) {
    formData.append(
      'source_sheet',
      sourceSheet,
    )
  }

  if (targetSheet) {
    formData.append(
      'target_sheet',
      targetSheet,
    )
  }

  formData.append(
    'source_mapping_json',
    JSON.stringify(sourceMapping),
  )

  formData.append(
    'target_mapping_json',
    JSON.stringify(targetMapping),
  )


  if (creatorInput) {
    formData.append(
      'created_by_user_id',
      creatorInput
        .userId
        .trim(),
    )

    formData.append(
      'created_by_name',
      creatorInput
        .fullName
        .trim(),
    )

    formData.append(
      'created_by_email',
      creatorInput
        .corporateEmail
        .trim(),
    )

    formData.append(
      'created_by_department',
      creatorInput
        .department
        .trim(),
    )

    formData.append(
      'created_by_role',
      creatorInput
        .role
        .trim(),
    )
  }


  return getJson<
    AnalysisDetail
  >(
    `${API_BASE_URL}/analyses/compare`,
    'Dosyalar karşılaştırılamadı.',
    {
      method: 'POST',
      body: formData,
    },
  )
}




export async function analyzeDefect(
  analysisId: number,

  requestOrText:
    | DefectAnalysisRequest
    | string,

  topK = 5,

  minRelevance = 0,

  defectId?: string,
): Promise<DefectAnalysisResponse> {
  const payload:
    DefectAnalysisRequest =
    typeof requestOrText
      === 'string'
      ? {
          defect_id:
            defectId
            ?? null,

          defect_text:
            requestOrText,

          top_k:
            topK,

          min_relevance:
            minRelevance,
        }
      : {
          defect_id:
            requestOrText
              .defect_id
            ?? null,

          defect_text:
            requestOrText
              .defect_text,

          top_k:
            requestOrText
              .top_k
            ?? 5,

          min_relevance:
            requestOrText
              .min_relevance
            ?? 0,
        }


  return getJson<
    DefectAnalysisResponse
  >(
    `${API_BASE_URL}/analyses/${analysisId}/defect-rankings`,
    'Defect analizi gerçekleştirilemedi.',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify(
        payload,
      ),
    },
  )
}


export const rankDefectChanges =
  analyzeDefect

export const analyzeDefectChanges =
  analyzeDefect

export const createDefectRanking =
  analyzeDefect




export async function getHistoryCatalog():
Promise<HistoryCatalog> {
  return getJson<
    HistoryCatalog
  >(
    `${API_BASE_URL}/history/requirements`,
    'Requirement geçmiş listesi alınamadı.',
  )
}


export async function getRequirementHistory(
  requirementId: string,
): Promise<RequirementHistory> {
  return getJson<
    RequirementHistory
  >(
    `${API_BASE_URL}/history/requirements/${encodeURIComponent(
      requirementId,
    )}`,
    'Requirement geçmişi alınamadı.',
  )
}




function getDownloadFilename(
  response: Response,
  analysisId: number,
): string {
  const contentDisposition =
    response.headers.get(
      'content-disposition',
    )

  if (
    contentDisposition
  ) {
    const utfMatch =
      contentDisposition.match(
        /filename\*=UTF-8''([^;]+)/i,
      )

    if (
      utfMatch
      && utfMatch[1]
    ) {
      return decodeURIComponent(
        utfMatch[1],
      )
    }

    const filenameMatch =
      contentDisposition.match(
        /filename="?([^";]+)"?/i,
      )

    if (
      filenameMatch
      && filenameMatch[1]
    ) {
      return filenameMatch[1]
    }
  }

  return (
    `ScopeDiff_Analysis_`
    + `${analysisId}.xlsx`
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
      await getErrorMessage(
        response,
        'Excel raporu indirilemedi.',
      ),
    )
  }

  const blob =
    await response.blob()

  const filename =
    getDownloadFilename(
      response,
      analysisId,
    )

  const objectUrl =
    URL.createObjectURL(
      blob,
    )

  const link =
    document.createElement(
      'a',
    )

  link.href =
    objectUrl

  link.download =
    filename

  document.body.appendChild(
    link,
  )

  link.click()

  link.remove()

  URL.revokeObjectURL(
    objectUrl,
  )
}




export async function deleteAnalysis(
  analysisId: number,
): Promise<void> {
  const response =
    await fetch(
      `${API_BASE_URL}/analyses/${analysisId}`,
      {
        method: 'DELETE',
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Analiz silinemedi.',
      ),
    )
  }
}
