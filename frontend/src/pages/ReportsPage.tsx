import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Bug,
  CalendarDays,
  Download,
  FileSpreadsheet,
  GitCompare,
  Loader2,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router'

import './ReportsPage.css'

import {
  deleteAnalysis,
  downloadAnalysisReport,
  getAnalyses,
  getAnalysis,
} from '../services/api'

import type {
  AnalysisDetail,
  AnalysisSummary,
} from '../types/api'



function formatDate(
  value: string,
): string {
  const hasTimezone =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(
      value,
    )

  const normalizedValue =
    hasTimezone
      ? value
      : `${value}Z`

  const date =
    new Date(
      normalizedValue,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'tr-TR',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date)
}


function getInitials(
  value: string | null,
): string {
  if (!value) {
    return '—'
  }

  const parts =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (
    parts.length === 0
  ) {
    return '—'
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toLocaleUpperCase(
        'tr-TR',
      )
  }

  return (
    parts[0][0]
    + parts[
      parts.length - 1
    ][0]
  ).toLocaleUpperCase(
    'tr-TR',
  )
}


function formatChangeType(
  value: string,
): string {
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


function clampPercentage(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(
      100,
      value,
    ),
  )
}



function ReportsPage() {
  const navigate =
    useNavigate()


  const [
    analyses,
    setAnalyses,
  ] = useState<
    AnalysisSummary[]
  >([])


  const [
    latestDetail,
    setLatestDetail,
  ] = useState<
    AnalysisDetail | null
  >(null)


  const [
    loading,
    setLoading,
  ] = useState(
    true,
  )


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
    downloadingId,
    setDownloadingId,
  ] = useState<
    number | null
  >(null)


  const [
    deletingId,
    setDeletingId,
  ] = useState<
    number | null
  >(null)


  const [
    analysisPendingDelete,
    setAnalysisPendingDelete,
  ] = useState<
    AnalysisSummary | null
  >(null)



  useEffect(() => {
    async function loadAnalyses() {
      try {
        setLoading(
          true,
        )

        setError(
          null,
        )


        const result =
          await getAnalyses()


        const ordered =
          [...result].sort(
            (
              left,
              right,
            ) =>
              right.id
              - left.id,
          )


        setAnalyses(
          ordered,
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
            'Analiz raporları yüklenemedi.',
          )
        }

      } finally {
        setLoading(
          false,
        )
      }
    }


    void loadAnalyses()
  }, [])



  const latestAnalysis =
    useMemo(
      () =>
        analyses[0]
        ?? null,
      [
        analyses,
      ],
    )


  useEffect(() => {
    if (
      latestAnalysis
      === null
    ) {
      setLatestDetail(
        null,
      )

      return
    }


    async function loadLatestDetail(
      analysisId: number,
    ) {
      try {
        const detail =
          await getAnalysis(
            analysisId,
          )

        setLatestDetail(
          detail,
        )

      } catch (
        caughtError
      ) {
        setLatestDetail(
          null,
        )

        if (
          caughtError
          instanceof Error
        ) {
          setError(
            caughtError.message,
          )
        }
      }
    }


    void loadLatestDetail(
      latestAnalysis.id,
    )

  }, [
    latestAnalysis,
  ])



  const totalChanges =
    useMemo(
      () =>
        analyses.reduce(
          (
            total,
            analysis,
          ) =>
            total
            + analysis
              .requirement_change_count,
          0,
        ),
      [
        analyses,
      ],
    )


  const totalDefectRankings =
    useMemo(
      () =>
        analyses.reduce(
          (
            total,
            analysis,
          ) =>
            total
            + analysis
              .defect_ranking_count,
          0,
        ),
      [
        analyses,
      ],
    )



  const latestMetrics =
    useMemo(
      () => {
        const changes =
          latestDetail
            ?.requirement_changes
          ?? []


        const low =
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'low',
          ).length


        const medium =
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'medium',
          ).length


        const high =
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'high',
          ).length


        const critical =
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'critical',
          ).length


        const averageRisk =
          changes.length > 0
            ? changes.reduce(
                (
                  total,
                  change,
                ) =>
                  total
                  + change.risk_score,
                0,
              )
              / changes.length
            : 0


        const confidenceValues =
          changes.flatMap(
            (change) =>
              change.confidence
              === null
                ? []
                : [
                    change.confidence,
                  ],
          )


        const averageConfidence =
          confidenceValues.length > 0
            ? confidenceValues.reduce(
                (
                  total,
                  confidence,
                ) =>
                  total
                  + confidence,
                0,
              )
              / confidenceValues.length
              * 100
            : 0


        return {
          total:
            changes.length,

          low,
          medium,
          high,
          critical,

          priority:
            high
            + critical,

          averageRisk,

          averageConfidence,
        }
      },
      [
        latestDetail,
      ],
    )



  const changeProfile =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >()


        const changes =
          latestDetail
            ?.requirement_changes
          ?? []


        for (
          const change
          of changes
        ) {
          const types =
            change
              .detailed_change_types
            && change
              .detailed_change_types
              .length > 0
              ? change
                  .detailed_change_types
              : [
                  change
                    .change_type,
                ]


          for (
            const type
            of types
          ) {
            counts.set(
              type,
              (
                counts.get(
                  type,
                )
                ?? 0
              ) + 1,
            )
          }
        }


        return Array
          .from(
            counts.entries(),
          )
          .map(
            (
              [
                type,
                count,
              ],
            ) => ({
              type,
              label:
                formatChangeType(
                  type,
                ),
              count,
            }),
          )
          .sort(
            (
              left,
              right,
            ) =>
              right.count
              - left.count,
          )
          .slice(
            0,
            6,
          )
      },
      [
        latestDetail,
      ],
    )


  const maxChangeProfileCount =
    useMemo(
      () =>
        Math.max(
          1,
          ...changeProfile.map(
            (item) =>
              item.count,
          ),
        ),
      [
        changeProfile,
      ],
    )



  const filteredAnalyses =
    useMemo(
      () => {
        const search =
          searchTerm
            .trim()
            .toLowerCase()


        if (!search) {
          return analyses
        }


        return analyses.filter(
          (analysis) => {
            const searchable =
              [
                analysis.id,

                analysis
                  .analysis_name,

                analysis
                  .source_version
                ?? '',

                analysis
                  .target_version
                ?? '',

                analysis
                  .created_by_name
                ?? '',

                analysis
                  .created_by_department
                ?? '',

                analysis
                  .created_by_role
                ?? '',
              ]
                .join(' ')
                .toLowerCase()


            return searchable.includes(
              search,
            )
          },
        )
      },
      [
        analyses,
        searchTerm,
      ],
    )



  async function handleDownload(
    analysis:
      AnalysisSummary,
  ) {
    try {
      setError(
        null,
      )

      setDownloadingId(
        analysis.id,
      )


      await downloadAnalysisReport(
        analysis.id,
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
          'Excel raporu indirilemedi.',
        )
      }

    } finally {
      setDownloadingId(
        null,
      )
    }
  }



  function openDeleteModal(
    analysis:
      AnalysisSummary,
  ) {
    setError(
      null,
    )

    setAnalysisPendingDelete(
      analysis,
    )
  }


  function closeDeleteModal() {
    if (
      deletingId
      !== null
    ) {
      return
    }

    setAnalysisPendingDelete(
      null,
    )
  }


  async function confirmDelete() {
    if (
      analysisPendingDelete
      === null
    ) {
      return
    }


    const analysisToDelete =
      analysisPendingDelete


    try {
      setError(
        null,
      )

      setDeletingId(
        analysisToDelete.id,
      )


      await deleteAnalysis(
        analysisToDelete.id,
      )


      setAnalyses(
        (current) =>
          current.filter(
            (analysis) =>
              analysis.id
              !== analysisToDelete.id,
          ),
      )


      setAnalysisPendingDelete(
        null,
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
          'Analiz silinemedi.',
        )
      }

    } finally {
      setDeletingId(
        null,
      )
    }
  }



  return (
    <div className="rpt-page">



      <header className="rpt-header">

        <div>

          <span className="rpt-kicker">
            RAPOR MERKEZİ
          </span>


          <h1>
            Analiz Raporları
          </h1>


          <p>
            Analiz sonuçlarını,
            risk profilini ve geçmiş
            rapor kayıtlarını tek
            ekrandan yönet.
          </p>

        </div>


        <div className="rpt-format-badge">

          <FileSpreadsheet
            size={16}
          />

          <div>

            <span>
              RAPOR FORMATI
            </span>

            <strong>
              XLSX
            </strong>

          </div>

        </div>

      </header>




      {
        error
        && (
          <div
            className="rpt-error"
            role="alert"
          >

            <AlertTriangle
              size={17}
            />


            <span>
              {error}
            </span>


            <button
              type="button"
              aria-label="Hata mesajını kapat"
              onClick={
                () =>
                  setError(
                    null,
                  )
              }
            >

              <X
                size={15}
              />

            </button>

          </div>
        )
      }




      <section className="rpt-kpis">

        <article className="rpt-kpi navy">

          <div className="rpt-kpi-icon">

            <Archive
              size={19}
            />

          </div>


          <div>

            <span>
              Toplam Analiz
            </span>

            <strong>
              {analyses.length}
            </strong>

            <small>
              kayıtlı karşılaştırma
            </small>

          </div>

        </article>


        <article className="rpt-kpi orange">

          <div className="rpt-kpi-icon">

            <GitCompare
              size={19}
            />

          </div>


          <div>

            <span>
              Toplam Değişiklik
            </span>

            <strong>
              {totalChanges}
            </strong>

            <small>
              tespit edilen değişiklik
            </small>

          </div>

        </article>


        <article className="rpt-kpi purple">

          <div className="rpt-kpi-icon">

            <Bug
              size={19}
            />

          </div>


          <div>

            <span>
              Defect Aday Kaydı
            </span>

            <strong>
              {totalDefectRankings}
            </strong>

            <small>
              önceliklendirilmiş aday
            </small>

          </div>

        </article>


        <article className="rpt-kpi red">

          <div className="rpt-kpi-icon">

            <ShieldAlert
              size={19}
            />

          </div>


          <div>

            <span>
              Son Analiz Öncelikli Risk
            </span>

            <strong>
              {latestMetrics.priority}
            </strong>

            <small>
              yüksek + kritik
            </small>

          </div>

        </article>

      </section>




      {
        loading
        ? (
          <div className="rpt-state">

            <Loader2
              size={24}
              className="rpt-spinner"
            />

            <strong>
              Raporlar yükleniyor
            </strong>

            <p>
              Analiz kayıtları getiriliyor.
            </p>

          </div>
        )

        : analyses.length === 0
          ? (
            <div className="rpt-state">

              <Archive
                size={32}
              />

              <strong>
                Henüz rapor bulunmuyor
              </strong>

              <p>
                Yeni bir karşılaştırma
                oluşturduğunda rapor
                burada görünecek.
              </p>

            </div>
          )

          : (
            <>



              {
                latestAnalysis
                && (
                  <section className="rpt-latest">

                    <div className="rpt-latest-head">

                      <div>

                        <span className="rpt-section-label">
                          SON ANALİZ
                        </span>


                        <h2>
                          {
                            latestAnalysis
                              .analysis_name
                          }
                        </h2>


                        <p>
                          Analiz #
                          {
                            latestAnalysis.id
                          }
                        </p>

                      </div>


                      <div className="rpt-latest-actions">

                        <button
                          type="button"
                          className="rpt-secondary-button"
                          onClick={
                            () =>
                              navigate(
                                '/comparison',
                              )
                          }
                        >

                          <GitCompare
                            size={15}
                          />

                          Karşılaştırmayı İncele

                        </button>


                        <button
                          type="button"
                          className="rpt-primary-button"
                          disabled={
                            downloadingId
                            === latestAnalysis.id
                          }
                          onClick={
                            () =>
                              void handleDownload(
                                latestAnalysis,
                              )
                          }
                        >

                          {
                            downloadingId
                            === latestAnalysis.id
                              ? (
                                <Loader2
                                  size={15}
                                  className="rpt-spinner"
                                />
                              )
                              : (
                                <Download
                                  size={15}
                                />
                              )
                          }

                          {
                            downloadingId
                            === latestAnalysis.id
                              ? 'Hazırlanıyor...'
                              : 'Excel Raporu'
                          }

                        </button>

                      </div>

                    </div>


                    <div className="rpt-latest-context">

                      <div className="rpt-version-flow">

                        <div>

                          <span>
                            KAYNAK
                          </span>

                          <strong>
                            {
                              latestAnalysis
                                .source_version
                              ?? '—'
                            }
                          </strong>

                        </div>


                        <div className="rpt-version-arrow">

                          <ArrowRight
                            size={16}
                          />

                        </div>


                        <div className="target">

                          <span>
                            HEDEF
                          </span>

                          <strong>
                            {
                              latestAnalysis
                                .target_version
                              ?? '—'
                            }
                          </strong>

                        </div>

                      </div>


                      <div className="rpt-context-line" />


                      <div className="rpt-creator">

                        <div className="rpt-avatar">

                          {
                            getInitials(
                              latestAnalysis
                                .created_by_name,
                            )
                          }

                        </div>


                        <div>

                          <span>
                            ANALİZİ OLUŞTURAN
                          </span>

                          <strong>
                            {
                              latestAnalysis
                                .created_by_name
                              ?? 'Kullanıcı bilgisi yok'
                            }
                          </strong>

                          {
                            latestAnalysis
                              .created_by_name
                            && (
                              <small>

                                {
                                  [
                                    latestAnalysis
                                      .created_by_department,

                                    latestAnalysis
                                      .created_by_role,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')
                                }

                              </small>
                            )
                          }

                        </div>

                      </div>


                      <div className="rpt-created">

                        <span>
                          OLUŞTURULMA
                        </span>

                        <strong>
                          {
                            formatDate(
                              latestAnalysis
                                .created_at,
                            )
                          }
                        </strong>

                      </div>

                    </div>




                    <div className="rpt-latest-metrics">

                      <div>

                        <span>
                          DEĞİŞİKLİK
                        </span>

                        <strong>
                          {
                            latestAnalysis
                              .requirement_change_count
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          YÜKSEK RİSK
                        </span>

                        <strong className="high">
                          {
                            latestMetrics.high
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          KRİTİK RİSK
                        </span>

                        <strong className="critical">
                          {
                            latestMetrics.critical
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          DEFECT ADAYI
                        </span>

                        <strong>
                          {
                            latestAnalysis
                              .defect_ranking_count
                          }
                        </strong>

                      </div>

                    </div>




                    <div className="rpt-score-row">

                      <div className="rpt-score-block">

                        <div className="rpt-score-head">

                          <span>
                            Ortalama Risk Skoru
                          </span>

                          <strong>
                            {
                              latestMetrics
                                .averageRisk
                                .toFixed(1)
                            }

                            <small>
                              /100
                            </small>
                          </strong>

                        </div>


                        <div className="rpt-progress">

                          <span
                            className="risk"
                            style={{
                              width:
                                `${clampPercentage(
                                  latestMetrics
                                    .averageRisk,
                                )}%`,
                            }}
                          />

                        </div>

                      </div>


                      <div className="rpt-confidence">

                        <span>
                          Ortalama Confidence
                        </span>

                        <strong>
                          {
                            latestMetrics
                              .averageConfidence
                              .toFixed(0)
                          }%
                        </strong>

                      </div>

                    </div>

                  </section>
                )
              }




              <section className="rpt-insights">



                <article className="rpt-panel">

                  <div className="rpt-panel-head">

                    <div>

                      <span>
                        SON ANALİZ
                      </span>

                      <h3>
                        Risk Profili
                      </h3>

                      <p>
                        Risk seviyelerinin
                        dağılımı
                      </p>

                    </div>


                    <ShieldAlert
                      size={18}
                    />

                  </div>


                  <div className="rpt-risk-list">

                    {
                      [
                        {
                          key:
                            'low',

                          label:
                            'Düşük',

                          value:
                            latestMetrics.low,
                        },
                        {
                          key:
                            'medium',

                          label:
                            'Orta',

                          value:
                            latestMetrics.medium,
                        },
                        {
                          key:
                            'high',

                          label:
                            'Yüksek',

                          value:
                            latestMetrics.high,
                        },
                        {
                          key:
                            'critical',

                          label:
                            'Kritik',

                          value:
                            latestMetrics.critical,
                        },
                      ].map(
                        (item) => {
                          const percentage =
                            latestMetrics.total > 0
                              ? (
                                  item.value
                                  / latestMetrics.total
                                )
                                * 100
                              : 0

                          return (
                            <div
                              className="rpt-risk-row"
                              key={
                                item.key
                              }
                            >

                              <div className="rpt-risk-row-head">

                                <div>

                                  <span
                                    className={
                                      `rpt-risk-dot ${item.key}`
                                    }
                                  />

                                  <strong>
                                    {
                                      item.label
                                    }
                                  </strong>

                                </div>

                                <b>
                                  {
                                    item.value
                                  }
                                </b>

                              </div>


                              <div className="rpt-risk-track">

                                <span
                                  className={
                                    item.key
                                  }
                                  style={{
                                    width:
                                      `${percentage}%`,
                                  }}
                                />

                              </div>

                            </div>
                          )
                        },
                      )
                    }

                  </div>

                </article>




                <article className="rpt-panel">

                  <div className="rpt-panel-head">

                    <div>

                      <span>
                        DEĞİŞİM PROFİLİ
                      </span>

                      <h3>
                        Öne Çıkan Değişimler
                      </h3>

                      <p>
                        Son analizde tespit
                        edilen değişim türleri
                      </p>

                    </div>


                    <GitCompare
                      size={18}
                    />

                  </div>


                  {
                    changeProfile.length > 0
                      ? (
                        <div className="rpt-change-profile">

                          {
                            changeProfile.map(
                              (
                                item,
                                index,
                              ) => {
                                const percentage =
                                  (
                                    item.count
                                    / maxChangeProfileCount
                                  )
                                  * 100

                                return (
                                  <div
                                    className="rpt-change-row"
                                    key={
                                      item.type
                                    }
                                  >

                                    <div className="rpt-change-row-head">

                                      <span>
                                        {
                                          item.label
                                        }
                                      </span>

                                      <strong>
                                        {
                                          item.count
                                        }
                                      </strong>

                                    </div>


                                    <div className="rpt-change-track">

                                      <span
                                        className={
                                          `tone-${
                                            (
                                              index
                                              % 4
                                            )
                                            + 1
                                          }`
                                        }
                                        style={{
                                          width:
                                            `${percentage}%`,
                                        }}
                                      />

                                    </div>

                                  </div>
                                )
                              },
                            )
                          }

                        </div>
                      )
                      : (
                        <div className="rpt-panel-empty">
                          Değişim profili
                          bulunmuyor.
                        </div>
                      )
                  }

                </article>

              </section>




              <section className="rpt-archive">

                <div className="rpt-archive-head">

                  <div>

                    <span>
                      RAPOR ARŞİVİ
                    </span>

                    <h2>
                      Tüm Analizler
                    </h2>

                    <p>
                      Geçmiş analiz raporlarını
                      görüntüle ve yönet.
                    </p>

                  </div>


                  <span className="rpt-count">
                    {
                      filteredAnalyses.length
                    } rapor
                  </span>

                </div>


                <div className="rpt-toolbar">

                  <div className="rpt-search">

                    <Search
                      size={16}
                    />

                    <input
                      type="text"
                      value={
                        searchTerm
                      }
                      placeholder="Analiz adı, versiyon veya kullanıcı ara..."
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

                </div>


                {
                  filteredAnalyses.length === 0
                    ? (
                      <div className="rpt-archive-empty">

                        <Search
                          size={24}
                        />

                        <strong>
                          Eşleşen rapor bulunamadı
                        </strong>

                        <span>
                          Arama ifadesini
                          değiştirerek tekrar dene.
                        </span>

                      </div>
                    )
                    : (
                      <div className="rpt-report-list">

                        {
                          filteredAnalyses.map(
                            (analysis) => {
                              const downloading =
                                downloadingId
                                === analysis.id

                              const deleting =
                                deletingId
                                === analysis.id

                              return (
                                <article
                                  className="rpt-report-row"
                                  key={
                                    analysis.id
                                  }
                                >

                                  <div className="rpt-report-icon">

                                    <FileSpreadsheet
                                      size={18}
                                    />

                                  </div>


                                  <div className="rpt-report-main">

                                    <span>
                                      ANALİZ #
                                      {
                                        analysis.id
                                      }
                                    </span>


                                    <h3>
                                      {
                                        analysis
                                          .analysis_name
                                      }
                                    </h3>


                                    <div className="rpt-report-meta">

                                      <div>

                                        <GitCompare
                                          size={13}
                                        />

                                        <span>

                                          {
                                            analysis
                                              .source_version
                                            ?? '—'
                                          }

                                          {' → '}

                                          {
                                            analysis
                                              .target_version
                                            ?? '—'
                                          }

                                        </span>

                                      </div>


                                      <div>

                                        <CalendarDays
                                          size={13}
                                        />

                                        <span>
                                          {
                                            formatDate(
                                              analysis
                                                .created_at,
                                            )
                                          }
                                        </span>

                                      </div>

                                    </div>

                                  </div>


                                  <div className="rpt-report-creator">

                                    <div className="rpt-small-avatar">

                                      {
                                        getInitials(
                                          analysis
                                            .created_by_name,
                                        )
                                      }

                                    </div>


                                    <div>

                                      <span>
                                        OLUŞTURAN
                                      </span>

                                      <strong>
                                        {
                                          analysis
                                            .created_by_name
                                          ?? 'Bilgi yok'
                                        }
                                      </strong>

                                    </div>

                                  </div>


                                  <div className="rpt-report-numbers">

                                    <div>

                                      <span>
                                        DEĞİŞİKLİK
                                      </span>

                                      <strong>
                                        {
                                          analysis
                                            .requirement_change_count
                                        }
                                      </strong>

                                    </div>


                                    <div>

                                      <span>
                                        DEFECT ADAYI
                                      </span>

                                      <strong>
                                        {
                                          analysis
                                            .defect_ranking_count
                                        }
                                      </strong>

                                    </div>

                                  </div>


                                  <div className="rpt-report-actions">

                                    <button
                                      type="button"
                                      className="rpt-download-icon-button"
                                      title="Excel raporunu indir"
                                      aria-label="Excel raporunu indir"
                                      disabled={
                                        downloading
                                        || deleting
                                      }
                                      onClick={
                                        () =>
                                          void handleDownload(
                                            analysis,
                                          )
                                      }
                                    >

                                      {
                                        downloading
                                          ? (
                                            <Loader2
                                              size={15}
                                              className="rpt-spinner"
                                            />
                                          )
                                          : (
                                            <Download
                                              size={15}
                                            />
                                          )
                                      }

                                    </button>


                                    <button
                                      type="button"
                                      className="rpt-delete-icon-button"
                                      title="Analizi sil"
                                      aria-label="Analizi sil"
                                      disabled={
                                        downloading
                                        || deleting
                                      }
                                      onClick={
                                        () =>
                                          openDeleteModal(
                                            analysis,
                                          )
                                      }
                                    >

                                      {
                                        deleting
                                          ? (
                                            <Loader2
                                              size={15}
                                              className="rpt-spinner"
                                            />
                                          )
                                          : (
                                            <Trash2
                                              size={15}
                                            />
                                          )
                                      }

                                    </button>

                                  </div>

                                </article>
                              )
                            },
                          )
                        }

                      </div>
                    )
                }

              </section>

            </>
          )
      }




      {
        analysisPendingDelete
        && (
          <div
            className="rpt-modal-backdrop"
            role="presentation"
            onMouseDown={
              (event) => {
                if (
                  event.target
                  === event.currentTarget
                ) {
                  closeDeleteModal()
                }
              }
            }
          >

            <section
              className="rpt-delete-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rpt-delete-title"
            >

              <button
                type="button"
                className="rpt-modal-close"
                aria-label="Pencereyi kapat"
                disabled={
                  deletingId
                  !== null
                }
                onClick={
                  closeDeleteModal
                }
              >

                <X
                  size={17}
                />

              </button>


              <div className="rpt-delete-icon">

                <Trash2
                  size={21}
                />

              </div>


              <span className="rpt-delete-kicker">
                ANALİZİ SİL
              </span>


              <h3 id="rpt-delete-title">
                Bu analizi silmek
                istediğine emin misin?
              </h3>


              <p className="rpt-delete-description">

                <strong>
                  {
                    analysisPendingDelete
                      .analysis_name
                  }
                </strong>

                {' '}analizi kalıcı olarak
                silinecek.

              </p>


              <div className="rpt-delete-summary">

                <div>

                  <span>
                    ANALİZ
                  </span>

                  <strong>
                    #
                    {
                      analysisPendingDelete
                        .id
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    DEĞİŞİKLİK
                  </span>

                  <strong>
                    {
                      analysisPendingDelete
                        .requirement_change_count
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    DEFECT ADAYI
                  </span>

                  <strong>
                    {
                      analysisPendingDelete
                        .defect_ranking_count
                    }
                  </strong>

                </div>

              </div>


              <div className="rpt-delete-warning">

                <AlertTriangle
                  size={17}
                />

                <p>
                  Bu işlem geri alınamaz.
                  Analize bağlı değişiklik
                  ve defect aday kayıtları
                  da silinir.
                </p>

              </div>


              <div className="rpt-modal-actions">

                <button
                  type="button"
                  className="rpt-cancel-button"
                  disabled={
                    deletingId
                    !== null
                  }
                  onClick={
                    closeDeleteModal
                  }
                >
                  Vazgeç
                </button>


                <button
                  type="button"
                  className="rpt-confirm-delete-button"
                  disabled={
                    deletingId
                    !== null
                  }
                  onClick={
                    () =>
                      void confirmDelete()
                  }
                >

                  {
                    deletingId !== null
                      ? (
                        <>
                          <Loader2
                            size={15}
                            className="rpt-spinner"
                          />
                          Siliniyor...
                        </>
                      )
                      : (
                        <>
                          <Trash2
                            size={15}
                          />
                          Analizi Kalıcı Olarak Sil
                        </>
                      )
                  }

                </button>

              </div>

            </section>

          </div>
        )
      }

    </div>
  )
}


export default ReportsPage