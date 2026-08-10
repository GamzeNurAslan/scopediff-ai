import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { getHealth } from '../services/api'

type ApiStatus =
  | 'checking'
  | 'online'
  | 'offline'

const pageTitles: Record<string, string> = {
  '/upload': 'Dosya ve Versiyon Yükleme',
  '/dashboard': 'Analiz Dashboard',
  '/comparison': 'Versiyon Karşılaştırma',
  '/defects': 'Defect Analizi',
  '/history': 'Analiz Geçmişi',
  '/reports': 'Raporlar',
}

function Topbar() {
  const location = useLocation()

  const [apiStatus, setApiStatus] =
    useState<ApiStatus>('checking')

  useEffect(() => {
    async function checkApi() {
      try {
        await getHealth()
        setApiStatus('online')
      } catch {
        setApiStatus('offline')
      }
    }

    checkApi()
  }, [])

  const title =
    pageTitles[location.pathname] ??
    'ScopeDiff AI'

  return (
    <header className="topbar">
      <div>
        <span className="topbar-eyebrow">
          ScopeDiff AI
        </span>

        <h1>{title}</h1>
      </div>

      <div className="topbar-actions">
        <div
          className={`api-status ${apiStatus}`}
        >
          <span className="api-dot" />

          {apiStatus === 'checking' &&
            'API kontrol ediliyor'}

          {apiStatus === 'online' &&
            'API Online'}

          {apiStatus === 'offline' &&
            'API Offline'}
        </div>

        <div className="user-avatar">
          SD
        </div>
      </div>
    </header>
  )
}

export default Topbar