import {
  AlertTriangle,
  Bug,
  GitCompare,
  ShieldAlert,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import {
  getAnalyses,
  getAnalysis,
} from '../services/api'

import type {
  AnalysisDetail,
  AnalysisSummary,
} from '../types/api'


const CHANGE_COLORS = [
  '#2563eb',
  '#06b6d4',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#10b981',
  '#ef4444',
  '#64748b',
]

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}


function formatChangeType(
  value: string,
) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}


function DashboardPage() {
  const [analyses, setAnalyses] =
    useState<AnalysisSummary[]>([])

  const [selectedAnalysisId, setSelectedAnalysisId] =
    useState<number | null>(null)

  const [analysis, setAnalysis] =
    useState<AnalysisDetail | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)


  useEffect(() => {
    async function loadAnalyses() {
      try {
        setLoading(true)

        const result =
          await getAnalyses()

        setAnalyses(result)

        if (result.length > 0) {
          setSelectedAnalysisId(
            result[0].id,
          )
        }
      } catch {
        setError(
          'Analiz listesi yüklenemedi.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadAnalyses()
  }, [])


  useEffect(() => {
    if (selectedAnalysisId === null) {
      return
    }

    async function loadDetail() {
      try {
        setLoading(true)
        setError(null)

        const result =
          await getAnalysis(
            selectedAnalysisId!,
          )

        setAnalysis(result)
      } catch {
        setError(
          'Analiz detayları yüklenemedi.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadDetail()
  }, [selectedAnalysisId])


  const metrics = useMemo(() => {
    const changes =
      analysis?.requirement_changes ?? []

    const highRisk = changes.filter(
      (change) =>
        change.risk_level.toLowerCase()
        === 'high',
    ).length

    const criticalRisk = changes.filter(
      (change) =>
        change.risk_level.toLowerCase()
        === 'critical',
    ).length

    return {
      totalChanges: changes.length,
      highRisk,
      criticalRisk,
      defectCandidates:
        analysis?.defect_rankings.length ?? 0,
    }
  }, [analysis])


  const changeDistribution = useMemo(() => {
    const counts = new Map<
      string,
      number
    >()

    for (
      const change
      of analysis?.requirement_changes ?? []
    ) {
      counts.set(
        change.change_type,
        (counts.get(change.change_type) ?? 0)
          + 1,
      )
    }

    return Array.from(
      counts.entries(),
    ).map(([name, value]) => ({
      name: formatChangeType(name),
      value,
    }))
  }, [analysis])


  const riskDistribution = useMemo(() => {
    const counts = new Map<
      string,
      number
    >()

    for (
      const change
      of analysis?.requirement_changes ?? []
    ) {
      const risk =
        change.risk_level.toLowerCase()

      counts.set(
        risk,
        (counts.get(risk) ?? 0) + 1,
      )
    }

    return [
      'critical',
      'high',
      'medium',
      'low',
    ]
      .filter((risk) =>
        counts.has(risk),
      )
      .map((risk) => ({
        name:
          risk.charAt(0).toUpperCase()
          + risk.slice(1),
        key: risk,
        value: counts.get(risk) ?? 0,
      }))
  }, [analysis])


  if (loading && analyses.length === 0) {
    return (
      <div className="dashboard-message">
        Analizler yükleniyor...
      </div>
    )
  }


  if (error) {
    return (
      <div className="dashboard-message error">
        {error}
      </div>
    )
  }


  if (analyses.length === 0) {
    return (
      <div className="empty-dashboard">
        <GitCompare size={38} />

        <h2>Henüz analiz bulunmuyor</h2>

        <p>
          Dashboard sonuçlarını görmek için
          önce bir versiyon karşılaştırması
          oluşturmalısın.
        </p>
      </div>
    )
  }


  return (
    <div className="dashboard-page">
      <section className="dashboard-toolbar">
        <div>
          <span className="section-label">
            AKTİF KARŞILAŞTIRMA
          </span>

          <select
            value={
              selectedAnalysisId ?? ''
            }
            onChange={(event) =>
              setSelectedAnalysisId(
                Number(
                  event.target.value,
                ),
              )
            }
          >
            {analyses.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.analysis_name}
                </option>
              ),
            )}
          </select>
        </div>

        {analysis && (
          <div className="version-badge">
            {analysis.source_version ?? '—'}
            <span>→</span>
            {analysis.target_version ?? '—'}
          </div>
        )}
      </section>


      <section className="kpi-grid">
        <article className="kpi-card">
          <div className="kpi-icon blue">
            <GitCompare size={21} />
          </div>

          <span>Toplam Değişiklik</span>

          <strong>
            {metrics.totalChanges}
          </strong>

          <small>
            Karşılaştırmada tespit edildi
          </small>
        </article>


        <article className="kpi-card">
          <div className="kpi-icon orange">
            <AlertTriangle size={21} />
          </div>

          <span>Yüksek Risk</span>

          <strong>
            {metrics.highRisk}
          </strong>

          <small>
            Öncelikli inceleme
          </small>
        </article>


        <article className="kpi-card">
          <div className="kpi-icon red">
            <ShieldAlert size={21} />
          </div>

          <span>Kritik Risk</span>

          <strong>
            {metrics.criticalRisk}
          </strong>

          <small>
            Kritik değişiklik
          </small>
        </article>


        <article className="kpi-card">
          <div className="kpi-icon purple">
            <Bug size={21} />
          </div>

          <span>Defect Adayları</span>

          <strong>
            {metrics.defectCandidates}
          </strong>

          <small>
            Sıralanmış ilişki sonucu
          </small>
        </article>
      </section>


      <section className="chart-grid">
        <article className="dashboard-card">
          <div className="card-heading">
            <div>
              <h2>Değişim Dağılımı</h2>

              <p>
                Tespit edilen değişiklik
                türlerinin dağılımı
              </p>
            </div>
          </div>

          <div className="chart-content">
            <div className="donut-wrapper">
              <ResponsiveContainer
                width="100%"
                height={230}
              >
                <PieChart>
                  <Pie
                    data={
                      changeDistribution
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={91}
                    paddingAngle={3}
                  >
                    {changeDistribution.map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill={
                            CHANGE_COLORS[
                              index
                              % CHANGE_COLORS.length
                            ]
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="donut-center">
                <strong>
                  {metrics.totalChanges}
                </strong>

                <span>değişiklik</span>
              </div>
            </div>

            <div className="chart-legend">
              {changeDistribution.map(
                (item, index) => (
                  <div
                    className="legend-row"
                    key={item.name}
                  >
                    <span
                      className="legend-color"
                      style={{
                        background:
                          CHANGE_COLORS[
                            index
                            % CHANGE_COLORS.length
                          ],
                      }}
                    />

                    <span>
                      {item.name}
                    </span>

                    <strong>
                      {item.value}
                    </strong>
                  </div>
                ),
              )}
            </div>
          </div>
        </article>


        <article className="dashboard-card">
          <div className="card-heading">
            <div>
              <h2>Risk Seviyesi Dağılımı</h2>

              <p>
                Değişikliklerin risk
                seviyelerine göre dağılımı
              </p>
            </div>
          </div>

          <div className="chart-content">
            <div className="donut-wrapper">
              <ResponsiveContainer
                width="100%"
                height={230}
              >
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={91}
                    paddingAngle={3}
                  >
                    {riskDistribution.map(
                      (item) => (
                        <Cell
                          key={item.key}
                          fill={
                            RISK_COLORS[
                              item.key
                            ]
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="donut-center">
                <strong>
                  {metrics.totalChanges}
                </strong>

                <span>analiz</span>
              </div>
            </div>

            <div className="chart-legend">
              {riskDistribution.map(
                (item) => (
                  <div
                    className="legend-row"
                    key={item.key}
                  >
                    <span
                      className="legend-color"
                      style={{
                        background:
                          RISK_COLORS[
                            item.key
                          ],
                      }}
                    />

                    <span>
                      {item.name}
                    </span>

                    <strong>
                      {item.value}
                    </strong>
                  </div>
                ),
              )}
            </div>
          </div>
        </article>
      </section>


      <section className="dashboard-card table-card">
        <div className="card-heading">
          <div>
            <h2>Gereksinim Değişiklikleri</h2>

            <p>
              Analiz sonucunda tespit edilen
              gereksinim değişiklikleri
            </p>
          </div>

          <span className="result-count">
            {
              analysis?.requirement_changes
                .length
            } sonuç
          </span>
        </div>

        <div className="table-wrapper">
          <table className="changes-table">
            <thead>
              <tr>
                <th>Eski ID</th>
                <th>Yeni ID</th>
                <th>Değişim Türü</th>
                <th>Risk</th>
                <th>Risk Skoru</th>
                <th>Confidence</th>
              </tr>
            </thead>

            <tbody>
              {analysis?.requirement_changes
                .slice(0, 10)
                .map((change) => (
                  <tr key={change.id}>
                    <td>
                      {change.old_requirement_id
                        ?? '—'}
                    </td>

                    <td>
                      {change.new_requirement_id
                        ?? '—'}
                    </td>

                    <td>
                      <span className="change-type">
                        {formatChangeType(
                          change.change_type,
                        )}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`risk-badge ${
                          change.risk_level
                            .toLowerCase()
                        }`}
                      >
                        {
                          change.risk_level
                        }
                      </span>
                    </td>

                    <td>
                      {change.risk_score.toFixed(
                        1,
                      )}
                    </td>

                    <td>
                      {change.confidence
                        !== null
                        ? `${(
                            change.confidence
                            * 100
                          ).toFixed(0)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage