import { useEffect, useState } from 'react'
import './App.css'

import { getHealth } from './services/api'

type ConnectionStatus =
  | 'checking'
  | 'connected'
  | 'error'

function App() {
  const [status, setStatus] =
    useState<ConnectionStatus>('checking')

  const [serviceName, setServiceName] =
    useState('ScopeDiff AI')

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await getHealth()

        setServiceName(response.service)
        setStatus('connected')
      } catch {
        setStatus('error')
      }
    }

    checkBackend()
  }, [])

  return (
    <main className="app">
      <section className="status-card">
        <span className="eyebrow">
          AI-Assisted Requirement Analysis
        </span>

        <h1>{serviceName}</h1>

        <p className="description">
          Semantic requirement comparison,
          risk analysis and defect-to-change
          decision support.
        </p>

        <div className={`connection ${status}`}>
          <span className="status-dot" />

          {status === 'checking' &&
            'Checking backend...'}

          {status === 'connected' &&
            'Backend connected'}

          {status === 'error' &&
            'Backend connection failed'}
        </div>
      </section>
    </main>
  )
}

export default App