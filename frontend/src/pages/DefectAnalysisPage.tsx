import {
  AlertTriangle,
  ArrowRight,
  Bug,
  CheckCircle2,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './DefectAnalysisPage.css'

import {
  analyzeDefect,
  getAnalyses,
} from '../services/api'

import type {
  AnalysisSummary,
  DefectAnalysisResult,
  DefectCandidate,
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
  const labels:
    Record<string, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      critical: 'Kritik',
    }

  return (
    labels[value.toLowerCase()]
    ?? value
  )
}


function scorePercent(
  value: number,
): string {
  return `${(
    value * 100
  ).toFixed(0)}%`
}


function visibleTypes(
  candidate: DefectCandidate,
): string[] {
  if (
    candidate
      .detailed_change_types
      .length > 0
  ) {
    return candidate
      .detailed_change_types
  }

  return [
    candidate.change_type,
  ]
}


function DefectAnalysisPage() {
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
    defectText,
    setDefectText,
  ] = useState('')

  const [
    topK,
    setTopK,
  ] = useState(5)

  const [
    result,
    setResult,
  ] = useState<
    DefectAnalysisResult | null
  >(null)

  const [
    loadingAnalyses,
    setLoadingAnalyses,
  ] = useState(true)

  const [
    analyzing,
    setAnalyzing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)


  useEffect(() => {
    async function load() {
      try {
        setLoadingAnalyses(true)

        const response =
          await getAnalyses()

        setAnalyses(
          response,
        )

        if (
          response.length > 0
        ) {
          setSelectedAnalysisId(
            response[0].id,
          )
        }

      } catch {
        setError(
          'Analiz listesi yüklenemedi.',
        )

      } finally {
        setLoadingAnalyses(false)
      }
    }

    void load()
  }, [])


  const selectedAnalysis =
    useMemo(
      () =>
        analyses.find(
          (analysis) =>
            analysis.id
            === selectedAnalysisId,
        )
        ?? null,
      [
        analyses,
        selectedAnalysisId,
      ],
    )


  async function handleAnalyze() {
    if (
      typeof selectedAnalysisId
      !== 'number'
    ) {
      setError(
        'Önce bir analiz seçmelisin.',
      )

      return
    }

    if (
      defectText.trim()
        .length < 3
    ) {
      setError(
        'Defect açıklaması en az 3 karakter olmalı.',
      )

      return
    }

    try {
      setAnalyzing(true)
      setError(null)
      setResult(null)

      const response =
        await analyzeDefect(
          selectedAnalysisId,
          defectText,
          topK,
        )

      setResult(
        response,
      )

    } catch (caughtError) {
      if (
        caughtError
        instanceof Error
      ) {
        setError(
          caughtError.message,
        )
      } else {
        setError(
          'Defect analizi tamamlanamadı.',
        )
      }

    } finally {
      setAnalyzing(false)
    }
  }


  if (loadingAnalyses) {
    return (
      <div className="dashboard-message">
        Analizler yükleniyor...
      </div>
    )
  }


  if (
    analyses.length === 0
  ) {
    return (
      <div className="empty-dashboard">

        <Bug
          size={38}
        />

        <h2>
          Analiz bulunmuyor
        </h2>

        <p>
          Defect analizi yapmadan
          önce iki gereksinim
          versiyonunu karşılaştır.
        </p>

      </div>
    )
  }


  return (
    <div className="defect-page">

      <section className="defect-header">

        <div>
          <span className="section-label">
            DEFECT ANALİZİ
          </span>

          <h2>
            Defect ile İlişkili
            Değişiklikleri Önceliklendir
          </h2>

          <p>
            Defect açıklamasını seçili
            gereksinim değişiklikleriyle
            anlamsal olarak karşılaştır.
            Sonuçlar kesin kök neden
            değildir; incelenmesi gereken
            aday değişikliklerdir.
          </p>
        </div>


        <div className="defect-analysis-select">

          <label htmlFor="defect-analysis">
            ANALİZ
          </label>

          <select
            id="defect-analysis"
            value={
              selectedAnalysisId
              ?? ''
            }
            disabled={
              analyzing
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

                setResult(null)
                setError(null)
              }
            }
          >
            {analyses.map(
              (analysis) => (
                <option
                  key={analysis.id}
                  value={analysis.id}
                >
                  {
                    analysis
                      .analysis_name
                  }
                </option>
              ),
            )}
          </select>

        </div>

      </section>


      {selectedAnalysis && (
        <section className="defect-context-card">

          <div>
            <span>
              KAYNAK
            </span>

            <strong>
              {
                selectedAnalysis
                  .source_version
                ?? '—'
              }
            </strong>
          </div>

          <ArrowRight
            size={18}
          />

          <div>
            <span>
              HEDEF
            </span>

            <strong>
              {
                selectedAnalysis
                  .target_version
                ?? '—'
              }
            </strong>
          </div>

          <div className="defect-context-count">
            <span>
              ANALİZ EDİLECEK DEĞİŞİKLİK
            </span>

            <strong>
              {
                selectedAnalysis
                  .requirement_change_count
              }
            </strong>
          </div>

        </section>
      )}


      <section className="defect-input-card">

        <div className="defect-input-heading">

          <div className="defect-input-icon">
            <Bug
              size={20}
            />
          </div>

          <div>
            <h3>
              Defect Açıklaması
            </h3>

            <p>
              Hata kaydındaki davranışı,
              belirtileri ve ilgili
              bağlamı mümkün olduğunca
              açık yaz.
            </p>
          </div>

        </div>


        <textarea
          value={
            defectText
          }
          disabled={
            analyzing
          }
          maxLength={5000}
          placeholder={
            'Örn. Aktivasyon sırasında port doğrulaması tamamlanmadan kaynak rezervasyonu yapılabiliyor...'
          }
          onChange={
            (event) =>
              setDefectText(
                event
                  .target
                  .value,
              )
          }
        />


        <div className="defect-input-footer">

          <span>
            {
              defectText.length
            } / 5000
          </span>


          <div className="defect-input-actions">

            <label>
              TOP-K

              <select
                value={
                  topK
                }
                disabled={
                  analyzing
                }
                onChange={
                  (event) =>
                    setTopK(
                      Number(
                        event
                          .target
                          .value,
                      ),
                    )
                }
              >
                <option value={3}>
                  3
                </option>

                <option value={5}>
                  5
                </option>

                <option value={10}>
                  10
                </option>
              </select>
            </label>


            <button
              type="button"
              className="defect-analyze-button"
              disabled={
                analyzing
                || defectText
                  .trim()
                  .length < 3
              }
              onClick={
                handleAnalyze
              }
            >

              {analyzing ? (
                <>
                  <Search
                    size={16}
                  />

                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Sparkles
                    size={16}
                  />

                  Defect'i Analiz Et
                </>
              )}

            </button>

          </div>

        </div>

      </section>


      {error && (
        <div className="dashboard-message error">
          {error}
        </div>
      )}


      {result && (
        <>

          <section className="defect-result-summary">

            <div>

              <span className="section-label">
                KARAR DESTEK SONUCU
              </span>

              <h3>
                İncelenmesi Gereken
                Aday Değişiklikler
              </h3>

              <p>
                {
                  result.defect_id
                } için en yüksek
                ilişki skoruna sahip
                değişiklikler
                önceliklendirildi.
              </p>

            </div>


            <div className="defect-result-count">

              <CheckCircle2
                size={18}
              />

              <strong>
                {
                  result
                    .candidate_count
                }
              </strong>

              <span>
                aday
              </span>

            </div>

          </section>


          <section className="defect-candidate-list">

            {result.candidates.map(
              (candidate) => {

                const risk =
                  candidate
                    .risk_level
                    .toLowerCase()

                const types =
                  visibleTypes(
                    candidate,
                  )

                return (
                  <article
                    key={
                      `${result.defect_id}-${candidate.change_id}`
                    }
                    className="defect-candidate-card"
                  >

                    <div className="defect-candidate-top">

                      <div className="defect-rank">

                        <span>
                          #
                          {
                            candidate
                              .rank
                          }
                        </span>

                      </div>


                      <div className="defect-route">

                        <strong>
                          {
                            candidate
                              .old_requirement_id
                            ?? 'Yeni'
                          }
                        </strong>

                        <ArrowRight
                          size={14}
                        />

                        <strong>
                          {
                            candidate
                              .new_requirement_id
                            ?? 'Kaldırıldı'
                          }
                        </strong>

                      </div>


                      <div className="defect-badges">

                        {types.map(
                          (type) => (
                            <span
                              key={
                                `${candidate.change_id}-${type}`
                              }
                              className="change-type-badge"
                            >
                              {
                                formatChangeType(
                                  type,
                                )
                              }
                            </span>
                          ),
                        )}

                        <span
                          className={
                            `comparison-risk-badge ${risk}`
                          }
                        >
                          {
                            formatRiskLevel(
                              candidate
                                .risk_level,
                            )
                          }
                        </span>

                      </div>

                    </div>


                    <div className="defect-score-grid">

                      <div>
                        <span>
                          RELEVANCE
                        </span>

                        <strong>
                          {
                            scorePercent(
                              candidate
                                .relevance_score,
                            )
                          }
                        </strong>
                      </div>


                      <div>
                        <span>
                          SEMANTIC
                        </span>

                        <strong>
                          {
                            scorePercent(
                              candidate
                                .semantic_similarity,
                            )
                          }
                        </strong>
                      </div>


                      <div>
                        <span>
                          KEYWORD
                        </span>

                        <strong>
                          {
                            scorePercent(
                              candidate
                                .keyword_overlap,
                            )
                          }
                        </strong>
                      </div>


                      <div>
                        <span>
                          RİSK
                        </span>

                        <strong>
                          {
                            candidate
                              .risk_score
                              .toFixed(0)
                          }/100
                        </strong>
                      </div>

                    </div>


                    <div className="defect-requirement-diff">

                      <div className="defect-requirement old">

                        <span>
                          ÖNCEKİ GEREKSİNİM
                        </span>

                        <p>
                          {
                            candidate
                              .old_requirement_text
                            ?? 'Önceki metin bulunmuyor.'
                          }
                        </p>

                      </div>


                      <ArrowRight
                        className="defect-diff-arrow"
                        size={17}
                      />


                      <div className="defect-requirement new">

                        <span>
                          YENİ GEREKSİNİM
                        </span>

                        <p>
                          {
                            candidate
                              .new_requirement_text
                            ?? 'Yeni metin bulunmuyor.'
                          }
                        </p>

                      </div>

                    </div>


                    <div className="defect-reason">

                      <div>
                        <ShieldAlert
                          size={15}
                        />

                        <span>
                          NEDEN ADAY?
                        </span>
                      </div>

                      <p>
                        {
                          candidate
                            .reason
                        }
                      </p>

                    </div>

                  </article>
                )
              },
            )}

          </section>

        </>
      )}


      {!result && !analyzing && (
        <section className="defect-empty-state">

          <AlertTriangle
            size={25}
          />

          <div>
            <strong>
              Henüz defect analizi yapılmadı
            </strong>

            <p>
              Bir defect açıklaması
              girerek seçili analizdeki
              değişiklikleri
              önceliklendirebilirsin.
            </p>
          </div>

        </section>
      )}

    </div>
  )
}


export default DefectAnalysisPage