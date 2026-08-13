import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  GitCompare,
  List,
  Search,
  ShieldAlert,
  Table2,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './ComparisonPage.css'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import {
  getAnalyses,
  getAnalysis,
} from '../services/api'

import type {
  AnalysisDetail,
  AnalysisSummary,
  RequirementChange,
} from '../types/api'


type ComparisonViewMode =
  | 'detail'
  | 'table'


type UiLanguage =
  | 'tr'
  | 'en'
  | 'de'
  | 'fr'
  | 'es'


type ErrorType =
  | 'analyses'
  | 'detail'
  | null


const LOCALES:
Record<UiLanguage, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
}


const COPY = {
  tr: {
    kicker:
      'VERSİYON KARŞILAŞTIRMA',

    title:
      'Gereksinim Değişiklikleri',

    description:
      'Gereksinim versiyonları arasındaki anlamsal değişiklikleri, riskleri ve öncelikli inceleme alanlarını karşılaştır.',

    analysis:
      'ANALİZ',

    source:
      'KAYNAK',

    target:
      'HEDEF',

    createdBy:
      'OLUŞTURAN',

    createdAt:
      'OLUŞTURULMA',

    unknownUser:
      'Bilinmiyor',

    totalChanges:
      'Toplam Değişiklik',

    totalChangesHint:
      'analiz sonucu',

    lowRisk:
      'Düşük Risk',

    lowRiskHint:
      'düşük öncelik',

    mediumRisk:
      'Orta Risk',

    mediumRiskHint:
      'inceleme önerilir',

    highRisk:
      'Yüksek Risk',

    highRiskHint:
      'öncelikli inceleme',

    criticalRisk:
      'Kritik Risk',

    criticalRiskHint:
      'kritik değişiklik',

    resultsKicker:
      'ANALİZ SONUÇLARI',

    resultsTitle:
      'Değişiklikler',

    detail:
      'Detay',

    table:
      'Tablo',

    viewAria:
      'Karşılaştırma görünümü',

    searchPlaceholder:
      'Requirement ID, gereksinim metni veya açıklama ara...',

    allRisks:
      'Tüm Riskler',

    low:
      'Düşük',

    medium:
      'Orta',

    high:
      'Yüksek',

    critical:
      'Kritik',

    allChangeTypes:
      'Tüm Değişim Türleri',

    resultUnit:
      'sonuç',

    oldId:
      'Eski ID',

    newId:
      'Yeni ID',

    oldRequirement:
      'Eski Gereksinim',

    newRequirement:
      'Yeni Gereksinim',

    changeType:
      'Değişim Türü',

    risk:
      'Risk',

    riskScore:
      'Risk Skoru',

    confidence:
      'Güven',

    detailAction:
      'Detay',

    previousRequirement:
      'ÖNCEKİ GEREKSİNİM',

    nextRequirement:
      'YENİ GEREKSİNİM',

    riskExplanation:
      'RİSK AÇIKLAMASI',

    noExplanation:
      'Açıklama bulunmuyor.',

    oldMissing:
      'Önceki gereksinim metni bulunamadı.',

    oldNotExists:
      'Bu gereksinim önceki versiyonda bulunmuyordu.',

    newMissing:
      'Yeni gereksinim metni bulunamadı.',

    removed:
      'Bu gereksinim yeni versiyondan kaldırıldı.',

    loadingAnalyses:
      'Karşılaştırmalar yükleniyor...',

    loadingDetail:
      'Analiz detayları yükleniyor...',

    noAnalyses:
      'Karşılaştırma bulunmuyor',

    noAnalysesDescription:
      'Önce Yükleme ekranından iki gereksinim versiyonunu karşılaştır.',

    noFilterResult:
      'Seçilen filtrelere uygun değişiklik bulunamadı.',

    analysesError:
      'Analiz listesi yüklenemedi.',

    detailError:
      'Karşılaştırma sonuçları yüklenemedi.',
  },


  en: {
    kicker:
      'VERSION COMPARISON',

    title:
      'Requirement Changes',

    description:
      'Compare semantic changes, risks and priority review areas between requirement versions.',

    analysis:
      'ANALYSIS',

    source:
      'SOURCE',

    target:
      'TARGET',

    createdBy:
      'CREATED BY',

    createdAt:
      'CREATED',

    unknownUser:
      'Unknown',

    totalChanges:
      'Total Changes',

    totalChangesHint:
      'analysis results',

    lowRisk:
      'Low Risk',

    lowRiskHint:
      'low priority',

    mediumRisk:
      'Medium Risk',

    mediumRiskHint:
      'review recommended',

    highRisk:
      'High Risk',

    highRiskHint:
      'priority review',

    criticalRisk:
      'Critical Risk',

    criticalRiskHint:
      'critical change',

    resultsKicker:
      'ANALYSIS RESULTS',

    resultsTitle:
      'Changes',

    detail:
      'Detail',

    table:
      'Table',

    viewAria:
      'Comparison view',

    searchPlaceholder:
      'Search requirement ID, requirement text or explanation...',

    allRisks:
      'All Risks',

    low:
      'Low',

    medium:
      'Medium',

    high:
      'High',

    critical:
      'Critical',

    allChangeTypes:
      'All Change Types',

    resultUnit:
      'results',

    oldId:
      'Previous ID',

    newId:
      'New ID',

    oldRequirement:
      'Previous Requirement',

    newRequirement:
      'New Requirement',

    changeType:
      'Change Type',

    risk:
      'Risk',

    riskScore:
      'Risk Score',

    confidence:
      'Confidence',

    detailAction:
      'Detail',

    previousRequirement:
      'PREVIOUS REQUIREMENT',

    nextRequirement:
      'NEW REQUIREMENT',

    riskExplanation:
      'RISK EXPLANATION',

    noExplanation:
      'No explanation available.',

    oldMissing:
      'Previous requirement text is unavailable.',

    oldNotExists:
      'This requirement did not exist in the previous version.',

    newMissing:
      'New requirement text is unavailable.',

    removed:
      'This requirement was removed from the new version.',

    loadingAnalyses:
      'Loading comparisons...',

    loadingDetail:
      'Loading analysis details...',

    noAnalyses:
      'No comparisons found',

    noAnalysesDescription:
      'Compare two requirement versions from the Upload page first.',

    noFilterResult:
      'No changes match the selected filters.',

    analysesError:
      'The analysis list could not be loaded.',

    detailError:
      'Comparison results could not be loaded.',
  },


  de: {
    kicker:
      'VERSIONSVERGLEICH',

    title:
      'Anforderungsänderungen',

    description:
      'Semantische Änderungen, Risiken und priorisierte Prüfbereiche zwischen Anforderungsversionen vergleichen.',

    analysis:
      'ANALYSE',

    source:
      'QUELLE',

    target:
      'ZIEL',

    createdBy:
      'ERSTELLT VON',

    createdAt:
      'ERSTELLT',

    unknownUser:
      'Unbekannt',

    totalChanges:
      'Gesamtänderungen',

    totalChangesHint:
      'Analyseergebnisse',

    lowRisk:
      'Niedriges Risiko',

    lowRiskHint:
      'niedrige Priorität',

    mediumRisk:
      'Mittleres Risiko',

    mediumRiskHint:
      'Prüfung empfohlen',

    highRisk:
      'Hohes Risiko',

    highRiskHint:
      'priorisierte Prüfung',

    criticalRisk:
      'Kritisches Risiko',

    criticalRiskHint:
      'kritische Änderung',

    resultsKicker:
      'ANALYSEERGEBNISSE',

    resultsTitle:
      'Änderungen',

    detail:
      'Details',

    table:
      'Tabelle',

    viewAria:
      'Vergleichsansicht',

    searchPlaceholder:
      'Anforderungs-ID, Text oder Erklärung suchen...',

    allRisks:
      'Alle Risiken',

    low:
      'Niedrig',

    medium:
      'Mittel',

    high:
      'Hoch',

    critical:
      'Kritisch',

    allChangeTypes:
      'Alle Änderungstypen',

    resultUnit:
      'Ergebnisse',

    oldId:
      'Vorherige ID',

    newId:
      'Neue ID',

    oldRequirement:
      'Vorherige Anforderung',

    newRequirement:
      'Neue Anforderung',

    changeType:
      'Änderungstyp',

    risk:
      'Risiko',

    riskScore:
      'Risikowert',

    confidence:
      'Konfidenz',

    detailAction:
      'Details',

    previousRequirement:
      'VORHERIGE ANFORDERUNG',

    nextRequirement:
      'NEUE ANFORDERUNG',

    riskExplanation:
      'RISIKOERKLÄRUNG',

    noExplanation:
      'Keine Erklärung verfügbar.',

    oldMissing:
      'Der vorherige Anforderungstext ist nicht verfügbar.',

    oldNotExists:
      'Diese Anforderung war in der vorherigen Version nicht vorhanden.',

    newMissing:
      'Der neue Anforderungstext ist nicht verfügbar.',

    removed:
      'Diese Anforderung wurde aus der neuen Version entfernt.',

    loadingAnalyses:
      'Vergleiche werden geladen...',

    loadingDetail:
      'Analysedetails werden geladen...',

    noAnalyses:
      'Keine Vergleiche gefunden',

    noAnalysesDescription:
      'Vergleichen Sie zunächst zwei Anforderungsversionen auf der Upload-Seite.',

    noFilterResult:
      'Keine Änderungen entsprechen den ausgewählten Filtern.',

    analysesError:
      'Die Analyseliste konnte nicht geladen werden.',

    detailError:
      'Die Vergleichsergebnisse konnten nicht geladen werden.',
  },


  fr: {
    kicker:
      'COMPARAISON DES VERSIONS',

    title:
      'Modifications des exigences',

    description:
      'Comparez les changements sémantiques, les risques et les zones de vérification prioritaires entre les versions des exigences.',

    analysis:
      'ANALYSE',

    source:
      'SOURCE',

    target:
      'CIBLE',

    createdBy:
      'CRÉÉ PAR',

    createdAt:
      'CRÉÉ LE',

    unknownUser:
      'Inconnu',

    totalChanges:
      'Total des modifications',

    totalChangesHint:
      'résultats d’analyse',

    lowRisk:
      'Risque faible',

    lowRiskHint:
      'faible priorité',

    mediumRisk:
      'Risque moyen',

    mediumRiskHint:
      'vérification recommandée',

    highRisk:
      'Risque élevé',

    highRiskHint:
      'vérification prioritaire',

    criticalRisk:
      'Risque critique',

    criticalRiskHint:
      'modification critique',

    resultsKicker:
      'RÉSULTATS DE L’ANALYSE',

    resultsTitle:
      'Modifications',

    detail:
      'Détail',

    table:
      'Tableau',

    viewAria:
      'Vue de comparaison',

    searchPlaceholder:
      'Rechercher un ID, un texte d’exigence ou une explication...',

    allRisks:
      'Tous les risques',

    low:
      'Faible',

    medium:
      'Moyen',

    high:
      'Élevé',

    critical:
      'Critique',

    allChangeTypes:
      'Tous les types de modification',

    resultUnit:
      'résultats',

    oldId:
      'Ancien ID',

    newId:
      'Nouvel ID',

    oldRequirement:
      'Exigence précédente',

    newRequirement:
      'Nouvelle exigence',

    changeType:
      'Type de modification',

    risk:
      'Risque',

    riskScore:
      'Score de risque',

    confidence:
      'Confiance',

    detailAction:
      'Détail',

    previousRequirement:
      'EXIGENCE PRÉCÉDENTE',

    nextRequirement:
      'NOUVELLE EXIGENCE',

    riskExplanation:
      'EXPLICATION DU RISQUE',

    noExplanation:
      'Aucune explication disponible.',

    oldMissing:
      'Le texte de l’exigence précédente est indisponible.',

    oldNotExists:
      'Cette exigence n’existait pas dans la version précédente.',

    newMissing:
      'Le texte de la nouvelle exigence est indisponible.',

    removed:
      'Cette exigence a été supprimée de la nouvelle version.',

    loadingAnalyses:
      'Chargement des comparaisons...',

    loadingDetail:
      'Chargement des détails de l’analyse...',

    noAnalyses:
      'Aucune comparaison trouvée',

    noAnalysesDescription:
      'Comparez d’abord deux versions des exigences depuis la page de téléversement.',

    noFilterResult:
      'Aucune modification ne correspond aux filtres sélectionnés.',

    analysesError:
      'La liste des analyses n’a pas pu être chargée.',

    detailError:
      'Les résultats de comparaison n’ont pas pu être chargés.',
  },


  es: {
    kicker:
      'COMPARACIÓN DE VERSIONES',

    title:
      'Cambios de requisitos',

    description:
      'Compara los cambios semánticos, los riesgos y las áreas de revisión prioritaria entre versiones de requisitos.',

    analysis:
      'ANÁLISIS',

    source:
      'ORIGEN',

    target:
      'DESTINO',

    createdBy:
      'CREADO POR',

    createdAt:
      'CREADO',

    unknownUser:
      'Desconocido',

    totalChanges:
      'Cambios totales',

    totalChangesHint:
      'resultados del análisis',

    lowRisk:
      'Riesgo bajo',

    lowRiskHint:
      'baja prioridad',

    mediumRisk:
      'Riesgo medio',

    mediumRiskHint:
      'revisión recomendada',

    highRisk:
      'Riesgo alto',

    highRiskHint:
      'revisión prioritaria',

    criticalRisk:
      'Riesgo crítico',

    criticalRiskHint:
      'cambio crítico',

    resultsKicker:
      'RESULTADOS DEL ANÁLISIS',

    resultsTitle:
      'Cambios',

    detail:
      'Detalle',

    table:
      'Tabla',

    viewAria:
      'Vista de comparación',

    searchPlaceholder:
      'Buscar ID, texto del requisito o explicación...',

    allRisks:
      'Todos los riesgos',

    low:
      'Bajo',

    medium:
      'Medio',

    high:
      'Alto',

    critical:
      'Crítico',

    allChangeTypes:
      'Todos los tipos de cambio',

    resultUnit:
      'resultados',

    oldId:
      'ID anterior',

    newId:
      'ID nuevo',

    oldRequirement:
      'Requisito anterior',

    newRequirement:
      'Nuevo requisito',

    changeType:
      'Tipo de cambio',

    risk:
      'Riesgo',

    riskScore:
      'Puntuación de riesgo',

    confidence:
      'Confianza',

    detailAction:
      'Detalle',

    previousRequirement:
      'REQUISITO ANTERIOR',

    nextRequirement:
      'NUEVO REQUISITO',

    riskExplanation:
      'EXPLICACIÓN DEL RIESGO',

    noExplanation:
      'No hay explicación disponible.',

    oldMissing:
      'El texto del requisito anterior no está disponible.',

    oldNotExists:
      'Este requisito no existía en la versión anterior.',

    newMissing:
      'El texto del nuevo requisito no está disponible.',

    removed:
      'Este requisito fue eliminado de la nueva versión.',

    loadingAnalyses:
      'Cargando comparaciones...',

    loadingDetail:
      'Cargando detalles del análisis...',

    noAnalyses:
      'No se encontraron comparaciones',

    noAnalysesDescription:
      'Primero compara dos versiones de requisitos desde la página de carga.',

    noFilterResult:
      'No hay cambios que coincidan con los filtros seleccionados.',

    analysesError:
      'No se pudo cargar la lista de análisis.',

    detailError:
      'No se pudieron cargar los resultados de comparación.',
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
  },
}


function detectLanguage(
  routeTitle: string,
): UiLanguage {
  if (
    routeTitle
    === 'Version Comparison'
  ) {
    return 'en'
  }

  if (
    routeTitle
    === 'Versionsvergleich'
  ) {
    return 'de'
  }

  if (
    routeTitle
    === 'Comparaison des versions'
  ) {
    return 'fr'
  }

  if (
    routeTitle
    === 'Comparación de versiones'
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


function getVisibleChangeTypes(
  change: RequirementChange,
): string[] {
  if (
    change.detailed_change_types
    && change
      .detailed_change_types
      .length > 0
  ) {
    return (
      change
        .detailed_change_types
    )
  }

  return [
    change.change_type,
  ]
}


function formatAnalysisDate(
  value: string,
  locale: string,
): string {
  const hasTimezone =
    /(?:Z|[+-]\d{2}:\d{2})$/i
      .test(
        value,
      )

  const normalized =
    hasTimezone
      ? value
      : `${value}Z`

  const date =
    new Date(
      normalized,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return (
    new Intl.DateTimeFormat(
      locale,
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(
      date,
    )
  )
}


function ComparisonPage() {
  const {
    t,
  } = useLanguage()


  const language =
    detectLanguage(
      t(
        'route.comparison.title',
      ),
    )


  const copy =
    COPY[
      language
    ]


  const locale =
    LOCALES[
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
    ErrorType
  >(null)


  const [
    searchTerm,
    setSearchTerm,
  ] = useState(
    '',
  )


  const [
    riskFilter,
    setRiskFilter,
  ] = useState(
    'all',
  )


  const [
    changeTypeFilter,
    setChangeTypeFilter,
  ] = useState(
    'all',
  )


  const [
    viewMode,
    setViewMode,
  ] = useState<
    ComparisonViewMode
  >(
    'detail',
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



  const changeTypes =
    useMemo(
      () => {
        const types =
          new Set<string>()


        for (
          const change
          of analysis
            ?.requirement_changes
          ?? []
        ) {
          for (
            const type
            of getVisibleChangeTypes(
              change,
            )
          ) {
            types.add(
              type,
            )
          }
        }


        return (
          Array.from(
            types,
          ).sort()
        )
      },
      [
        analysis,
      ],
    )



  const metrics =
    useMemo(
      () => {
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
      },
      [
        analysis,
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


  function formatChangeType(
    value: string,
  ): string {
    const normalized =
      normalizeChangeType(
        value,
      )


    return (
      CHANGE_TYPE_LABELS[
        language
      ][
        normalized
      ]
      ?? prettifyChangeType(
        value,
      )
    )
  }


  function getOldRequirementText(
    change:
      RequirementChange,
  ): string {
    if (
      change
        .old_requirement_text
    ) {
      return (
        change
          .old_requirement_text
      )
    }


    if (
      change
        .old_requirement_id
      === null
    ) {
      return (
        copy.oldNotExists
      )
    }


    return copy.oldMissing
  }


  function getNewRequirementText(
    change:
      RequirementChange,
  ): string {
    if (
      change
        .new_requirement_text
    ) {
      return (
        change
          .new_requirement_text
      )
    }


    if (
      change
        .new_requirement_id
      === null
    ) {
      return copy.removed
    }


    return copy.newMissing
  }



  const filteredChanges =
    useMemo(
      () => {
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
            const visibleTypes =
              getVisibleChangeTypes(
                change,
              )


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
              || visibleTypes.includes(
                changeTypeFilter,
              )


            const localizedTypes =
              visibleTypes.map(
                (
                  type,
                ) =>
                  formatChangeType(
                    type,
                  ),
              )


            const searchableText =
              [
                change
                  .old_requirement_id
                ?? '',

                change
                  .new_requirement_id
                ?? '',

                change
                  .old_requirement_text
                ?? '',

                change
                  .new_requirement_text
                ?? '',

                change.change_type,

                ...visibleTypes,

                ...localizedTypes,

                change.risk_level,

                formatRiskLevel(
                  change.risk_level,
                ),

                change.explanation
                ?? '',
              ]
                .join(
                  ' ',
                )
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
      },
      [
        analysis,
        searchTerm,
        riskFilter,
        changeTypeFilter,
        language,
      ],
    )



  if (
    errorType
    === 'analyses'
  ) {
    return (
      <div className="dashboard-message error">
        {copy.analysesError}
      </div>
    )
  }


  if (
    loading
    && analyses.length
      === 0
  ) {
    return (
      <div className="dashboard-message">
        {copy.loadingAnalyses}
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
          {copy.noAnalyses}
        </h2>


        <p>
          {
            copy
              .noAnalysesDescription
          }
        </p>

      </div>
    )
  }



  return (
    <div className="comparison-page">



      <section className="comparison-header">

        <div>

          <span className="section-label">
            {copy.kicker}
          </span>


          <h2>
            {copy.title}
          </h2>


          <p>
            {copy.description}
          </p>

        </div>


        <div className="comparison-analysis-select">

          <label
            htmlFor="comparison-analysis"
          >
            {copy.analysis}
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

                setSearchTerm(
                  '',
                )

                setRiskFilter(
                  'all',
                )

                setChangeTypeFilter(
                  'all',
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

      </section>




      {
        analysis
        && (
          <section className="comparison-version-card">

            <div className="version-box">

              <span>
                {copy.source}
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
                {copy.target}
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
                {copy.analysis}
              </span>

              <strong>
                {
                  analysis
                    .analysis_name
                }
              </strong>

            </div>


            <div className="comparison-name">

              <span>
                {copy.createdBy}
              </span>

              <strong>
                {
                  analysis
                    .created_by_name
                  ?? copy
                    .unknownUser
                }
              </strong>

              {
                (
                  analysis
                    .created_by_department
                  || analysis
                    .created_by_role
                )
                && (
                  <small>
                    {
                      [
                        analysis
                          .created_by_department,

                        analysis
                          .created_by_role,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          ' · ',
                        )
                    }
                  </small>
                )
              }

            </div>


            <div className="comparison-name">

              <span>
                {copy.createdAt}
              </span>

              <strong>
                {
                  formatAnalysisDate(
                    analysis
                      .created_at,
                    locale,
                  )
                }
              </strong>

            </div>

          </section>
        )
      }




      <section className="comparison-kpi-grid">

        <article className="comparison-kpi-card total">

          <div className="comparison-kpi-icon blue">

            <GitCompare
              size={17}
            />

          </div>


          <div>

            <span>
              {
                copy
                  .totalChanges
              }
            </span>

            <strong>
              {metrics.total}
            </strong>

            <small>
              {
                copy
                  .totalChangesHint
              }
            </small>

          </div>

        </article>


        <article className="comparison-kpi-card low">

          <div className="comparison-kpi-icon green">

            <ShieldAlert
              size={17}
            />

          </div>


          <div>

            <span>
              {copy.lowRisk}
            </span>

            <strong>
              {metrics.low}
            </strong>

            <small>
              {copy.lowRiskHint}
            </small>

          </div>

        </article>


        <article className="comparison-kpi-card medium">

          <div className="comparison-kpi-icon yellow">

            <AlertTriangle
              size={17}
            />

          </div>


          <div>

            <span>
              {copy.mediumRisk}
            </span>

            <strong>
              {metrics.medium}
            </strong>

            <small>
              {
                copy
                  .mediumRiskHint
              }
            </small>

          </div>

        </article>


        <article className="comparison-kpi-card high">

          <div className="comparison-kpi-icon orange">

            <AlertTriangle
              size={17}
            />

          </div>


          <div>

            <span>
              {copy.highRisk}
            </span>

            <strong>
              {metrics.high}
            </strong>

            <small>
              {
                copy
                  .highRiskHint
              }
            </small>

          </div>

        </article>


        <article className="comparison-kpi-card critical">

          <div className="comparison-kpi-icon red">

            <ShieldAlert
              size={17}
            />

          </div>


          <div>

            <span>
              {
                copy
                  .criticalRisk
              }
            </span>

            <strong>
              {metrics.critical}
            </strong>

            <small>
              {
                copy
                  .criticalRiskHint
              }
            </small>

          </div>

        </article>

      </section>




      <section className="comparison-results-heading">

        <div>

          <span className="section-label">
            {
              copy
                .resultsKicker
            }
          </span>


          <h3>
            {copy.resultsTitle}
          </h3>


          <p>
            {
              filteredChanges
                .length
            }
            {' '}
            {
              copy
                .resultUnit
            }
          </p>

        </div>


        <div className="comparison-results-actions">

          <div
            className="comparison-view-toggle"
            role="group"
            aria-label={
              copy.viewAria
            }
          >

            <button
              type="button"
              className={
                viewMode
                  === 'detail'
                  ? 'active'
                  : ''
              }
              onClick={
                () =>
                  setViewMode(
                    'detail',
                  )
              }
            >

              <List
                size={14}
              />

              {copy.detail}

            </button>


            <button
              type="button"
              className={
                viewMode
                  === 'table'
                  ? 'active'
                  : ''
              }
              onClick={
                () =>
                  setViewMode(
                    'table',
                  )
              }
            >

              <Table2
                size={14}
              />

              {copy.table}

            </button>

          </div>

        </div>

      </section>




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
              copy
                .searchPlaceholder
            }
            onChange={
              (
                event,
              ) =>
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
            (
              event,
            ) =>
              setRiskFilter(
                event
                  .target
                  .value,
              )
          }
        >

          <option value="all">
            {copy.allRisks}
          </option>

          <option value="low">
            {copy.low}
          </option>

          <option value="medium">
            {copy.medium}
          </option>

          <option value="high">
            {copy.high}
          </option>

          <option value="critical">
            {copy.critical}
          </option>

        </select>


        <select
          value={
            changeTypeFilter
          }
          onChange={
            (
              event,
            ) =>
              setChangeTypeFilter(
                event
                  .target
                  .value,
              )
          }
        >

          <option value="all">
            {
              copy
                .allChangeTypes
            }
          </option>


          {
            changeTypes.map(
              (
                type,
              ) => (
                <option
                  key={
                    type
                  }
                  value={
                    type
                  }
                >
                  {
                    formatChangeType(
                      type,
                    )
                  }
                </option>
              ),
            )
          }

        </select>

      </section>




      {
        errorType
        === 'detail'
        && (
          <div className="dashboard-message error">
            {copy.detailError}
          </div>
        )
      }




      {
        loading
        ? (
          <div className="comparison-empty-result">
            {
              copy
                .loadingDetail
            }
          </div>
        )

        : filteredChanges
            .length
          === 0
          ? (
            <div className="comparison-empty-result">
              {
                copy
                  .noFilterResult
              }
            </div>
          )

          : viewMode
              === 'table'
            ? (


              <section className="comparison-table-shell">

                <div className="comparison-table-scroll">

                  <table className="comparison-table">

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
                              .oldRequirement
                          }
                        </th>

                        <th>
                          {
                            copy
                              .newRequirement
                          }
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

                        <th
                          className="comparison-table-action-header"
                          aria-label={
                            copy
                              .detailAction
                          }
                        />

                      </tr>

                    </thead>


                    <tbody>

                      {
                        filteredChanges.map(
                          (
                            change,
                          ) => {
                            const risk =
                              change
                                .risk_level
                                .toLowerCase()


                            const visibleTypes =
                              getVisibleChangeTypes(
                                change,
                              )


                            return (
                              <tr
                                key={
                                  change.id
                                }
                              >

                                <td>

                                  <span className="comparison-table-id">

                                    {
                                      change
                                        .old_requirement_id
                                      ?? '—'
                                    }

                                  </span>

                                </td>


                                <td>

                                  <span className="comparison-table-id target">

                                    {
                                      change
                                        .new_requirement_id
                                      ?? '—'
                                    }

                                  </span>

                                </td>


                                <td>

                                  <p
                                    className="comparison-table-text old"
                                    title={
                                      getOldRequirementText(
                                        change,
                                      )
                                    }
                                  >
                                    {
                                      getOldRequirementText(
                                        change,
                                      )
                                    }
                                  </p>

                                </td>


                                <td>

                                  <p
                                    className="comparison-table-text new"
                                    title={
                                      getNewRequirementText(
                                        change,
                                      )
                                    }
                                  >
                                    {
                                      getNewRequirementText(
                                        change,
                                      )
                                    }
                                  </p>

                                </td>


                                <td>

                                  <div className="comparison-table-types">

                                    {
                                      visibleTypes.map(
                                        (
                                          type,
                                        ) => (
                                          <span
                                            key={
                                              `${change.id}-${type}`
                                            }
                                            className="comparison-table-type"
                                          >
                                            {
                                              formatChangeType(
                                                type,
                                              )
                                            }
                                          </span>
                                        ),
                                      )
                                    }

                                  </div>

                                </td>


                                <td>

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

                                </td>


                                <td>

                                  <span className="comparison-table-score">
                                    {
                                      change
                                        .risk_score
                                        .toFixed(
                                          1,
                                        )
                                    }
                                  </span>

                                </td>


                                <td>

                                  <span className="comparison-table-score">

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

                                  </span>

                                </td>


                                <td className="comparison-table-action-cell">

                                  <button
                                    type="button"
                                    className="comparison-table-detail-button"
                                    aria-label={
                                      copy
                                        .detailAction
                                    }
                                    onClick={
                                      () =>
                                        setViewMode(
                                          'detail',
                                        )
                                    }
                                  >

                                    <ChevronRight
                                      size={15}
                                    />

                                  </button>

                                </td>

                              </tr>
                            )
                          },
                        )
                      }

                    </tbody>

                  </table>

                </div>

              </section>
            )

            : (


              <section className="comparison-change-list">

                {
                  filteredChanges.map(
                    (
                      change,
                    ) => {
                      const risk =
                        change
                          .risk_level
                          .toLowerCase()


                      const visibleTypes =
                        getVisibleChangeTypes(
                          change,
                        )


                      return (
                        <article
                          key={
                            change.id
                          }
                          className={
                            `comparison-change-card risk-${risk}`
                          }
                        >



                          <div className="change-card-top">

                            <div className="change-requirement-route">

                              <span className="requirement-id">

                                {
                                  change
                                    .old_requirement_id
                                  ?? '—'
                                }

                              </span>


                              <ArrowRight
                                size={15}
                              />


                              <span className="requirement-id target">

                                {
                                  change
                                    .new_requirement_id
                                  ?? '—'
                                }

                              </span>

                            </div>


                            <div className="change-card-badges">

                              {
                                visibleTypes.map(
                                  (
                                    type,
                                  ) => (
                                    <span
                                      key={
                                        `${change.id}-${type}`
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
                                )
                              }


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




                          <div className="requirement-text-diff">

                            <div className="requirement-text-panel old">

                              <span className="requirement-text-label">
                                {
                                  copy
                                    .previousRequirement
                                }
                              </span>


                              <p>
                                {
                                  getOldRequirementText(
                                    change,
                                  )
                                }
                              </p>

                            </div>


                            <div className="requirement-text-arrow">

                              <ArrowRight
                                size={17}
                              />

                            </div>


                            <div className="requirement-text-panel new">

                              <span className="requirement-text-label">
                                {
                                  copy
                                    .nextRequirement
                                }
                              </span>


                              <p>
                                {
                                  getNewRequirementText(
                                    change,
                                  )
                                }
                              </p>

                            </div>

                          </div>




                          <div className="change-card-metrics">

                            <div>

                              <span>
                                {
                                  copy
                                    .riskScore
                                    .toUpperCase()
                                }
                              </span>


                              <strong>
                                {
                                  change
                                    .risk_score
                                    .toFixed(
                                      1,
                                    )
                                }
                              </strong>


                              <div className="change-metric-progress">

                                <span
                                  style={{
                                    width:
                                      `${Math.min(
                                        100,
                                        Math.max(
                                          0,
                                          change
                                            .risk_score,
                                        ),
                                      )}%`,
                                  }}
                                />

                              </div>

                            </div>


                            <div>

                              <span>
                                {
                                  copy
                                    .confidence
                                    .toUpperCase()
                                }
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
                                      ).toFixed(
                                        0,
                                      )}%`
                                    : '—'
                                }

                              </strong>


                              <div className="change-metric-progress confidence">

                                <span
                                  style={{
                                    width:
                                      change
                                        .confidence
                                      !== null
                                        ? `${Math.min(
                                            100,
                                            Math.max(
                                              0,
                                              change
                                                .confidence
                                              * 100,
                                            ),
                                          )}%`
                                        : '0%',
                                  }}
                                />

                              </div>

                            </div>


                            <div className="change-explanation">

                              <span>
                                {
                                  copy
                                    .riskExplanation
                                }
                              </span>


                              <p>
                                {
                                  change
                                    .explanation
                                  ?? copy
                                    .noExplanation
                                }
                              </p>

                            </div>

                          </div>

                        </article>
                      )
                    },
                  )
                }

              </section>
            )
      }

    </div>
  )
}


export default ComparisonPage
