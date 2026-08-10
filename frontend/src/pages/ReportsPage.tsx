import {
  Archive,
  Bug,
  CalendarDays,
  Download,
  FileSpreadsheet,
  GitCompareArrows,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './ReportsPage.css'

import {
  downloadAnalysisReport,
  getAnalyses,
} from '../services/api'

import type {
  AnalysisSummary,
} from '../types/api'


function formatDate(
  value: string,
): string {
  const date = new Date(
    value,
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
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(
    date,
  )
}


function ReportsPage() {
  const [
    analyses,
    setAnalyses,
  ] = useState<
    AnalysisSummary[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  )

  const [
    searchText,
    setSearchText,
  ] = useState(
    '',
  )

  const [
    downloadingId,
    setDownloadingId,
  ] = useState<
    number | null
  >(null)

  const [
    error,
    setError,
  ] = useState<
    string | null
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

        const response =
          await getAnalyses()

        setAnalyses(
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


  const filteredAnalyses =
    useMemo(
      () => {
        const normalizedSearch =
          searchText
            .trim()
            .toLowerCase()

        if (
          !normalizedSearch
        ) {
          return analyses
        }

        return analyses.filter(
          (analysis) => {

            const values = [
              analysis.analysis_name,

              analysis.source_version
              ?? '',

              analysis.target_version
              ?? '',

              String(
                analysis.id,
              ),
            ]

            return values.some(
              (value) =>
                value
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ),
            )
          },
        )
      },
      [
        analyses,
        searchText,
      ],
    )


  async function handleDownload(
    analysis: AnalysisSummary,
  ) {
    try {
      setDownloadingId(
        analysis.id,
      )

      setError(
        null,
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


  if (loading) {
    return (
      <div className="dashboard-message">
        Raporlar yükleniyor...
      </div>
    )
  }


  return (
    <div className="reports-page">

      <section className="reports-header">

        <div>

          <span className="section-label">
            RAPOR MERKEZİ
          </span>

          <h2>
            Analiz Raporları
          </h2>

          <p>
            Tamamlanan ScopeDiff AI
            analizlerini görüntüle ve
            ayrıntılı Excel raporlarını
            indir.
          </p>

        </div>


        <div className="reports-header-badge">

          <FileSpreadsheet
            size={17}
          />

          <span>
            Excel Export
          </span>

        </div>

      </section>


      {error && (
        <div className="dashboard-message error">
          {error}
        </div>
      )}


      <section className="reports-kpi-grid">

        <article className="reports-kpi-card">

          <div className="reports-kpi-icon blue">
            <Archive
              size={18}
            />
          </div>

          <div>

            <span>
              Toplam Analiz
            </span>

            <strong>
              {
                analyses.length
              }
            </strong>

          </div>

        </article>


        <article className="reports-kpi-card">

          <div className="reports-kpi-icon orange">
            <GitCompareArrows
              size={18}
            />
          </div>

          <div>

            <span>
              Toplam Değişiklik
            </span>

            <strong>
              {
                totalChanges
              }
            </strong>

          </div>

        </article>


        <article className="reports-kpi-card">

          <div className="reports-kpi-icon purple">
            <Bug
              size={18}
            />
          </div>

          <div>

            <span>
              Toplam Defect Aday Kaydı
            </span>

            <strong>
              {
                totalDefectRankings
              }
            </strong>

          </div>

        </article>


        <article className="reports-kpi-card">

          <div className="reports-kpi-icon green">
            <ShieldCheck
              size={18}
            />
          </div>

          <div>

            <span>
              Rapor Formatı
            </span>

            <strong className="reports-format-text">
              XLSX
            </strong>

          </div>

        </article>

      </section>


      <section className="reports-toolbar">

        <div className="reports-search">

          <Search
            size={16}
          />

          <input
            type="text"
            value={
              searchText
            }
            placeholder={
              'Analiz adı, versiyon veya ID ara...'
            }
            onChange={
              (event) =>
                setSearchText(
                  event
                    .target
                    .value,
                )
            }
          />

        </div>


        <span className="reports-result-count">
          {
            filteredAnalyses
              .length
          } rapor
        </span>

      </section>


      {analyses.length === 0 ? (

        <section className="reports-empty">

          <FileSpreadsheet
            size={34}
          />

          <h3>
            Henüz rapor oluşturulmadı
          </h3>

          <p>
            Bir gereksinim
            karşılaştırması
            tamamlandığında raporu
            burada görüntüleyebilirsin.
          </p>

        </section>

      ) : filteredAnalyses.length === 0 ? (

        <section className="reports-empty">

          <Search
            size={32}
          />

          <h3>
            Sonuç bulunamadı
          </h3>

          <p>
            Arama kriterine uygun
            analiz raporu bulunmuyor.
          </p>

        </section>

      ) : (

        <section className="reports-list">

          {filteredAnalyses.map(
            (analysis) => {

              const isDownloading =
                downloadingId
                === analysis.id

              return (
                <article
                  key={
                    analysis.id
                  }
                  className="report-card"
                >

                  <div className="report-card-icon">

                    <FileSpreadsheet
                      size={22}
                    />

                  </div>


                  <div className="report-card-content">

                    <div className="report-card-header">

                      <div>

                        <span className="report-id">
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

                      </div>


                      <div className="report-version">

                        <span>
                          {
                            analysis
                              .source_version
                            ?? '—'
                          }
                        </span>

                        <strong>
                          →
                        </strong>

                        <span>
                          {
                            analysis
                              .target_version
                            ?? '—'
                          }
                        </span>

                      </div>

                    </div>


                    <div className="report-meta-grid">

                      <div>

                        <GitCompareArrows
                          size={15}
                        />

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

                      </div>


                      <div>

                        <Bug
                          size={15}
                        />

                        <div>

                          <span>
                            DEFECT ADAY KAYDI
                          </span>

                          <strong>
                            {
                              analysis
                                .defect_ranking_count
                            }
                          </strong>

                        </div>

                      </div>


                      <div>

                        <CalendarDays
                          size={15}
                        />

                        <div>

                          <span>
                            OLUŞTURULMA
                          </span>

                          <strong>
                            {
                              formatDate(
                                analysis
                                  .created_at,
                              )
                            }
                          </strong>

                        </div>

                      </div>

                    </div>

                  </div>


                  <div className="report-card-action">

                    <button
                      type="button"
                      disabled={
                        isDownloading
                      }
                      onClick={
                        () =>
                          void handleDownload(
                            analysis,
                          )
                      }
                    >

                      {isDownloading ? (
                        <>
                          <Loader2
                            size={15}
                            className="reports-spinner"
                          />

                          Hazırlanıyor...
                        </>
                      ) : (
                        <>
                          <Download
                            size={15}
                          />

                          Excel Raporunu İndir
                        </>
                      )}

                    </button>

                    <span>
                      .xlsx
                    </span>

                  </div>

                </article>
              )
            },
          )}

        </section>

      )}

    </div>
  )
}


export default ReportsPage