import type {
  CreateWorkItemInput,
  ProcessImportResponse,
  ProcessStage,
  ProcessTrackingSummary,
  WorkItem,
  WorkItemStageHistory,
} from '../types/processTracking'

import type { Notification } from '../types/notifications'


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  ?? 'http://127.0.0.1:8001'


export interface ProcessActor {
  role: string
  userId?: string
  name?: string
}


function headerSafeValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return value
    .replace(/[ıİ]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
}


export async function getNotifications(
  userName: string,
  unreadOnly = false,
): Promise<Notification[]> {
  const params = new URLSearchParams()
  if (unreadOnly) {
    params.set('unread_only', 'true')
  }

  const response = await fetch(
    `${API_BASE_URL}/process-tracking/notifications?${params.toString()}`,
    {
      headers: {
        'X-User-Name': headerSafeValue(userName) ?? 'unknown',
      },
    },
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}


export async function markNotificationRead(
  notificationId: number,
  userName: string,
): Promise<Notification> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      headers: {
        'X-User-Name': headerSafeValue(userName) ?? 'unknown',
      },
    },
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}


function actorHeaders(actor?: ProcessActor): HeadersInit {
  if (!actor) {
    return {}
  }

  return {
    'X-User-Role': headerSafeValue(actor.role) ?? 'unknown',
    ...(headerSafeValue(actor.userId) ? { 'X-User-Id': headerSafeValue(actor.userId) } : {}),
    ...(headerSafeValue(actor.name) ? { 'X-User-Name': headerSafeValue(actor.name) } : {}),
  }
}


async function getErrorMessage(
  response: Response,
): Promise<string> {
  try {
    const body =
      await response.json()

    if (
      typeof body?.detail
      === 'string'
    ) {
      return body.detail
    }

  } catch {
  }

  return (
    `İstek başarısız oldu. `
    + `HTTP ${response.status}`
  )
}


export async function getProcessItems():
Promise<WorkItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/items`,
  )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    )
  }

  return response.json()
}


export async function getProcessSummary():
Promise<ProcessTrackingSummary> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/summary`,
  )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    )
  }

  return response.json()
}


export async function importProcessExcel(
  file: File,
): Promise<ProcessImportResponse> {
  const formData =
    new FormData()

  formData.append(
    'file',
    file,
  )

  const response = await fetch(
    `${API_BASE_URL}/process-tracking/import-excel`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    )
  }

  return response.json()
}


export async function updateWorkItemAssignment(
  itemId: number,
  developer: string | null,
  analyst: string | null,
): Promise<WorkItem> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/items/${itemId}/assignment`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        developer,
        analyst,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    )
  }

  return response.json()
}


export async function linkWorkItemAnalysis(
  itemId: number,
  analysisRunId: number | null,
): Promise<WorkItem> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/items/${itemId}/analysis`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        analysis_run_id:
          analysisRunId,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    )
  }

  return response.json()
}


export async function updateWorkItemStage(
  itemId: number,
  stage: ProcessStage | null,
): Promise<WorkItem> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/items/${itemId}/stage`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        stage,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    )
  }

  return response.json()
}


export async function deleteWorkItem(
  itemId: number,
  actor?: ProcessActor,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/items/${itemId}`,
    {
      method: 'DELETE',
      headers: actorHeaders(actor),
    },
  )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    )
  }
}


export async function createWorkItem(
  input: CreateWorkItemInput,
  actor?: ProcessActor,
): Promise<WorkItem> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/items`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...actorHeaders(actor),
      },
      body: JSON.stringify(input),
    },
  )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    )
  }

  return response.json()
}


export async function updateWorkItem(
  itemId: number,
  input: CreateWorkItemInput,
  actor?: ProcessActor,
): Promise<WorkItem> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/items/${itemId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...actorHeaders(actor),
      },
      body: JSON.stringify(input),
    },
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}


export async function getWorkItemHistory(
  itemId: number,
): Promise<WorkItemStageHistory[]> {
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/items/${itemId}/history`,
  )

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}


export async function exportProcessExcel(
  filters?: { search?: string; stage?: string },
): Promise<Blob> {
  const params = new URLSearchParams()

  if (filters?.search?.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters?.stage && filters.stage !== 'all') {
    params.set('stage', filters.stage)
  }

  const query = params.toString()
  const response = await fetch(
    `${API_BASE_URL}/process-tracking/export-excel${query ? `?${query}` : ''}`,
  )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    )
  }

  return response.blob()
}
