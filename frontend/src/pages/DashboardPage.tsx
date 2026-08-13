import {
  AlertTriangle,
  Download,
  GitCompare,
  ShieldAlert,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './DashboardPage.css'

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import {
  downloadAnalysisReport,
  getAnalyses,
  getAnalysis,
} from '../services/api'

import type {
  AnalysisDetail,
  AnalysisSummary,
} from '../types/api'


type UiLanguage =
  | 'tr'
  | 'en'
  | 'de'
  | 'fr'
  | 'es'


type DashboardError =
  | 'analyses'
  | 'detail'
  | 'report'
  | null


const CHANGE_COLORS = [
  '#15345b',
  '#2f587d',
  '#7188a4',
  '#d4a044',
  '#c86f58',
  '#56846f',
  '#b75a56',
  '#6f7d8d',
]


const RISK_COLORS:
Record<string, string> = {
  low: '#56846f',
  medium: '#d4a044',
  high: '#e47b38',
  critical: '#c95b57',
}



const COPY = {
  tr: {
    comparison:
      'KARŞILAŞTIRMA',

    reportPreparing:
      'Rapor hazırlanıyor...',

    downloadExcel:
      'Excel Raporu İndir',

    totalChanges:
      'Toplam Değişiklik',

    detectedChanges:
      'Tespit edilen değişiklik',

    lowRisk:
      'Düşük Risk',

    lowPriority:
      'Düşük öncelikli',

    mediumRisk:
      'Orta Risk',

    reviewRecommended:
      'İncelenmesi önerilir',

    highRisk:
      'Yüksek Risk',

    priorityReview:
      'Öncelikli inceleme',

    criticalRisk:
      'Kritik Risk',

    criticalChange:
      'Kritik değişiklik',

    changeDistribution:
      'Değişim Dağılımı',

    changeDistributionDescription:
      'Tespit edilen değişiklik türlerinin dağılımı',

    riskDistribution:
      'Risk Seviyesi Dağılımı',

    riskDistributionDescription:
      'Değişikliklerin risk seviyelerine göre dağılımı',

    changesUnit:
      'değişiklik',

    analysisUnit:
      'analiz',

    requirementChanges:
      'Gereksinim Değişiklikleri',

    requirementChangesDescription:
      'Analiz sonucunda tespit edilen gereksinim değişiklikleri',

    resultUnit:
      'sonuç',

    oldId:
      'Eski ID',

    newId:
      'Yeni ID',

    changeType:
      'Değişim Türü',

    risk:
      'Risk',

    riskScore:
      'Risk Skoru',

    confidence:
      'Confidence',

    loading:
      'Analizler yükleniyor...',

    emptyTitle:
      'Henüz analiz bulunmuyor',

    emptyDescription:
      'Dashboard sonuçlarını görmek için önce bir versiyon karşılaştırması oluşturmalısın.',

    analysesError:
      'Analiz listesi yüklenemedi.',

    detailError:
      'Analiz detayları yüklenemedi.',

    reportError:
      'Excel raporu indirilemedi.',

    low:
      'Düşük',

    medium:
      'Orta',

    high:
      'Yüksek',

    critical:
      'Kritik',
  },


  en: {
    comparison:
      'COMPARISON',

    reportPreparing:
      'Preparing report...',

    downloadExcel:
      'Download Excel Report',

    totalChanges:
      'Total Changes',

    detectedChanges:
      'Detected changes',

    lowRisk:
      'Low Risk',

    lowPriority:
      'Low priority',

    mediumRisk:
      'Medium Risk',

    reviewRecommended:
      'Review recommended',

    highRisk:
      'High Risk',

    priorityReview:
      'Priority review',

    criticalRisk:
      'Critical Risk',

    criticalChange:
      'Critical change',

    changeDistribution:
      'Change Distribution',

    changeDistributionDescription:
      'Distribution of detected change types',

    riskDistribution:
      'Risk Level Distribution',

    riskDistributionDescription:
      'Distribution of changes by risk level',

    changesUnit:
      'changes',

    analysisUnit:
      'analysis',

    requirementChanges:
      'Requirement Changes',

    requirementChangesDescription:
      'Requirement changes detected by the analysis',

    resultUnit:
      'results',

    oldId:
      'Previous ID',

    newId:
      'New ID',

    changeType:
      'Change Type',

    risk:
      'Risk',

    riskScore:
      'Risk Score',

    confidence:
      'Confidence',

    loading:
      'Loading analyses...',

    emptyTitle:
      'No analyses yet',

    emptyDescription:
      'Create a version comparison first to view Dashboard results.',

    analysesError:
      'The analysis list could not be loaded.',

    detailError:
      'Analysis details could not be loaded.',

    reportError:
      'The Excel report could not be downloaded.',

    low:
      'Low',

    medium:
      'Medium',

    high:
      'High',

    critical:
      'Critical',
  },


  de: {
    comparison:
      'VERGLEICH',

    reportPreparing:
      'Bericht wird vorbereitet...',

    downloadExcel:
      'Excel-Bericht herunterladen',

    totalChanges:
      'Gesamtänderungen',

    detectedChanges:
      'Erkannte Änderungen',

    lowRisk:
      'Niedriges Risiko',

    lowPriority:
      'Niedrige Priorität',

    mediumRisk:
      'Mittleres Risiko',

    reviewRecommended:
      'Prüfung empfohlen',

    highRisk:
      'Hohes Risiko',

    priorityReview:
      'Priorisierte Prüfung',

    criticalRisk:
      'Kritisches Risiko',

    criticalChange:
      'Kritische Änderung',

    changeDistribution:
      'Änderungsverteilung',

    changeDistributionDescription:
      'Verteilung der erkannten Änderungstypen',

    riskDistribution:
      'Risikoverteilung',

    riskDistributionDescription:
      'Verteilung der Änderungen nach Risikostufe',

    changesUnit:
      'Änderungen',

    analysisUnit:
      'Analyse',

    requirementChanges:
      'Anforderungsänderungen',

    requirementChangesDescription:
      'Durch die Analyse erkannte Anforderungsänderungen',

    resultUnit:
      'Ergebnisse',

    oldId:
      'Vorherige ID',

    newId:
      'Neue ID',

    changeType:
      'Änderungstyp',

    risk:
      'Risiko',

    riskScore:
      'Risikowert',

    confidence:
      'Konfidenz',

    loading:
      'Analysen werden geladen...',

    emptyTitle:
      'Noch keine Analysen vorhanden',

    emptyDescription:
      'Erstellen Sie zuerst einen Versionsvergleich, um Dashboard-Ergebnisse anzuzeigen.',

    analysesError:
      'Die Analyseliste konnte nicht geladen werden.',

    detailError:
      'Die Analysedetails konnten nicht geladen werden.',

    reportError:
      'Der Excel-Bericht konnte nicht heruntergeladen werden.',

    low:
      'Niedrig',

    medium:
      'Mittel',

    high:
      'Hoch',

    critical:
      'Kritisch',
  },


  fr: {
    comparison:
      'COMPARAISON',

    reportPreparing:
      'Préparation du rapport...',

    downloadExcel:
      'Télécharger le rapport Excel',

    totalChanges:
      'Total des modifications',

    detectedChanges:
      'Modifications détectées',

    lowRisk:
      'Risque faible',

    lowPriority:
      'Faible priorité',

    mediumRisk:
      'Risque moyen',

    reviewRecommended:
      'Vérification recommandée',

    highRisk:
      'Risque élevé',

    priorityReview:
      'Vérification prioritaire',

    criticalRisk:
      'Risque critique',

    criticalChange:
      'Modification critique',

    changeDistribution:
      'Répartition des modifications',

    changeDistributionDescription:
      'Répartition des types de modifications détectés',

    riskDistribution:
      'Répartition des niveaux de risque',

    riskDistributionDescription:
      'Répartition des modifications selon leur niveau de risque',

    changesUnit:
      'modifications',

    analysisUnit:
      'analyse',

    requirementChanges:
      'Modifications des exigences',

    requirementChangesDescription:
      'Modifications des exigences détectées par l’analyse',

    resultUnit:
      'résultats',

    oldId:
      'Ancien ID',

    newId:
      'Nouvel ID',

    changeType:
      'Type de modification',

    risk:
      'Risque',

    riskScore:
      'Score de risque',

    confidence:
      'Confiance',

    loading:
      'Chargement des analyses...',

    emptyTitle:
      'Aucune analyse pour le moment',

    emptyDescription:
      'Créez d’abord une comparaison de versions pour afficher les résultats du tableau de bord.',

    analysesError:
      'La liste des analyses n’a pas pu être chargée.',

    detailError:
      'Les détails de l’analyse n’ont pas pu être chargés.',

    reportError:
      'Le rapport Excel n’a pas pu être téléchargé.',

    low:
      'Faible',

    medium:
      'Moyen',

    high:
      'Élevé',

    critical:
      'Critique',
  },


  es: {
    comparison:
      'COMPARACIÓN',

    reportPreparing:
      'Preparando informe...',

    downloadExcel:
      'Descargar informe Excel',

    totalChanges:
      'Cambios totales',

    detectedChanges:
      'Cambios detectados',

    lowRisk:
      'Riesgo bajo',

    lowPriority:
      'Baja prioridad',

    mediumRisk:
      'Riesgo medio',

    reviewRecommended:
      'Revisión recomendada',

    highRisk:
      'Riesgo alto',

    priorityReview:
      'Revisión prioritaria',

    criticalRisk:
      'Riesgo crítico',

    criticalChange:
      'Cambio crítico',

    changeDistribution:
      'Distribución de cambios',

    changeDistributionDescription:
      'Distribución de los tipos de cambio detectados',

    riskDistribution:
      'Distribución del nivel de riesgo',

    riskDistributionDescription:
      'Distribución de los cambios según el nivel de riesgo',

    changesUnit:
      'cambios',

    analysisUnit:
      'análisis',

    requirementChanges:
      'Cambios de requisitos',

    requirementChangesDescription:
      'Cambios de requisitos detectados por el análisis',

    resultUnit:
      'resultados',

    oldId:
      'ID anterior',

    newId:
      'ID nuevo',

    changeType:
      'Tipo de cambio',

    risk:
      'Riesgo',

    riskScore:
      'Puntuación de riesgo',

    confidence:
      'Confianza',

    loading:
      'Cargando análisis...',

    emptyTitle:
      'Todavía no hay análisis',

    emptyDescription:
      'Crea primero una comparación de versiones para ver los resultados del panel.',

    analysesError:
      'No se pudo cargar la lista de análisis.',

    detailError:
      'No se pudieron cargar los detalles del análisis.',

    reportError:
      'No se pudo descargar el informe Excel.',

    low:
      'Bajo',

    medium:
      'Medio',

    high:
      'Alto',

    critical:
      'Crítico',
  },
} as const



const CHANGE_TYPE_LABELS:
Record<
  UiLanguage,
  Record<string, string>
> = {
  tr: {
    changed:
      'Değiştirildi',

    added:
      'Eklendi',

    removed:
      'Kaldırıldı',

    paraphrased:
      'Yeniden İfade',

    numeric_change:
      'Sayısal Değişiklik',

    modality_change:
      'Zorunluluk Değişikliği',

    scope_change:
      'Kapsam Değişikliği',

    duration_change:
      'Süre Değişikliği',

    negation_change:
      'Olumsuzluk Değişikliği',

    condition_change:
      'Koşul Değişikliği',

    actor_change:
      'Aktör Değişikliği',

    state_change:
      'Durum Değişikliği',

    requirement_added:
      'Gereksinim Eklendi',

    requirement_removed:
      'Gereksinim Kaldırıldı',
  },

  en: {
    changed:
      'Changed',

    added:
      'Added',

    removed:
      'Removed',

    paraphrased:
      'Paraphrased',

    numeric_change:
      'Numeric Change',

    modality_change:
      'Modality Change',

    scope_change:
      'Scope Change',

    duration_change:
      'Duration Change',

    negation_change:
      'Negation Change',

    condition_change:
      'Condition Change',

    actor_change:
      'Actor Change',

    state_change:
      'State Change',

    requirement_added:
      'Requirement Added',

    requirement_removed:
      'Requirement Removed',
  },

  de: {
    changed:
      'Geändert',

    added:
      'Hinzugefügt',

    removed:
      'Entfernt',

    paraphrased:
      'Umformuliert',

    numeric_change:
      'Numerische Änderung',

    modality_change:
      'Modalitätsänderung',

    scope_change:
      'Umfangsänderung',

    duration_change:
      'Daueränderung',

    negation_change:
      'Negationsänderung',

    condition_change:
      'Bedingungsänderung',

    actor_change:
      'Akteuränderung',

    state_change:
      'Statusänderung',

    requirement_added:
      'Anforderung hinzugefügt',

    requirement_removed:
      'Anforderung entfernt',
  },

  fr: {
    changed:
      'Modifié',

    added:
      'Ajouté',

    removed:
      'Supprimé',

    paraphrased:
      'Reformulé',

    numeric_change:
      'Modification numérique',

    modality_change:
      'Modification de modalité',

    scope_change:
      'Modification de portée',

    duration_change:
      'Modification de durée',

    negation_change:
      'Modification de négation',

    condition_change:
      'Modification de condition',

    actor_change:
      'Modification d’acteur',

    state_change:
      'Modification d’état',

    requirement_added:
      'Exigence ajoutée',

    requirement_removed:
      'Exigence supprimée',
  },

  es: {
    changed:
      'Modificado',

    added:
      'Añadido',

    removed:
      'Eliminado',

    paraphrased:
      'Reformulado',

    numeric_change:
      'Cambio numérico',

    modality_change:
      'Cambio de modalidad',

    scope_change:
      'Cambio de alcance',

    duration_change:
      'Cambio de duración',

    negation_change:
      'Cambio de negación',

    condition_change:
      'Cambio de condición',

    actor_change:
      'Cambio de actor',

    state_change:
      'Cambio de estado',

    requirement_added:
      'Requisito añadido',

    requirement_removed:
      'Requisito eliminado',
  },
}



function detectLanguage(
  routeTitle: string,
): UiLanguage {
  if (
    routeTitle
    === 'Analysis Dashboard'
  ) {
    return 'en'
  }

  if (
    routeTitle
    === 'Analyse-Dashboard'
  ) {
    return 'de'
  }

  if (
    routeTitle
    === 'Tableau de bord d’analyse'
  ) {
    return 'fr'
  }

  if (
    routeTitle
    === 'Panel de análisis'
  ) {
    return 'es'
  }

  return 'tr'
}



function normalizeChangeType(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(
      '-',
      '_',
    )
    .replaceAll(
      ' ',
      '_',
    )
}


function prettifyChangeType(
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


function formatChangeType(
  value: string,
  language: UiLanguage,
): string {
  const normalized =
    normalizeChangeType(
      value,
    )

  return (
    CHANGE_TYPE_LABELS[
      language
    ][normalized]
    ?? prettifyChangeType(
      value,
    )
  )
}



function DashboardPage() {
  const {
    t,
  } = useLanguage()


  const language =
    detectLanguage(
      t(
        'route.dashboard.title',
      ),
    )


  const copy =
    COPY[
      language
    ]


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
  ] = useState(
    true,
  )


  const [
    errorType,
    setErrorType,
  ] = useState<
    DashboardError
  >(null)


  const [
    reportDownloading,
    setReportDownloading,
  ] = useState(
    false,
  )



  useEffect(
    () => {
      async function loadAnalyses() {
        try {
          setLoading(
            true,
          )

          setErrorType(
            null,
          )


          const result =
            await getAnalyses()


          setAnalyses(
            result,
          )


          if (
            result.length
            > 0
          ) {
            setSelectedAnalysisId(
              result[0].id,
            )
          }

        } catch {
          setErrorType(
            'analyses',
          )

        } finally {
          setLoading(
            false,
          )
        }
      }


      void loadAnalyses()
    },
    [],
  )



  useEffect(
    () => {
      if (
        typeof selectedAnalysisId
        !== 'number'
      ) {
        return
      }


      async function loadDetail(
        analysisId: number,
      ) {
        try {
          setLoading(
            true,
          )

          setErrorType(
            null,
          )


          const result =
            await getAnalysis(
              analysisId,
            )


          setAnalysis(
            result,
          )

        } catch {
          setErrorType(
            'detail',
          )

        } finally {
          setLoading(
            false,
          )
        }
      }


      void loadDetail(
        selectedAnalysisId,
      )
    },
    [
      selectedAnalysisId,
    ],
  )



  const metrics =
    useMemo(
      () => {
        const changes =
          analysis
            ?.requirement_changes
          ?? []


        const lowRisk =
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'low',
          ).length


        const mediumRisk =
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'medium',
          ).length


        const highRisk =
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'high',
          ).length


        const criticalRisk =
          changes.filter(
            (change) =>
              change
                .risk_level
                .toLowerCase()
              === 'critical',
          ).length


        return {
          totalChanges:
            changes.length,

          lowRisk,

          mediumRisk,

          highRisk,

          criticalRisk,
        }
      },
      [
        analysis,
      ],
    )



  const changeDistribution =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >()


        const changes =
          analysis
            ?.requirement_changes
          ?? []


        for (
          const change
          of changes
        ) {
          counts.set(
            change.change_type,

            (
              counts.get(
                change.change_type,
              )
              ?? 0
            )
            + 1,
          )
        }


        return Array.from(
          counts.entries(),
        ).map(
          (
            [
              name,
              value,
            ],
          ) => ({
            name:
              formatChangeType(
                name,
                language,
              ),

            value,
          }),
        )
      },
      [
        analysis,
        language,
      ],
    )



  const riskDistribution =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >()


        const changes =
          analysis
            ?.requirement_changes
          ?? []


        for (
          const change
          of changes
        ) {
          const risk =
            change
              .risk_level
              .toLowerCase()


          counts.set(
            risk,

            (
              counts.get(
                risk,
              )
              ?? 0
            )
            + 1,
          )
        }


        return [
          'critical',
          'high',
          'medium',
          'low',
        ]
          .filter(
            (risk) =>
              counts.has(
                risk,
              ),
          )
          .map(
            (risk) => {
              let name =
                risk


              if (
                risk
                === 'low'
              ) {
                name =
                  copy.low
              }


              if (
                risk
                === 'medium'
              ) {
                name =
                  copy.medium
              }


              if (
                risk
                === 'high'
              ) {
                name =
                  copy.high
              }


              if (
                risk
                === 'critical'
              ) {
                name =
                  copy.critical
              }


              return {
                name,

                key:
                  risk,

                value:
                  counts.get(
                    risk,
                  )
                  ?? 0,
              }
            },
          )
      },
      [
        analysis,
        copy,
      ],
    )


  function formatRiskLevel(
    value: string,
  ): string {
    const normalized =
      value
        .trim()
        .toLowerCase()


    if (
      normalized
      === 'low'
    ) {
      return copy.low
    }


    if (
      normalized
      === 'medium'
    ) {
      return copy.medium
    }


    if (
      normalized
      === 'high'
    ) {
      return copy.high
    }


    if (
      normalized
      === 'critical'
    ) {
      return copy.critical
    }


    return value
  }



  async function handleDownloadReport() {
    if (
      typeof selectedAnalysisId
      !== 'number'
    ) {
      return
    }


    try {
      setReportDownloading(
        true,
      )

      setErrorType(
        null,
      )


      await downloadAnalysisReport(
        selectedAnalysisId,
      )

    } catch {
      setErrorType(
        'report',
      )

    } finally {
      setReportDownloading(
        false,
      )
    }
  }



  function getErrorMessage():
  string | null {
    if (
      errorType
      === 'analyses'
    ) {
      return (
        copy
          .analysesError
      )
    }


    if (
      errorType
      === 'detail'
    ) {
      return (
        copy
          .detailError
      )
    }


    if (
      errorType
      === 'report'
    ) {
      return (
        copy
          .reportError
      )
    }


    return null
  }


  const errorMessage =
    getErrorMessage()



  if (
    loading
    && analyses.length
      === 0
  ) {
    return (
      <div className="dashboard-message">
        {copy.loading}
      </div>
    )
  }



  if (
    errorType
    === 'analyses'
  ) {
    return (
      <div className="dashboard-message error">
        {
          copy
            .analysesError
        }
      </div>
    )
  }



  if (
    analyses.length
    === 0
  ) {
    return (
      <div className="empty-dashboard">

        <GitCompare
          size={38}
        />


        <h2>
          {
            copy
              .emptyTitle
          }
        </h2>


        <p>
          {
            copy
              .emptyDescription
          }
        </p>

      </div>
    )
  }



  return (
    <div className="dashboard-page">



      <section className="dashboard-toolbar">

        <div className="comparison-selector">

          <span className="section-label">
            {
              copy
                .comparison
            }
          </span>


          <select
            value={
              selectedAnalysisId
              ?? ''
            }
            onChange={
              (
                event,
              ) => {
                setSelectedAnalysisId(
                  Number(
                    event
                      .target
                      .value,
                  ),
                )
              }
            }
          >

            {
              analyses.map(
                (
                  item,
                ) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {
                      item
                        .analysis_name
                    }
                  </option>
                ),
              )
            }

          </select>

        </div>


        <button
          type="button"
          className="excel-report-button"
          onClick={
            handleDownloadReport
          }
          disabled={
            selectedAnalysisId
            === null
            || reportDownloading
          }
        >

          <Download
            size={16}
          />


          {
            reportDownloading
              ? copy
                  .reportPreparing

              : copy
                  .downloadExcel
          }

        </button>

      </section>




      {
  errorMessage
  && (
    <div className="dashboard-message error">
      {errorMessage}
    </div>
  )
}




      <section className="kpi-grid">

        <article className="kpi-card">

          <div className="kpi-icon blue">

            <GitCompare
              size={18}
            />

          </div>


          <span>
            {
              copy
                .totalChanges
            }
          </span>


          <strong>
            {
              metrics
                .totalChanges
            }
          </strong>


          <small>
            {
              copy
                .detectedChanges
            }
          </small>

        </article>


        <article className="kpi-card">

          <div className="kpi-icon green">

            <ShieldAlert
              size={18}
            />

          </div>


          <span>
            {copy.lowRisk}
          </span>


          <strong>
            {metrics.lowRisk}
          </strong>


          <small>
            {
              copy
                .lowPriority
            }
          </small>

        </article>


        <article className="kpi-card">

          <div className="kpi-icon yellow">

            <AlertTriangle
              size={18}
            />

          </div>


          <span>
            {
              copy
                .mediumRisk
            }
          </span>


          <strong>
            {
              metrics
                .mediumRisk
            }
          </strong>


          <small>
            {
              copy
                .reviewRecommended
            }
          </small>

        </article>


        <article className="kpi-card">

          <div className="kpi-icon orange">

            <AlertTriangle
              size={18}
            />

          </div>


          <span>
            {
              copy
                .highRisk
            }
          </span>


          <strong>
            {
              metrics
                .highRisk
            }
          </strong>


          <small>
            {
              copy
                .priorityReview
            }
          </small>

        </article>


        <article className="kpi-card">

          <div className="kpi-icon red">

            <ShieldAlert
              size={18}
            />

          </div>


          <span>
            {
              copy
                .criticalRisk
            }
          </span>


          <strong>
            {
              metrics
                .criticalRisk
            }
          </strong>


          <small>
            {
              copy
                .criticalChange
            }
          </small>

        </article>

      </section>




      <section className="chart-grid">



        <article className="dashboard-card chart-card chart-card--changes">

          <div className="card-heading">

            <div>

              <h2>
                {
                  copy
                    .changeDistribution
                }
              </h2>


              <p>
                {
                  copy
                    .changeDistributionDescription
                }
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

                    {
                      changeDistribution.map(
                        (
                          _,
                          index,
                        ) => (
                          <Cell
                            key={
                              index
                            }
                            fill={
                              CHANGE_COLORS[
                                index
                                % CHANGE_COLORS
                                  .length
                              ]
                            }
                          />
                        ),
                      )
                    }

                  </Pie>


                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>


              <div className="donut-center">

                <strong>
                  {
                    metrics
                      .totalChanges
                  }
                </strong>


                <span>
                  {
                    copy
                      .changesUnit
                  }
                </span>

              </div>

            </div>


            <div className="chart-legend">

              {
                changeDistribution.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      className="legend-row"
                      key={
                        item.name
                      }
                    >

                      <span
                        className="legend-color"
                        style={{
                          background:
                            CHANGE_COLORS[
                              index
                              % CHANGE_COLORS
                                .length
                            ],
                        }}
                      />


                      <span>
                        {
                          item.name
                        }
                      </span>


                      <strong>
                        {
                          item.value
                        }
                      </strong>

                      <span
                        className="legend-meter"
                        aria-hidden="true"
                      >
                        <span
                          style={{
                            width: `${Math.round((item.value / Math.max(metrics.totalChanges, 1)) * 100)}%`,
                            background:
                              CHANGE_COLORS[
                                index
                                % CHANGE_COLORS
                                  .length
                              ],
                          }}
                        />
                      </span>

                    </div>
                  ),
                )
              }

            </div>

          </div>

        </article>




        <article className="dashboard-card chart-card chart-card--risk">

          <div className="card-heading">

            <div>

              <h2>
                {
                  copy
                    .riskDistribution
                }
              </h2>


              <p>
                {
                  copy
                    .riskDistributionDescription
                }
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
                      riskDistribution
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={91}
                    paddingAngle={3}
                  >

                    {
                      riskDistribution.map(
                        (
                          item,
                        ) => (
                          <Cell
                            key={
                              item.key
                            }
                            fill={
                              RISK_COLORS[
                                item.key
                              ]
                            }
                          />
                        ),
                      )
                    }

                  </Pie>


                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>


              <div className="donut-center">

                <strong>
                  {
                    metrics
                      .totalChanges
                  }
                </strong>


                <span>
                  {
                    copy
                      .analysisUnit
                  }
                </span>

              </div>

            </div>


            <div className="chart-legend">

              {
                riskDistribution.map(
                  (
                    item,
                  ) => (
                    <div
                      className="legend-row"
                      key={
                        item.key
                      }
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
                        {
                          item.name
                        }
                      </span>


                      <strong>
                        {
                          item.value
                        }
                      </strong>

                      <span
                        className="legend-meter"
                        aria-hidden="true"
                      >
                        <span
                          style={{
                            width: `${Math.round((item.value / Math.max(metrics.totalChanges, 1)) * 100)}%`,
                            background:
                              RISK_COLORS[
                                item.key
                              ],
                          }}
                        />
                      </span>

                    </div>
                  ),
                )
              }

            </div>

          </div>

        </article>

      </section>




      <section
        className="
          dashboard-card
          table-card
        "
      >

        <div className="card-heading">

          <div>

            <h2>
              {
                copy
                  .requirementChanges
              }
            </h2>


            <p>
              {
                copy
                  .requirementChangesDescription
              }
            </p>

          </div>


          <span className="result-count">

            {
              analysis
                ?.requirement_changes
                .length
              ?? 0
            }

            {' '}

            {
              copy
                .resultUnit
            }

          </span>

        </div>


        <div className="table-wrapper">

          <table className="changes-table">

            <thead>

              <tr>

                <th>
                  {copy.oldId}
                </th>

                <th>
                  {copy.newId}
                </th>

                <th>
                  {
                    copy
                      .changeType
                  }
                </th>

                <th>
                  {copy.risk}
                </th>

                <th>
                  {
                    copy
                      .riskScore
                  }
                </th>

                <th>
                  {
                    copy
                      .confidence
                  }
                </th>

              </tr>

            </thead>


            <tbody>

              {
                analysis
                  ?.requirement_changes
                  .slice(
                    0,
                    10,
                  )
                  .map(
                    (
                      change,
                    ) => (
                      <tr
                        key={
                          change.id
                        }
                      >

                        <td>
                          {
                            change
                              .old_requirement_id
                            ?? '—'
                          }
                        </td>


                        <td>
                          {
                            change
                              .new_requirement_id
                            ?? '—'
                          }
                        </td>


                        <td>

                          <span className="change-type">

                            {
                              formatChangeType(
                                change
                                  .change_type,
                                language,
                              )
                            }

                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              `risk-badge ${
                                change
                                  .risk_level
                                  .toLowerCase()
                              }`
                            }
                          >
                            {
                              formatRiskLevel(
                                change
                                  .risk_level,
                              )
                            }
                          </span>

                        </td>


                        <td>
                          {
                            change
                              .risk_score
                              .toFixed(
                                1,
                              )
                          }
                        </td>


                        <td>

                          {
                            change
                              .confidence
                            !== null
                              ? `${(
                                  change
                                    .confidence
                                  * 100
                                ).toFixed(
                                  0,
                                )}%`

                              : '—'
                          }

                        </td>

                      </tr>
                    ),
                  )
              }

            </tbody>

          </table>

        </div>

      </section>

    </div>
  )
}


export default DashboardPage
