import {
  ArrowDown,
  CheckCircle2,
  FileText,
  GitBranch,
  History,
  Layers3,
  ShieldAlert,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './HistoryPage.css'

import {
  getHistoryCatalog,
  getRequirementHistory,
} from '../services/api'

import type {
  HistoryCatalog,
  RequirementHistory,
} from '../types/api'


function formatChangeType(
  value: string,
): string {
  if (
    !value
    || value.toLowerCase()
      === 'baseline'
  ) {
    return 'Baseline'
  }

  return value
    .replaceAll(
      '_',
      ' ',
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    )
}


function formatRisk(
  value: string | null,
): string {

  if (!value) {
    return 'Yok'
  }

  const labels:
    Record<string, string> = {
      none: 'Yok',
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      critical: 'Kritik',
    }

  return (
    labels[
      value.toLowerCase()
    ]
    ?? value
  )
}


function HistoryPage() {
  const [
    catalog,
    setCatalog,
  ] = useState<
    HistoryCatalog | null
  >(null)

  const [
    selectedModule,
    setSelectedModule,
  ] = useState(
    'all',
  )

  const [
    selectedRequirementId,
    setSelectedRequirementId,
  ] = useState(
    '',
  )

  const [
    historyDetail,
    setHistoryDetail,
  ] = useState<
    RequirementHistory | null
  >(null)

  const [
    loadingCatalog,
    setLoadingCatalog,
  ] = useState(
    true,
  )

  const [
    loadingHistory,
    setLoadingHistory,
  ] = useState(
    false,
  )

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)


  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingCatalog(
          true,
        )

        setError(
          null,
        )

        const response =
          await getHistoryCatalog()

        setCatalog(
          response,
        )

        if (
          response
            .requirements
            .length > 0
        ) {
          setSelectedRequirementId(
            response
              .requirements[0]
              .requirement_id,
          )
        }

      } catch (
        caughtError
      ) {

        if (
          caughtError
          instanceof Error
        ) {
          setError(
            caughtError.message,
          )

        } else {
          setError(
            'Geçmiş verileri yüklenemedi.',
          )
        }

      } finally {
        setLoadingCatalog(
          false,
        )
      }
    }

    void loadCatalog()
  }, [])


  const filteredRequirements =
    useMemo(
      () => {

        if (!catalog) {
          return []
        }

        if (
          selectedModule
          === 'all'
        ) {
          return (
            catalog.requirements
          )
        }

        return (
          catalog
            .requirements
            .filter(
              (item) =>
                item.module
                === selectedModule,
            )
        )

      },
      [
        catalog,
        selectedModule,
      ],
    )


  useEffect(() => {
    if (
      filteredRequirements
        .length === 0
    ) {
      setSelectedRequirementId(
        '',
      )

      setHistoryDetail(
        null,
      )

      return
    }

    const stillExists =
      filteredRequirements.some(
        (item) =>
          item.requirement_id
          === selectedRequirementId,
      )

    if (!stillExists) {
      setSelectedRequirementId(
        filteredRequirements[0]
          .requirement_id,
      )
    }

  }, [
    filteredRequirements,
    selectedRequirementId,
  ])


  useEffect(() => {
    if (
      !selectedRequirementId
    ) {
      return
    }

    async function loadHistory(
      requirementId: string,
    ) {
      try {
        setLoadingHistory(
          true,
        )

        setError(
          null,
        )

        const response =
          await getRequirementHistory(
            requirementId,
          )

        setHistoryDetail(
          response,
        )

      } catch (
        caughtError
      ) {

        if (
          caughtError
          instanceof Error
        ) {
          setError(
            caughtError.message,
          )

        } else {
          setError(
            'Gereksinim geçmişi yüklenemedi.',
          )
        }

      } finally {
        setLoadingHistory(
          false,
        )
      }
    }

    void loadHistory(
      selectedRequirementId,
    )

  }, [
    selectedRequirementId,
  ])


  if (loadingCatalog) {
    return (
      <div className="dashboard-message">
        Versiyon geçmişi yükleniyor...
      </div>
    )
  }


  if (
    !catalog
    || catalog
      .requirements
      .length === 0
  ) {
    return (
      <div className="empty-dashboard">

        <History
          size={38}
        />

        <h2>
          Versiyon geçmişi bulunamadı
        </h2>

        <p>
          History veri setinde
          gösterilecek gereksinim
          bulunmuyor.
        </p>

      </div>
    )
  }


  return (
    <div className="history-page">

      <section className="history-header">

        <div>

          <span className="section-label">
            GEREKSİNİM GEÇMİŞİ
          </span>

          <h2>
            Requirement Version Timeline
          </h2>

          <p>
            Bir gereksinimin zaman
            içindeki sürümlerini,
            geçişlerini ve riskli
            değişikliklerini incele.
          </p>

        </div>

      </section>


      <section className="history-filter-card">

        <div>

          <label htmlFor="history-module">
            MODÜL
          </label>

          <select
            id="history-module"
            value={
              selectedModule
            }
            onChange={
              (event) =>
                setSelectedModule(
                  event
                    .target
                    .value,
                )
            }
          >

            <option value="all">
              Tüm Modüller
            </option>

            {catalog.modules.map(
              (module) => (
                <option
                  key={module}
                  value={module}
                >
                  {module}
                </option>
              ),
            )}

          </select>

        </div>


        <div>

          <label htmlFor="history-requirement">
            REQUIREMENT
          </label>

          <select
            id="history-requirement"
            value={
              selectedRequirementId
            }
            onChange={
              (event) =>
                setSelectedRequirementId(
                  event
                    .target
                    .value,
                )
            }
          >

            {filteredRequirements.map(
              (requirement) => (
                <option
                  key={
                    requirement
                      .requirement_id
                  }
                  value={
                    requirement
                      .requirement_id
                  }
                >
                  {
                    requirement
                      .requirement_id
                  }
                  {' — '}
                  {
                    requirement
                      .module
                  }
                </option>
              ),
            )}

          </select>

        </div>

      </section>


      {error && (
        <div className="dashboard-message error">
          {error}
        </div>
      )}


      {loadingHistory && (
        <div className="dashboard-message">
          Timeline yükleniyor...
        </div>
      )}


      {!loadingHistory
        && historyDetail
        && (
          <>

            <section className="history-kpi-grid">

              <article className="history-kpi-card">

                <div className="history-kpi-icon blue">
                  <Layers3
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    Versiyon
                  </span>

                  <strong>
                    {
                      historyDetail
                        .summary
                        .version_count
                    }
                  </strong>
                </div>

              </article>


              <article className="history-kpi-card">

                <div className="history-kpi-icon orange">
                  <GitBranch
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    Geçiş
                  </span>

                  <strong>
                    {
                      historyDetail
                        .summary
                        .transition_count
                    }
                  </strong>
                </div>

              </article>


              <article className="history-kpi-card">

                <div className="history-kpi-icon red">
                  <ShieldAlert
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    En Yüksek Risk
                  </span>

                  <strong className="history-risk-text">
                    {
                      formatRisk(
                        historyDetail
                          .summary
                          .highest_risk,
                      )
                    }
                  </strong>
                </div>

              </article>


              <article className="history-kpi-card">

                <div className="history-kpi-icon green">
                  <CheckCircle2
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    Güncel Versiyon
                  </span>

                  <strong>
                    v{
                      historyDetail
                        .summary
                        .latest_version
                    }
                  </strong>
                </div>

              </article>

            </section>


            <section className="history-current-card">

              <div className="history-current-top">

                <div>

                  <span className="history-mini-label">
                    {
                      historyDetail
                        .summary
                        .module
                    }
                  </span>

                  <h3>
                    {
                      historyDetail
                        .summary
                        .requirement_id
                    }
                  </h3>

                </div>


                <div className="history-change-tags">

                  {historyDetail
                    .summary
                    .change_types
                    .map(
                      (type) => (
                        <span
                          key={type}
                        >
                          {
                            formatChangeType(
                              type,
                            )
                          }
                        </span>
                      ),
                    )}

                </div>

              </div>


              <div className="history-current-text">

                <FileText
                  size={17}
                />

                <div>

                  <span>
                    GÜNCEL GEREKSİNİM
                  </span>

                  <p>
                    {
                      historyDetail
                        .summary
                        .current_text
                    }
                  </p>

                </div>

              </div>

            </section>


            <section className="history-section-title">

              <div>

                <h3>
                  Versiyon Timeline
                </h3>

                <p>
                  İlk sürümden güncel
                  sürüme kadar
                  gereksinim evrimi
                </p>

              </div>


              <span>
                v{
                  historyDetail
                    .summary
                    .first_version
                }
                {' → '}
                v{
                  historyDetail
                    .summary
                    .latest_version
                }
              </span>

            </section>


            <section className="history-timeline">

              {historyDetail
                .timeline
                .map(
                  (
                    item,
                    index,
                  ) => {

                    const riskClass =
                      item
                        .risk_level
                        .toLowerCase()

                    return (
                      <div
                        key={
                          `${item.requirement_id}-${item.version}`
                        }
                        className="history-timeline-group"
                      >

                        {index > 0 && (
                          <div className="history-transition">

                            <div className="history-transition-line">

                              <ArrowDown
                                size={16}
                              />

                            </div>


                            <div className="history-transition-card">

                              <div className="history-transition-top">

                                <span className="history-transition-id">
                                  {
                                    item.transition_id
                                    ?? 'Transition'
                                  }
                                </span>


                                <span className="history-type-badge">
                                  {
                                    formatChangeType(
                                      item
                                        .change_type,
                                    )
                                  }
                                </span>


                                <span
                                  className={
                                    `history-risk-badge ${riskClass}`
                                  }
                                >
                                  {
                                    formatRisk(
                                      item
                                        .risk_level,
                                    )
                                  }
                                </span>

                              </div>


                              <p>
                                {
                                  item
                                    .change_explanation
                                }
                              </p>

                            </div>

                          </div>
                        )}


                        <article
                          className={
                            `history-version-card ${
                              item
                                .is_current_version
                                ? 'current'
                                : ''
                            }`
                          }
                        >

                          <div className="history-version-index">
                            {
                              index + 1
                            }
                          </div>


                          <div className="history-version-content">

                            <div className="history-version-header">

                              <div>

                                <span>
                                  VERSİYON
                                </span>

                                <h4>
                                  {
                                    item
                                      .version_label
                                  }
                                </h4>

                              </div>


                              <div className="history-version-status">

                                {item
                                  .is_initial_version
                                  && (
                                    <span className="initial">
                                      İlk Versiyon
                                    </span>
                                  )}


                                {item
                                  .is_current_version
                                  && (
                                    <span className="current">
                                      Güncel
                                    </span>
                                  )}

                              </div>

                            </div>


                            <p className="history-requirement-text">
                              {
                                item
                                  .requirement_text
                              }
                            </p>

                          </div>

                        </article>

                      </div>
                    )
                  },
                )}

            </section>

          </>
        )}

    </div>
  )
}


export default HistoryPage