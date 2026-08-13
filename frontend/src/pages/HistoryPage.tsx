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

import {
  useLanguage,
} from '../i18n/LanguageContext'

import type {
  SupportedLanguage,
} from '../i18n/translations'


interface HistoryCopy {
  sectionLabel: string
  title: string
  subtitle: string

  module: string
  requirement: string
  allModules: string

  version: string
  transition: string
  highestRisk: string
  currentVersion: string

  currentRequirement: string

  timelineTitle: string
  timelineSubtitle: string

  versionLabel: string
  initialVersion: string
  current: string

  loadingCatalog: string
  loadingTimeline: string

  emptyTitle: string
  emptyText: string

  catalogLoadError: string
  historyLoadError: string

  transitionFallback: string

  risks: Record<string, string>
  changeTypes: Record<string, string>
}


const COPY:
Record<
  SupportedLanguage,
  HistoryCopy
> = {
  tr: {
    sectionLabel:
      'GEREKSİNİM GEÇMİŞİ',

    title:
      'Gereksinim Versiyon Zaman Çizelgesi',

    subtitle:
      'Bir gereksinimin zaman içindeki sürümlerini, geçişlerini ve riskli değişikliklerini incele.',

    module:
      'MODÜL',

    requirement:
      'GEREKSİNİM',

    allModules:
      'Tüm Modüller',

    version:
      'Versiyon',

    transition:
      'Geçiş',

    highestRisk:
      'En Yüksek Risk',

    currentVersion:
      'Güncel Versiyon',

    currentRequirement:
      'GÜNCEL GEREKSİNİM',

    timelineTitle:
      'Versiyon Zaman Çizelgesi',

    timelineSubtitle:
      'İlk sürümden güncel sürüme kadar gereksinim evrimi',

    versionLabel:
      'VERSİYON',

    initialVersion:
      'İlk Versiyon',

    current:
      'Güncel',

    loadingCatalog:
      'Versiyon geçmişi yükleniyor...',

    loadingTimeline:
      'Zaman çizelgesi yükleniyor...',

    emptyTitle:
      'Versiyon geçmişi bulunamadı',

    emptyText:
      'Geçmiş veri setinde gösterilecek gereksinim bulunmuyor.',

    catalogLoadError:
      'Geçmiş verileri yüklenemedi.',

    historyLoadError:
      'Gereksinim geçmişi yüklenemedi.',

    transitionFallback:
      'Geçiş',

    risks: {
      none: 'Yok',
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      critical: 'Kritik',
    },

    changeTypes: {
      baseline: 'Başlangıç',
      numeric_change: 'Sayısal Değişiklik',
      duration_change: 'Süre Değişikliği',
      modality_change: 'Zorunluluk Değişikliği',
      negation_change: 'Olumsuzluk Değişikliği',
      condition_change: 'Koşul Değişikliği',
      condition_removed: 'Koşul Kaldırıldı',
      scope_change: 'Kapsam Değişikliği',
      actor_change: 'Aktör Değişikliği',
      state_change: 'Durum Değişikliği',
      sequence_change: 'Sıra Değişikliği',
      numeric_constraint_removed:
        'Sayısal Kısıt Kaldırıldı',
      duration_constraint_removed:
        'Süre Kısıtı Kaldırıldı',
    },
  },

  en: {
    sectionLabel:
      'REQUIREMENT HISTORY',

    title:
      'Requirement Version Timeline',

    subtitle:
      'Review requirement versions, transitions and risky changes over time.',

    module:
      'MODULE',

    requirement:
      'REQUIREMENT',

    allModules:
      'All Modules',

    version:
      'Versions',

    transition:
      'Transitions',

    highestRisk:
      'Highest Risk',

    currentVersion:
      'Current Version',

    currentRequirement:
      'CURRENT REQUIREMENT',

    timelineTitle:
      'Version Timeline',

    timelineSubtitle:
      'Requirement evolution from the first version to the current version',

    versionLabel:
      'VERSION',

    initialVersion:
      'Initial Version',

    current:
      'Current',

    loadingCatalog:
      'Loading version history...',

    loadingTimeline:
      'Loading timeline...',

    emptyTitle:
      'No version history found',

    emptyText:
      'There are no requirements to display in the history dataset.',

    catalogLoadError:
      'History data could not be loaded.',

    historyLoadError:
      'Requirement history could not be loaded.',

    transitionFallback:
      'Transition',

    risks: {
      none: 'None',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
    },

    changeTypes: {
      baseline: 'Baseline',
      numeric_change: 'Numeric Change',
      duration_change: 'Duration Change',
      modality_change: 'Modality Change',
      negation_change: 'Negation Change',
      condition_change: 'Condition Change',
      condition_removed: 'Condition Removed',
      scope_change: 'Scope Change',
      actor_change: 'Actor Change',
      state_change: 'State Change',
      sequence_change: 'Sequence Change',
      numeric_constraint_removed:
        'Numeric Constraint Removed',
      duration_constraint_removed:
        'Duration Constraint Removed',
    },
  },

  de: {
    sectionLabel:
      'ANFORDERUNGSVERLAUF',

    title:
      'Versionsverlauf der Anforderung',

    subtitle:
      'Prüfen Sie Versionen, Übergänge und risikoreiche Änderungen einer Anforderung im Zeitverlauf.',

    module:
      'MODUL',

    requirement:
      'ANFORDERUNG',

    allModules:
      'Alle Module',

    version:
      'Versionen',

    transition:
      'Übergänge',

    highestRisk:
      'Höchstes Risiko',

    currentVersion:
      'Aktuelle Version',

    currentRequirement:
      'AKTUELLE ANFORDERUNG',

    timelineTitle:
      'Versionsverlauf',

    timelineSubtitle:
      'Entwicklung der Anforderung von der ersten bis zur aktuellen Version',

    versionLabel:
      'VERSION',

    initialVersion:
      'Erste Version',

    current:
      'Aktuell',

    loadingCatalog:
      'Versionsverlauf wird geladen...',

    loadingTimeline:
      'Zeitleiste wird geladen...',

    emptyTitle:
      'Kein Versionsverlauf gefunden',

    emptyText:
      'Im Verlaufsdatensatz sind keine Anforderungen zur Anzeige vorhanden.',

    catalogLoadError:
      'Verlaufsdaten konnten nicht geladen werden.',

    historyLoadError:
      'Anforderungsverlauf konnte nicht geladen werden.',

    transitionFallback:
      'Übergang',

    risks: {
      none: 'Kein',
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      critical: 'Kritisch',
    },

    changeTypes: {
      baseline: 'Ausgangsversion',
      numeric_change: 'Numerische Änderung',
      duration_change: 'Daueränderung',
      modality_change: 'Modalitätsänderung',
      negation_change: 'Negationsänderung',
      condition_change: 'Bedingungsänderung',
      condition_removed: 'Bedingung entfernt',
      scope_change: 'Umfangsänderung',
      actor_change: 'Akteuränderung',
      state_change: 'Statusänderung',
      sequence_change: 'Reihenfolgeänderung',
      numeric_constraint_removed:
        'Numerische Einschränkung entfernt',
      duration_constraint_removed:
        'Zeitbeschränkung entfernt',
    },
  },

  fr: {
    sectionLabel:
      'HISTORIQUE DES EXIGENCES',

    title:
      'Chronologie des versions de l’exigence',

    subtitle:
      'Consultez les versions, les transitions et les modifications à risque d’une exigence au fil du temps.',

    module:
      'MODULE',

    requirement:
      'EXIGENCE',

    allModules:
      'Tous les modules',

    version:
      'Versions',

    transition:
      'Transitions',

    highestRisk:
      'Risque le plus élevé',

    currentVersion:
      'Version actuelle',

    currentRequirement:
      'EXIGENCE ACTUELLE',

    timelineTitle:
      'Chronologie des versions',

    timelineSubtitle:
      'Évolution de l’exigence de la première version à la version actuelle',

    versionLabel:
      'VERSION',

    initialVersion:
      'Première version',

    current:
      'Actuelle',

    loadingCatalog:
      'Chargement de l’historique des versions...',

    loadingTimeline:
      'Chargement de la chronologie...',

    emptyTitle:
      'Aucun historique de version trouvé',

    emptyText:
      'Aucune exigence à afficher dans le jeu de données historique.',

    catalogLoadError:
      'Les données historiques n’ont pas pu être chargées.',

    historyLoadError:
      'L’historique de l’exigence n’a pas pu être chargé.',

    transitionFallback:
      'Transition',

    risks: {
      none: 'Aucun',
      low: 'Faible',
      medium: 'Moyen',
      high: 'Élevé',
      critical: 'Critique',
    },

    changeTypes: {
      baseline: 'Référence',
      numeric_change: 'Modification numérique',
      duration_change: 'Modification de durée',
      modality_change: 'Modification de modalité',
      negation_change: 'Modification de négation',
      condition_change: 'Modification de condition',
      condition_removed: 'Condition supprimée',
      scope_change: 'Modification de portée',
      actor_change: 'Modification d’acteur',
      state_change: 'Modification d’état',
      sequence_change: 'Modification de séquence',
      numeric_constraint_removed:
        'Contrainte numérique supprimée',
      duration_constraint_removed:
        'Contrainte de durée supprimée',
    },
  },

  es: {
    sectionLabel:
      'HISTORIAL DE REQUISITOS',

    title:
      'Cronología de versiones del requisito',

    subtitle:
      'Revisa las versiones, transiciones y cambios de riesgo de un requisito a lo largo del tiempo.',

    module:
      'MÓDULO',

    requirement:
      'REQUISITO',

    allModules:
      'Todos los módulos',

    version:
      'Versiones',

    transition:
      'Transiciones',

    highestRisk:
      'Riesgo más alto',

    currentVersion:
      'Versión actual',

    currentRequirement:
      'REQUISITO ACTUAL',

    timelineTitle:
      'Cronología de versiones',

    timelineSubtitle:
      'Evolución del requisito desde la primera versión hasta la versión actual',

    versionLabel:
      'VERSIÓN',

    initialVersion:
      'Primera versión',

    current:
      'Actual',

    loadingCatalog:
      'Cargando historial de versiones...',

    loadingTimeline:
      'Cargando cronología...',

    emptyTitle:
      'No se encontró historial de versiones',

    emptyText:
      'No hay requisitos para mostrar en el conjunto de datos histórico.',

    catalogLoadError:
      'No se pudieron cargar los datos históricos.',

    historyLoadError:
      'No se pudo cargar el historial del requisito.',

    transitionFallback:
      'Transición',

    risks: {
      none: 'Ninguno',
      low: 'Bajo',
      medium: 'Medio',
      high: 'Alto',
      critical: 'Crítico',
    },

    changeTypes: {
      baseline: 'Base',
      numeric_change: 'Cambio numérico',
      duration_change: 'Cambio de duración',
      modality_change: 'Cambio de modalidad',
      negation_change: 'Cambio de negación',
      condition_change: 'Cambio de condición',
      condition_removed: 'Condición eliminada',
      scope_change: 'Cambio de alcance',
      actor_change: 'Cambio de actor',
      state_change: 'Cambio de estado',
      sequence_change: 'Cambio de secuencia',
      numeric_constraint_removed:
        'Restricción numérica eliminada',
      duration_constraint_removed:
        'Restricción de duración eliminada',
    },
  },
}


const MODULE_LABELS:
Record<
  SupportedLanguage,
  Record<string, string>
> = {
  tr: {
    activation: 'Aktivasyon',
    billing: 'Faturalama',
    notification: 'Bildirim',
    order: 'Sipariş',
    resource: 'Kaynak',
    security: 'Güvenlik',
    support: 'Destek',
  },
  en: {
    activation: 'Activation',
    billing: 'Billing',
    notification: 'Notification',
    order: 'Order',
    resource: 'Resource',
    security: 'Security',
    support: 'Support',
  },
  de: {
    activation: 'Aktivierung',
    billing: 'Abrechnung',
    notification: 'Benachrichtigung',
    order: 'Bestellung',
    resource: 'Ressource',
    security: 'Sicherheit',
    support: 'Support',
  },
  fr: {
    activation: 'Activation',
    billing: 'Facturation',
    notification: 'Notification',
    order: 'Commande',
    resource: 'Ressource',
    security: 'Sécurité',
    support: 'Assistance',
  },
  es: {
    activation: 'Activación',
    billing: 'Facturación',
    notification: 'Notificación',
    order: 'Pedido',
    resource: 'Recurso',
    security: 'Seguridad',
    support: 'Soporte',
  },
}


function formatModule(
  value: string,
  language: SupportedLanguage,
): string {
  return (
    MODULE_LABELS[language][
      value.trim().toLowerCase()
    ]
    ?? value
  )
}


function humanizeChangeType(
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
  language:
    SupportedLanguage,
): string {
  if (!value) {
    return COPY[
      language
    ].changeTypes.baseline
  }

  const normalized =
    value.toLowerCase()

  if (
    normalized === 'baseline'
  ) {
    return COPY[
      language
    ].changeTypes.baseline
  }

  return (
    COPY[
      language
    ].changeTypes[
      normalized
    ]
    ?? humanizeChangeType(
      value,
    )
  )
}


function formatRisk(
  value:
    string | null,
  language:
    SupportedLanguage,
): string {
  const key =
    value
      ? value.toLowerCase()
      : 'none'

  return (
    COPY[
      language
    ].risks[key]
    ?? value
    ?? COPY[
      language
    ].risks.none
  )
}


function HistoryPage() {
  const {
    language,
  } = useLanguage()

  const copy =
    COPY[language]

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
            'CATALOG_LOAD_ERROR',
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
            'HISTORY_LOAD_ERROR',
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


  const renderedError =
    error
      === 'CATALOG_LOAD_ERROR'
      ? copy.catalogLoadError
      : error
        === 'HISTORY_LOAD_ERROR'
        ? copy.historyLoadError
        : error


  if (loadingCatalog) {
    return (
      <div className="dashboard-message">
        {copy.loadingCatalog}
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
          {copy.emptyTitle}
        </h2>

        <p>
          {copy.emptyText}
        </p>

      </div>
    )
  }


  return (
    <div className="history-page">

      <section className="history-header">

        <div>

          <span className="section-label">
            {copy.sectionLabel}
          </span>

          <h2>
            {copy.title}
          </h2>

          <p>
            {copy.subtitle}
          </p>

        </div>

      </section>


      <section className="history-filter-card">

        <div>

          <label htmlFor="history-module">
            {copy.module}
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
              {copy.allModules}
            </option>

            {catalog.modules.map(
              (module) => (
                <option
                  key={module}
                  value={module}
                >
                  {
                    formatModule(
                      module,
                      language,
                    )
                  }
                </option>
              ),
            )}

          </select>

        </div>


        <div>

          <label htmlFor="history-requirement">
            {copy.requirement}
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
                    && formatModule(
                      requirement.module,
                      language,
                    )
                  }
                </option>
              ),
            )}

          </select>

        </div>

      </section>


      {renderedError && (
        <div className="dashboard-message error">
          {renderedError}
        </div>
      )}


      {loadingHistory && (
        <div className="dashboard-message">
          {copy.loadingTimeline}
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
                    {copy.version}
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
                    {copy.transition}
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
                    {copy.highestRisk}
                  </span>

                  <strong className="history-risk-text">
                    {
                      formatRisk(
                        historyDetail
                          .summary
                          .highest_risk,
                        language,
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
                    {copy.currentVersion}
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
                      && formatModule(
                        historyDetail
                          .summary
                          .module,
                        language,
                      )
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
                              language,
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
                    {copy.currentRequirement}
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
                  {copy.timelineTitle}
                </h3>

                <p>
                  {copy.timelineSubtitle}
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
                        ?.toLowerCase()
                      ?? 'none'

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
                                    ?? copy.transitionFallback
                                  }
                                </span>


                                <span className="history-type-badge">
                                  {
                                    formatChangeType(
                                      item
                                        .change_type,
                                      language,
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
                                      language,
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
                                  {copy.versionLabel}
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
                                      {copy.initialVersion}
                                    </span>
                                  )}


                                {item
                                  .is_current_version
                                  && (
                                    <span className="current">
                                      {copy.current}
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
