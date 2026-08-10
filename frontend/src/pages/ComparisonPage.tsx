import {
  AlertTriangle,
  ArrowRight,
  GitCompare,
  Search,
  ShieldAlert,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './ComparisonPage.css'

import {
  getAnalyses,
  getAnalysis,
} from '../services/api'

import type {
  AnalysisDetail,
  AnalysisSummary,
  RequirementChange,
} from '../types/api'


function formatChangeType(
  value: string,
): string {
  return value
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    )
}


function formatRiskLevel(
  value: string,
): string {
  const normalized =
    value.toLowerCase()

  const labels:
    Record<string, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      critical: 'Kritik',
    }

  return (
    labels[normalized]
    ?? value
  )
}


function ComparisonPage() {
  const [
    analyses,
    setAnalyses,
  ] = useState<
    AnalysisSummary[]
  >([])

  const [
    selectedAnalysisId,
    setSelectedAnalysisId,
  ] = useState<
    number | null
  >(null)

  const [
    analysis,
    setAnalysis,
  ] = useState<
    AnalysisDetail | null
  >(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('')

  const [
    riskFilter,
    setRiskFilter,
  ] = useState('all')

  const [
    changeTypeFilter,
    setChangeTypeFilter,
  ] = useState('all')


  // =====================================================
  // ANALİZ LİSTESİNİ GETİR
  // =====================================================

  useEffect(() => {
    async function loadAnalyses() {
      try {
        setLoading(true)
        setError(null)

        const result =
          await getAnalyses()

        setAnalyses(
          result,
        )

        if (
          result.length > 0
        ) {
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

    void loadAnalyses()
  }, [])


  // =====================================================
  // SEÇİLEN ANALİZİN DETAYINI GETİR
  // =====================================================

  useEffect(() => {
    if (
      typeof selectedAnalysisId
      !== 'number'
    ) {
      return
    }

    async function loadAnalysis(
      analysisId: number,
    ) {
      try {
        setLoading(true)
        setError(null)

        const result =
          await getAnalysis(
            analysisId,
          )

        setAnalysis(
          result,
        )
      } catch {
        setError(
          'Karşılaştırma sonuçları yüklenemedi.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadAnalysis(
      selectedAnalysisId,
    )
  }, [selectedAnalysisId])


  // =====================================================
  // DEĞİŞİM TÜRLERİ
  // =====================================================

  const changeTypes =
    useMemo(() => {
      const types =
        new Set<string>()

      for (
        const change
        of analysis
          ?.requirement_changes
        ?? []
      ) {
        types.add(
          change.change_type,
        )
      }

      return Array.from(
        types,
      ).sort()
    }, [analysis])


  // =====================================================
  // KPI
  // =====================================================

  const metrics =
    useMemo(() => {
      const changes =
        analysis
          ?.requirement_changes
        ?? []

      return {
        total:
          changes.length,

        low:
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'low',
          ).length,

        medium:
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'medium',
          ).length,

        high:
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'high',
          ).length,

        critical:
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'critical',
          ).length,
      }
    }, [analysis])


  // =====================================================
  // FİLTRELENMİŞ SONUÇLAR
  // =====================================================

  const filteredChanges =
    useMemo(() => {
      const changes =
        analysis
          ?.requirement_changes
        ?? []

      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase()

      return changes.filter(
        (
          change:
            RequirementChange,
        ) => {
          const matchesRisk =
            riskFilter
              === 'all'
            || change
              .risk_level
              .toLowerCase()
              === riskFilter

          const matchesType =
            changeTypeFilter
              === 'all'
            || change
              .change_type
              === changeTypeFilter

          const searchableText =
            [
              change
                .old_requirement_id
              ?? '',
              change
                .new_requirement_id
              ?? '',
              change.change_type,
              change.risk_level,
              change.explanation
              ?? '',
            ]
              .join(' ')
              .toLowerCase()

          const matchesSearch =
            !normalizedSearch
            || searchableText
              .includes(
                normalizedSearch,
              )

          return (
            matchesRisk
            && matchesType
            && matchesSearch
          )
        },
      )
    }, [
      analysis,
      searchTerm,
      riskFilter,
      changeTypeFilter,
    ])


  // =====================================================
  // LOADING
  // =====================================================

  if (
    loading
    && analyses.length === 0
  ) {
    return (
      <div className="dashboard-message">
        Karşılaştırmalar
        yükleniyor...
      </div>
    )
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="dashboard-message error">
        {error}
      </div>
    )
  }


  // =====================================================
  // EMPTY
  // =====================================================

  if (
    analyses.length === 0
  ) {
    return (
      <div className="empty-dashboard">
        <GitCompare
          size={38}
        />

        <h2>
          Karşılaştırma bulunmuyor
        </h2>

        <p>
          Önce Yükleme
          ekranından iki
          gereksinim versiyonunu
          karşılaştır.
        </p>
      </div>
    )
  }


  return (
    <div className="comparison-page">

      {/* =========================================
          ÜST ALAN
      ========================================= */}

      <section className="comparison-header">

        <div>
          <span className="section-label">
            VERSİYON KARŞILAŞTIRMA
          </span>

          <h2>
            Gereksinim Değişiklikleri
          </h2>

          <p>
            Seçilen analizde tespit
            edilen değişiklikleri,
            riskleri ve güven
            skorlarını incele.
          </p>
        </div>


        <div className="comparison-analysis-select">

          <label htmlFor="comparison-analysis">
            ANALİZ
          </label>

          <select
            id="comparison-analysis"
            value={
              selectedAnalysisId
              ?? ''
            }
            onChange={
              (event) => {
                setSelectedAnalysisId(
                  Number(
                    event
                      .target
                      .value,
                  ),
                )

                setSearchTerm('')
                setRiskFilter('all')
                setChangeTypeFilter(
                  'all',
                )
              }
            }
          >
            {analyses.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {
                    item
                      .analysis_name
                  }
                </option>
              ),
            )}
          </select>

        </div>

      </section>


      {/* =========================================
          VERSİYON BİLGİSİ
      ========================================= */}

      {analysis && (
        <section className="comparison-version-card">

          <div className="version-box">
            <span>
              KAYNAK
            </span>

            <strong>
              {
                analysis
                  .source_version
                ?? '—'
              }
            </strong>
          </div>


          <div className="version-arrow">
            <ArrowRight
              size={20}
            />
          </div>


          <div className="version-box">
            <span>
              HEDEF
            </span>

            <strong>
              {
                analysis
                  .target_version
                ?? '—'
              }
            </strong>
          </div>


          <div className="comparison-name">
            <span>
              ANALİZ
            </span>

            <strong>
              {
                analysis
                  .analysis_name
              }
            </strong>
          </div>

        </section>
      )}


      {/* =========================================
          KPI
      ========================================= */}

      <section className="comparison-kpi-grid">

        <article className="comparison-kpi-card">
          <div className="comparison-kpi-icon blue">
            <GitCompare
              size={17}
            />
          </div>

          <div>
            <span>
              Toplam
            </span>

            <strong>
              {metrics.total}
            </strong>
          </div>
        </article>


        <article className="comparison-kpi-card">
          <div className="comparison-kpi-icon green">
            <ShieldAlert
              size={17}
            />
          </div>

          <div>
            <span>
              Düşük
            </span>

            <strong>
              {metrics.low}
            </strong>
          </div>
        </article>


        <article className="comparison-kpi-card">
          <div className="comparison-kpi-icon yellow">
            <AlertTriangle
              size={17}
            />
          </div>

          <div>
            <span>
              Orta
            </span>

            <strong>
              {metrics.medium}
            </strong>
          </div>
        </article>


        <article className="comparison-kpi-card">
          <div className="comparison-kpi-icon orange">
            <AlertTriangle
              size={17}
            />
          </div>

          <div>
            <span>
              Yüksek
            </span>

            <strong>
              {metrics.high}
            </strong>
          </div>
        </article>


        <article className="comparison-kpi-card">
          <div className="comparison-kpi-icon red">
            <ShieldAlert
              size={17}
            />
          </div>

          <div>
            <span>
              Kritik
            </span>

            <strong>
              {metrics.critical}
            </strong>
          </div>
        </article>

      </section>


      {/* =========================================
          FİLTRELER
      ========================================= */}

      <section className="comparison-filter-card">

        <div className="comparison-search">

          <Search
            size={16}
          />

          <input
            type="text"
            value={
              searchTerm
            }
            placeholder={
              'Requirement ID, değişim türü veya açıklama ara...'
            }
            onChange={
              (event) =>
                setSearchTerm(
                  event
                    .target
                    .value,
                )
            }
          />

        </div>


        <select
          value={
            riskFilter
          }
          onChange={
            (event) =>
              setRiskFilter(
                event
                  .target
                  .value,
              )
          }
        >
          <option value="all">
            Tüm Riskler
          </option>

          <option value="low">
            Düşük
          </option>

          <option value="medium">
            Orta
          </option>

          <option value="high">
            Yüksek
          </option>

          <option value="critical">
            Kritik
          </option>
        </select>


        <select
          value={
            changeTypeFilter
          }
          onChange={
            (event) =>
              setChangeTypeFilter(
                event
                  .target
                  .value,
              )
          }
        >
          <option value="all">
            Tüm Değişim Türleri
          </option>

          {changeTypes.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {
                  formatChangeType(
                    type,
                  )
                }
              </option>
            ),
          )}
        </select>

      </section>


      {/* =========================================
          SONUÇ BAŞLIĞI
      ========================================= */}

      <section className="comparison-results-heading">

        <div>
          <h3>
            Değişiklik Detayları
          </h3>

          <p>
            Analiz sonucunda
            kaydedilen gerçek
            değişiklik sonuçları
          </p>
        </div>

        <span>
          {
            filteredChanges.length
          } sonuç
        </span>

      </section>


      {/* =========================================
          DEĞİŞİKLİK KARTLARI
      ========================================= */}

      <section className="comparison-change-list">

        {loading ? (
          <div className="comparison-empty-result">
            Analiz detayları
            yükleniyor...
          </div>
        ) : filteredChanges.length
          === 0 ? (

          <div className="comparison-empty-result">
            Seçilen filtrelere
            uygun değişiklik
            bulunamadı.
          </div>

        ) : (

          filteredChanges.map(
            (change) => {

              const risk =
                change
                  .risk_level
                  .toLowerCase()

              return (
                <article
                  key={change.id}
                  className="comparison-change-card"
                >

                  <div className="change-card-top">

                    <div className="change-requirement-route">

                      <span className="requirement-id">
                        {
                          change
                            .old_requirement_id
                          ?? 'Yeni'
                        }
                      </span>

                      <ArrowRight
                        size={15}
                      />

                      <span className="requirement-id target">
                        {
                          change
                            .new_requirement_id
                          ?? 'Kaldırıldı'
                        }
                      </span>

                    </div>


                    <div className="change-card-badges">

                      <span className="change-type-badge">
                        {
                          formatChangeType(
                            change
                              .change_type,
                          )
                        }
                      </span>

                      <span
                        className={
                          `comparison-risk-badge ${risk}`
                        }
                      >
                        {
                          formatRiskLevel(
                            change
                              .risk_level,
                          )
                        }
                      </span>

                    </div>

                  </div>


                  <div className="change-card-metrics">

                    <div>
                      <span>
                        RİSK SKORU
                      </span>

                      <strong>
                        {
                          change
                            .risk_score
                            .toFixed(1)
                        }
                      </strong>
                    </div>


                    <div>
                      <span>
                        CONFIDENCE
                      </span>

                      <strong>
                        {
                          change
                            .confidence
                          !== null
                            ? `${(
                                change
                                  .confidence
                                * 100
                              ).toFixed(0)}%`
                            : '—'
                        }
                      </strong>
                    </div>

                  </div>


                  <div className="change-explanation">

                    <span>
                      RİSK AÇIKLAMASI
                    </span>

                    <p>
                      {
                        change
                          .explanation
                        ?? 'Açıklama bulunmuyor.'
                      }
                    </p>

                  </div>

                </article>
              )
            },
          )

        )}

      </section>

    </div>
  )
}


export default ComparisonPage