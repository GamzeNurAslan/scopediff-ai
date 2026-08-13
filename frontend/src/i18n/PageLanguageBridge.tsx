import {
  useEffect,
} from 'react'

import {
  useLocation,
} from 'react-router'

import {
  useLanguage,
} from './LanguageContext'

import type {
  SupportedLanguage,
} from './translations'

import {
  translateContentBatch,
} from '../services/api'


type TranslationEntry =
  Record<
    SupportedLanguage,
    string
  >


function e(
  tr: string,
  en: string,
  de: string,
  fr: string,
  es: string,
): TranslationEntry {
  return {
    tr,
    en,
    de,
    fr,
    es,
  }
}


/* =========================================================
   COMMON
   ========================================================= */

const COMMON:
TranslationEntry[] = [
  e(
    'KAYNAK',
    'SOURCE',
    'QUELLE',
    'SOURCE',
    'ORIGEN',
  ),

  e(
    'HEDEF',
    'TARGET',
    'ZIEL',
    'CIBLE',
    'DESTINO',
  ),

  e(
    'ANALIZ',
    'ANALYSIS',
    'ANALYSE',
    'ANALYSE',
    'AN?LISIS',
  ),

  e(
    'Analiz',
    'Analysis',
    'Analyse',
    'Analyse',
    'An?lisis',
  ),

  e(
    'OLUSTURULMA',
    'CREATED',
    'ERSTELLT',
    'CR?? LE',
    'CREADO',
  ),

  e(
    'ANALIZI OLUSTURAN',
    'CREATED BY',
    'ERSTELLT VON',
    'CR?? PAR',
    'CREADO POR',
  ),

  e(
    'D?s?k',
    'Low',
    'Niedrig',
    'Faible',
    'Bajo',
  ),

  e(
    'Orta',
    'Medium',
    'Mittel',
    'Moyen',
    'Medio',
  ),

  e(
    'Y?ksek',
    'High',
    'Hoch',
    '?lev?',
    'Alto',
  ),

  e(
    'Kritik',
    'Critical',
    'Kritisch',
    'Critique',
    'Cr?tico',
  ),

  e(
    'D?s?k Risk',
    'Low Risk',
    'Niedriges Risiko',
    'Risque faible',
    'Riesgo bajo',
  ),

  e(
    'Orta Risk',
    'Medium Risk',
    'Mittleres Risiko',
    'Risque moyen',
    'Riesgo medio',
  ),

  e(
    'Y?ksek Risk',
    'High Risk',
    'Hohes Risiko',
    'Risque ?lev?',
    'Riesgo alto',
  ),

  e(
    'Kritik Risk',
    'Critical Risk',
    'Kritisches Risiko',
    'Risque critique',
    'Riesgo cr?tico',
  ),

  e(
    'Toplam Degisiklik',
    'Total Changes',
    'Gesamt?nderungen',
    'Total des modifications',
    'Cambios totales',
  ),

  e(
    'Risk',
    'Risk',
    'Risiko',
    'Risque',
    'Riesgo',
  ),

  e(
    'Risk Skoru',
    'Risk Score',
    'Risikowert',
    'Score de risque',
    'Puntuaci?n de riesgo',
  ),

  e(
    'Confidence',
    'Confidence',
    'Konfidenz',
    'Confiance',
    'Confianza',
  ),

  e(
    'Scope Change',
    'Scope Change',
    'Umfangs?nderung',
    'Modification de port?e',
    'Cambio de alcance',
  ),

  e(
    'Modality Change',
    'Modality Change',
    'Modalit?ts?nderung',
    'Modification de modalit?',
    'Cambio de modalidad',
  ),

  e(
    'Numeric Change',
    'Numeric Change',
    'Numerische ?nderung',
    'Modification num?rique',
    'Cambio num?rico',
  ),

  e(
    'Duration Change',
    'Duration Change',
    'Dauer?nderung',
    'Modification de dur?e',
    'Cambio de duraci?n',
  ),

  e(
    'Condition Change',
    'Condition Change',
    'Bedingungs?nderung',
    'Modification de condition',
    'Cambio de condici?n',
  ),

  e(
    'Actor Change',
    'Actor Change',
    'Akteur?nderung',
    'Modification d?acteur',
    'Cambio de actor',
  ),

  e(
    'State Change',
    'State Change',
    'Status?nderung',
    'Modification d??tat',
    'Cambio de estado',
  ),
]


/* =========================================================
   DEFECT ANALYSIS
   ========================================================= */

const DEFECT:
TranslationEntry[] = [
  e(
    'DEFECT ANALIZI',
    'DEFECT ANALYSIS',
    'DEFEKTANALYSE',
    'ANALYSE DES D?FAUTS',
    'AN?LISIS DE DEFECTOS',
  ),

  e(
    'Defect ile Iliskili Degisiklikleri ?nceliklendir',
    'Prioritize Changes Related to the Defect',
    'Defektbezogene ?nderungen priorisieren',
    'Prioriser les modifications li?es au d?faut',
    'Priorizar cambios relacionados con el defecto',
  ),

  e(
    'Defect a?iklamasini se?ili gereksinim degisiklikleriyle anlamsal olarak karsilastir. Sonu?lar kesin k?k neden degildir; incelenmesi gereken aday degisikliklerdir.',
    'Semantically compare the defect description with the selected requirement changes. Results are not definitive root causes; they are candidate changes that require review.',
    'Vergleichen Sie die Defektbeschreibung semantisch mit den ausgew?hlten Anforderungs?nderungen. Die Ergebnisse sind keine endg?ltigen Grundursachen, sondern zu pr?fende Kandidaten?nderungen.',
    'Comparez s?mantiquement la description du d?faut avec les modifications d?exigences s?lectionn?es. Les r?sultats ne constituent pas des causes racines d?finitives, mais des modifications candidates ? examiner.',
    'Compare sem?nticamente la descripci?n del defecto con los cambios de requisitos seleccionados. Los resultados no son causas ra?z definitivas, sino cambios candidatos que deben revisarse.',
  ),

  e(
    'ANALIZ EDILECEK DEGISIKLIK',
    'CHANGES TO ANALYZE',
    'ZU ANALYSIERENDE ?NDERUNGEN',
    'MODIFICATIONS ? ANALYSER',
    'CAMBIOS A ANALIZAR',
  ),

  e(
    'Defect A?iklamasi',
    'Defect Description',
    'Defektbeschreibung',
    'Description du d?faut',
    'Descripci?n del defecto',
  ),

  e(
    'Hata kaydindaki davranisi, belirtileri ve ilgili baglami m?mk?n oldugunca a?ik yaz.',
    'Describe the behavior, symptoms and relevant context from the defect record as clearly as possible.',
    'Beschreiben Sie Verhalten, Symptome und relevanten Kontext des Defekteintrags so klar wie m?glich.',
    'D?crivez aussi clairement que possible le comportement, les sympt?mes et le contexte du d?faut.',
    'Describe con la mayor claridad posible el comportamiento, los s?ntomas y el contexto relevante del defecto.',
  ),

  e(
    '?rn. Aktivasyon sirasinda port dogrulamasi tamamlanmadan kaynak rezervasyonu yapilabiliyor...',
    'E.g. Resource reservation can occur before port validation is completed during activation...',
    'Z. B. kann w?hrend der Aktivierung eine Ressourcenreservierung erfolgen, bevor die Portvalidierung abgeschlossen ist...',
    'Ex. Une r?servation de ressource peut ?tre effectu?e avant la fin de la validation du port lors de l?activation...',
    'Ej. La reserva de recursos puede realizarse antes de completar la validaci?n del puerto durante la activaci?n...',
  ),

  e(
    'TOP-K',
    'TOP-K',
    'TOP-K',
    'TOP-K',
    'TOP-K',
  ),

  e(
    'Defect?i Analiz Et',
    'Analyze Defect',
    'Defekt analysieren',
    'Analyser le d?faut',
    'Analizar defecto',
  ),

  e(
    'Defect Analiz Et',
    'Analyze Defect',
    'Defekt analysieren',
    'Analyser le d?faut',
    'Analizar defecto',
  ),

  e(
    'Hen?z defect analizi yapilmadi',
    'No defect analysis yet',
    'Noch keine Defektanalyse',
    'Aucune analyse de d?faut pour le moment',
    'Todav?a no se ha realizado un an?lisis de defectos',
  ),

  e(
    'Bir defect a?iklamasi girerek se?ili analizdeki degisiklikleri ?nceliklendirebilirsin.',
    'Enter a defect description to prioritize changes in the selected analysis.',
    'Geben Sie eine Defektbeschreibung ein, um ?nderungen in der ausgew?hlten Analyse zu priorisieren.',
    'Saisissez une description du d?faut pour prioriser les modifications de l?analyse s?lectionn?e.',
    'Introduce una descripci?n del defecto para priorizar los cambios del an?lisis seleccionado.',
  ),

  e(
    'Incelenmesi Gereken Aday Degisiklikler',
    'Candidate Changes Requiring Review',
    'Zu pr?fende Kandidaten?nderungen',
    'Modifications candidates ? examiner',
    'Cambios candidatos que requieren revisi?n',
  ),

  e(
    '?NCEKI GEREKSINIM',
    'PREVIOUS REQUIREMENT',
    'VORHERIGE ANFORDERUNG',
    'EXIGENCE PR?C?DENTE',
    'REQUISITO ANTERIOR',
  ),

  e(
    'YENI GEREKSINIM',
    'NEW REQUIREMENT',
    'NEUE ANFORDERUNG',
    'NOUVELLE EXIGENCE',
    'NUEVO REQUISITO',
  ),

  e(
    'RELEVANCE',
    'RELEVANCE',
    'RELEVANZ',
    'PERTINENCE',
    'RELEVANCIA',
  ),

  e(
    'Relevance',
    'Relevance',
    'Relevanz',
    'Pertinence',
    'Relevancia',
  ),

  e(
    'Semantic',
    'Semantic',
    'Semantik',
    'S?mantique',
    'Sem?ntica',
  ),

  e(
    'Keyword',
    'Keyword',
    'Schl?sselwort',
    'Mot-cl?',
    'Palabra clave',
  ),

  e(
    'Gerek?e',
    'Reason',
    'Begr?ndung',
    'Justification',
    'Motivo',
  ),

  e(
    'Bu sonu? kesin k?k neden degildir; incelenmesi gereken aday degisikliklerden biridir.',
    'This result is not a definitive root cause; it is one of the candidate changes that should be reviewed.',
    'Dieses Ergebnis ist keine endg?ltige Grundursache, sondern eine der zu pr?fenden Kandidaten?nderungen.',
    'Ce r?sultat n?est pas une cause racine d?finitive ; il s?agit d?une modification candidate ? examiner.',
    'Este resultado no es una causa ra?z definitiva; es uno de los cambios candidatos que deben revisarse.',
  ),

  e(
    'Defect analizi ger?eklestirilemedi.',
    'Defect analysis could not be completed.',
    'Die Defektanalyse konnte nicht abgeschlossen werden.',
    'L?analyse du d?faut n?a pas pu ?tre effectu?e.',
    'No se pudo completar el an?lisis del defecto.',
  ),
]


/* =========================================================
   PROCESS TRACKING
   ========================================================= */

const PROCESS:
TranslationEntry[] = [
  e(
    'OPERASYONEL TAKIP',
    'OPERATIONAL TRACKING',
    'OPERATIVE VERFOLGUNG',
    'SUIVI OP?RATIONNEL',
    'SEGUIMIENTO OPERATIVO',
  ),

  e(
    'S?re? Takibi',
    'Process Tracking',
    'Prozessverfolgung',
    'Suivi des processus',
    'Seguimiento de procesos',
  ),

  e(
    'Gelistirme ve test s?re?lerini tek ekrandan takip et. S?re? sorumlulari kullanici tarafindan atanir.',
    'Track development and testing processes from a single screen. Process owners are assigned by users.',
    'Verfolgen Sie Entwicklungs- und Testprozesse auf einem Bildschirm. Prozessverantwortliche werden von Benutzern zugewiesen.',
    'Suivez les processus de d?veloppement et de test depuis un seul ?cran. Les responsables sont attribu?s par les utilisateurs.',
    'Sigue los procesos de desarrollo y pruebas desde una sola pantalla. Los responsables son asignados por los usuarios.',
  ),

  e(
    'Excel Y?kle',
    'Upload Excel',
    'Excel hochladen',
    'T?l?verser Excel',
    'Cargar Excel',
  ),

  e(
    'Aktif',
    'Active',
    'Aktiv',
    'Actif',
    'Activo',
  ),

  e(
    'Testte',
    'In Test',
    'Im Test',
    'En test',
    'En pruebas',
  ),

  e(
    'Geciken',
    'Overdue',
    '?berf?llig',
    'En retard',
    'Atrasado',
  ),

  e(
    'Geciken',
    'Overdue',
    '?berf?llig',
    'En retard',
    'Atrasado',
  ),

  e(
    'Blokeli',
    'Blocked',
    'Blockiert',
    'Bloqu?',
    'Bloqueado',
  ),

  e(
    'Inceleme',
    'Review',
    'Pr?fung',
    'R?vision',
    'Revisi?n',
  ),

  e(
    'S?re?, sorumlu, analist veya mod?l ara...',
    'Search process, owner, analyst or module...',
    'Prozess, Verantwortlichen, Analysten oder Modul suchen...',
    'Rechercher un processus, un responsable, un analyste ou un module...',
    'Buscar proceso, responsable, analista o m?dulo...',
  ),

  e(
    'T?m Asamalar',
    'All Stages',
    'Alle Phasen',
    'Toutes les ?tapes',
    'Todas las etapas',
  ),

  e(
    'T?m Kayitlar',
    'All Records',
    'Alle Eintr?ge',
    'Tous les enregistrements',
    'Todos los registros',
  ),

  e(
    'S?RE?LER',
    'PROCESSES',
    'PROZESSE',
    'PROCESSUS',
    'PROCESOS',
  ),

  e(
    'G?ncel Is Listesi',
    'Current Work List',
    'Aktuelle Arbeitsliste',
    'Liste de travail actuelle',
    'Lista de trabajo actual',
  ),

  e(
    'S?RE? / IS',
    'PROCESS / WORK',
    'PROZESS / AUFGABE',
    'PROCESSUS / T?CHE',
    'PROCESO / TRABAJO',
  ),

  e(
    'SORUMLU',
    'OWNER',
    'VERANTWORTLICH',
    'RESPONSABLE',
    'RESPONSABLE',
  ),

  e(
    'Sorumlu',
    'Owner',
    'Verantwortlich',
    'Responsable',
    'Responsable',
  ),

  e(
    'ANALIST',
    'ANALYST',
    'ANALYST',
    'ANALYSTE',
    'ANALISTA',
  ),

  e(
    'Analist',
    'Analyst',
    'Analyst',
    'Analyste',
    'Analista',
  ),

  e(
    'ASAMA',
    'STAGE',
    'PHASE',
    '?TAPE',
    'ETAPA',
  ),

  e(
    'Asama',
    'Stage',
    'Phase',
    '?tape',
    'Etapa',
  ),

  e(
    'TARIH',
    'DATE',
    'DATUM',
    'DATE',
    'FECHA',
  ),

  e(
    'Tarih',
    'Date',
    'Datum',
    'Date',
    'Fecha',
  ),

  e(
    'Atanmamis',
    'Unassigned',
    'Nicht zugewiesen',
    'Non attribu?',
    'Sin asignar',
  ),

  e(
    'Atanmadi',
    'Unassigned',
    'Nicht zugewiesen',
    'Non attribu?',
    'Sin asignar',
  ),

  e(
    'Tamamlandi',
    'Completed',
    'Abgeschlossen',
    'Termin?',
    'Completado',
  ),

  e(
    'Teslim Hazir',
    'Ready for Delivery',
    'Lieferbereit',
    'Pr?t pour livraison',
    'Listo para entrega',
  ),

  e(
    'Teslim Edildi',
    'Delivered',
    'Geliefert',
    'Livr?',
    'Entregado',
  ),

  e(
    'Tasarim',
    'Design',
    'Design',
    'Conception',
    'Dise?o',
  ),

  e(
    'Gelistirme',
    'Development',
    'Entwicklung',
    'D?veloppement',
    'Desarrollo',
  ),

  e(
    'Test',
    'Test',
    'Test',
    'Test',
    'Prueba',
  ),

  e(
    'Bagli degil',
    'Not linked',
    'Nicht verkn?pft',
    'Non li?',
    'No vinculado',
  ),

  e(
    'S?RE? DETAYI',
    'PROCESS DETAILS',
    'PROZESSDETAILS',
    'D?TAILS DU PROCESSUS',
    'DETALLES DEL PROCESO',
  ),

  e(
    'SORUMLULAR',
    'ASSIGNEES',
    'ZUST?NDIGE',
    'RESPONSABLES',
    'RESPONSABLES',
  ),

  e(
    'Yazilimci',
    'Developer',
    'Entwickler',
    'D?veloppeur',
    'Desarrollador',
  ),

  e(
    'Bitis',
    'Due',
    'F?llig',
    '?ch?ance',
    'Vencimiento',
  ),

  e(
    'Mod?l',
    'Module',
    'Modul',
    'Module',
    'M?dulo',
  ),

  e(
    'DURUM VERILERI',
    'STATUS DATA',
    'STATUSDATEN',
    'DONN?ES DE STATUT',
    'DATOS DE ESTADO',
  ),

  e(
    'Teste Verildi',
    'Sent to Test',
    'Zum Test ?bergeben',
    'Envoy? en test',
    'Enviado a pruebas',
  ),

  e(
    'Otomatik Hesapla',
    'Calculate Automatically',
    'Automatisch berechnen',
    'Calculer automatiquement',
    'Calcular autom?ticamente',
  ),

  e(
    'Varsayilan olarak asama, Excel durum bilgilerinden otomatik hesaplanir.',
    'By default, the stage is automatically calculated from the Excel status information.',
    'Standardm??ig wird die Phase automatisch aus den Excel-Statusinformationen berechnet.',
    'Par d?faut, l??tape est calcul?e automatiquement ? partir des informations de statut Excel.',
    'De forma predeterminada, la etapa se calcula autom?ticamente a partir de la informaci?n de estado de Excel.',
  ),

  e(
    'Analiz Baglantisi',
    'Analysis Link',
    'Analyseverkn?pfung',
    'Lien d?analyse',
    'V?nculo de an?lisis',
  ),

  e(
    'Analiz bagli degil',
    'No analysis linked',
    'Keine Analyse verkn?pft',
    'Aucune analyse li?e',
    'No hay an?lisis vinculado',
  ),

  e(
    'NOT',
    'NOTE',
    'NOTIZ',
    'NOTE',
    'NOTA',
  ),

  e(
    'Evet',
    'Yes',
    'Ja',
    'Oui',
    'S?',
  ),

  e(
    'Hayir',
    'No',
    'Nein',
    'Non',
    'No',
  ),

  e(
    'Devam',
    'In Progress',
    'In Bearbeitung',
    'En cours',
    'En progreso',
  ),

  e(
    'Devam ediyorum',
    'In Progress',
    'In Bearbeitung',
    'En cours',
    'En progreso',
  ),
]


/* =========================================================
   REPORTS
   ========================================================= */

const REPORTS:
TranslationEntry[] = [
  e(
    'RAPOR MERKEZI',
    'REPORT CENTER',
    'BERICHTSZENTRUM',
    'CENTRE DE RAPPORTS',
    'CENTRO DE INFORMES',
  ),

  e(
    'Analiz Raporlari',
    'Analysis Reports',
    'Analyseberichte',
    'Rapports d?analyse',
    'Informes de an?lisis',
  ),

  e(
    'Analiz sonu?larini, risk profilini ve ge?mis rapor kayitlarini tek ekrandan y?net.',
    'Manage analysis results, risk profiles and historical report records from a single screen.',
    'Verwalten Sie Analyseergebnisse, Risikoprofile und fr?here Berichte auf einem Bildschirm.',
    'G?rez les r?sultats d?analyse, les profils de risque et l?historique des rapports depuis un seul ?cran.',
    'Gestiona los resultados del an?lisis, los perfiles de riesgo y el historial de informes desde una sola pantalla.',
  ),

  e(
    'Olusturulan analizleri g?r?nt?le, Excel raporlarini indir veya artik gerekli olmayan analizleri kaldir.',
    'View generated analyses, download Excel reports or remove analyses that are no longer needed.',
    'Erstellte Analysen anzeigen, Excel-Berichte herunterladen oder nicht mehr ben?tigte Analysen entfernen.',
    'Consultez les analyses cr??es, t?l?chargez les rapports Excel ou supprimez les analyses devenues inutiles.',
    'Consulta los an?lisis creados, descarga informes Excel o elimina los an?lisis que ya no sean necesarios.',
  ),

  e(
    'RAPOR FORMATI',
    'REPORT FORMAT',
    'BERICHTSFORMAT',
    'FORMAT DU RAPPORT',
    'FORMATO DEL INFORME',
  ),

  e(
    'Rapor Formati',
    'Report Format',
    'Berichtsformat',
    'Format du rapport',
    'Formato del informe',
  ),

  e(
    'Toplam Analiz',
    'Total Analyses',
    'Analysen gesamt',
    'Total des analyses',
    'An?lisis totales',
  ),

  e(
    'kayitli karsilastirma',
    'saved comparisons',
    'gespeicherte Vergleiche',
    'comparaisons enregistr?es',
    'comparaciones guardadas',
  ),

  e(
    'tespit edilen degisiklik',
    'detected changes',
    'erkannte ?nderungen',
    'modifications d?tect?es',
    'cambios detectados',
  ),

  e(
    'Defect Aday Kaydi',
    'Defect Candidate Records',
    'Defektkandidaten',
    'Candidats de d?faut',
    'Registros de candidatos a defecto',
  ),

  e(
    'Toplam Defect Adayi Kaydi',
    'Total Defect Candidate Records',
    'Defektkandidaten gesamt',
    'Total des candidats de d?faut',
    'Total de candidatos a defecto',
  ),

  e(
    '?nceliklendirilmis aday',
    'prioritized candidates',
    'priorisierte Kandidaten',
    'candidats prioris?s',
    'candidatos priorizados',
  ),

  e(
    'Son Analiz ?ncelikli Risk',
    'Latest Analysis Priority Risk',
    'Priorit?tsrisiko der letzten Analyse',
    'Risque prioritaire de la derni?re analyse',
    'Riesgo prioritario del ?ltimo an?lisis',
  ),

  e(
    'y?ksek + kritik',
    'high + critical',
    'hoch + kritisch',
    '?lev? + critique',
    'alto + cr?tico',
  ),

  e(
    'SON ANALIZ',
    'LATEST ANALYSIS',
    'LETZTE ANALYSE',
    'DERNI?RE ANALYSE',
    '?LTIMO AN?LISIS',
  ),

  e(
    'Karsilastirmayi Incele',
    'Review Comparison',
    'Vergleich pr?fen',
    'Examiner la comparaison',
    'Revisar comparaci?n',
  ),

  e(
    'Excel Raporu',
    'Excel Report',
    'Excel-Bericht',
    'Rapport Excel',
    'Informe Excel',
  ),

  e(
    'Excel Raporunu Indir',
    'Download Excel Report',
    'Excel-Bericht herunterladen',
    'T?l?charger le rapport Excel',
    'Descargar informe Excel',
  ),

  e(
    'Excel Export',
    'Excel Export',
    'Excel-Export',
    'Export Excel',
    'Exportaci?n Excel',
  ),

  e(
    'DEGISIKLIK',
    'CHANGES',
    '?NDERUNGEN',
    'MODIFICATIONS',
    'CAMBIOS',
  ),

  e(
    'Y?KSEK RISK',
    'HIGH RISK',
    'HOHES RISIKO',
    'RISQUE ?LEV?',
    'RIESGO ALTO',
  ),

  e(
    'KRITIK RISK',
    'CRITICAL RISK',
    'KRITISCHES RISIKO',
    'RISQUE CRITIQUE',
    'RIESGO CR?TICO',
  ),

  e(
    'DEFECT ADAYI',
    'DEFECT CANDIDATES',
    'DEFEKTKANDIDATEN',
    'CANDIDATS DE D?FAUT',
    'CANDIDATOS A DEFECTO',
  ),

  e(
    'Ortalama Risk Skoru',
    'Average Risk Score',
    'Durchschnittlicher Risikowert',
    'Score de risque moyen',
    'Puntuaci?n media de riesgo',
  ),

  e(
    'Ortalama Confidence',
    'Average Confidence',
    'Durchschnittliche Konfidenz',
    'Confiance moyenne',
    'Confianza media',
  ),

  e(
    'RISK PROFILI',
    'RISK PROFILE',
    'RISIKOPROFIL',
    'PROFIL DE RISQUE',
    'PERFIL DE RIESGO',
  ),

  e(
    'Risk Profili',
    'Risk Profile',
    'Risikoprofil',
    'Profil de risque',
    'Perfil de riesgo',
  ),

  e(
    'Risk seviyelerinin dagilimi',
    'Distribution of risk levels',
    'Verteilung der Risikostufen',
    'R?partition des niveaux de risque',
    'Distribuci?n de niveles de riesgo',
  ),

  e(
    'DEGISIM PROFILI',
    'CHANGE PROFILE',
    '?NDERUNGSPROFIL',
    'PROFIL DES MODIFICATIONS',
    'PERFIL DE CAMBIOS',
  ),

  e(
    '?ne ?ikan Degisimler',
    'Highlighted Changes',
    'Wesentliche ?nderungen',
    'Modifications principales',
    'Cambios destacados',
  ),

  e(
    'Son analizde tespit edilen degisim t?rleri',
    'Change types detected in the latest analysis',
    'In der letzten Analyse erkannte ?nderungstypen',
    'Types de modifications d?tect?s dans la derni?re analyse',
    'Tipos de cambio detectados en el ?ltimo an?lisis',
  ),

  e(
    'Raporlar y?kleniyor',
    'Loading reports',
    'Berichte werden geladen',
    'Chargement des rapports',
    'Cargando informes',
  ),

  e(
    'Analiz kayitlari getiriliyor.',
    'Loading analysis records.',
    'Analysedatens?tze werden geladen.',
    'Chargement des enregistrements d?analyse.',
    'Cargando registros de an?lisis.',
  ),

  e(
    'Hen?z rapor bulunmuyor',
    'No reports yet',
    'Noch keine Berichte',
    'Aucun rapport pour le moment',
    'Todav?a no hay informes',
  ),

  e(
    'Y?kleme ekranindan yeni bir karsilastirma olusturdugunda rapor burada g?r?necek.',
    'When you create a new comparison from the Upload page, the report will appear here.',
    'Wenn Sie auf der Upload-Seite einen neuen Vergleich erstellen, erscheint der Bericht hier.',
    'Lorsque vous cr?ez une nouvelle comparaison depuis la page de t?l?versement, le rapport appara?t ici.',
    'Cuando crees una nueva comparaci?n desde la p?gina de carga, el informe aparecer? aqu?.',
  ),

  e(
    'Eslesen rapor bulunamadi',
    'No matching reports found',
    'Keine passenden Berichte gefunden',
    'Aucun rapport correspondant',
    'No se encontraron informes coincidentes',
  ),

  e(
    'Analizi Sil',
    'Delete Analysis',
    'Analyse l?schen',
    'Supprimer l?analyse',
    'Eliminar an?lisis',
  ),

  e(
    'Vazge?',
    'Cancel',
    'Abbrechen',
    'Annuler',
    'Cancelar',
  ),

  e(
    'Siliniyor...',
    'Deleting...',
    'Wird gel?scht...',
    'Suppression...',
    'Eliminando...',
  ),

  e(
    'Analiz raporlari y?klenemedi.',
    'Analysis reports could not be loaded.',
    'Analyseberichte konnten nicht geladen werden.',
    'Les rapports d?analyse n?ont pas pu ?tre charg?s.',
    'No se pudieron cargar los informes de an?lisis.',
  ),

  e(
    'Excel raporu indirilemedi.',
    'The Excel report could not be downloaded.',
    'Der Excel-Bericht konnte nicht heruntergeladen werden.',
    'Le rapport Excel n?a pas pu ?tre t?l?charg?.',
    'No se pudo descargar el informe Excel.',
  ),

  e(
    'Analiz silinemedi.',
    'The analysis could not be deleted.',
    'Die Analyse konnte nicht gel?scht werden.',
    'L?analyse n?a pas pu ?tre supprim?e.',
    'No se pudo eliminar el an?lisis.',
  ),

  e(
    'Analiz adi, versiyon veya ID ara...',
    'Search analysis name, version or ID...',
    'Analysename, Version oder ID suchen...',
    'Rechercher un nom d?analyse, une version ou un ID...',
    'Buscar nombre de an?lisis, versi?n o ID...',
  ),
]


/* =========================================================
   DASHBOARD FALLBACK
   ========================================================= */

const DASHBOARD:
TranslationEntry[] = [
  e(
    'KARSILASTIRMA',
    'COMPARISON',
    'VERGLEICH',
    'COMPARAISON',
    'COMPARACI?N',
  ),

  e(
    'Degisim Dagilimi',
    'Change Distribution',
    '?nderungsverteilung',
    'R?partition des modifications',
    'Distribuci?n de cambios',
  ),

  e(
    'Tespit edilen degisiklik t?rlerinin dagilimi',
    'Distribution of detected change types',
    'Verteilung der erkannten ?nderungstypen',
    'R?partition des types de modifications d?tect?s',
    'Distribuci?n de los tipos de cambio detectados',
  ),

  e(
    'Risk Seviyesi Dagilimi',
    'Risk Level Distribution',
    'Risikostufenverteilung',
    'R?partition des niveaux de risque',
    'Distribuci?n del nivel de riesgo',
  ),

  e(
    'Degisikliklerin risk seviyelerine g?re dagilimi',
    'Distribution of changes by risk level',
    'Verteilung der ?nderungen nach Risikostufe',
    'R?partition des modifications selon le niveau de risque',
    'Distribuci?n de los cambios seg?n el nivel de riesgo',
  ),

  e(
    'Gereksinim Degisiklikleri',
    'Requirement Changes',
    'Anforderungs?nderungen',
    'Modifications des exigences',
    'Cambios de requisitos',
  ),
]


/* =========================================================
   COUNT UNITS
   ========================================================= */

const COUNT_UNITS:
TranslationEntry[] = [
  e(
    'kayit',
    'records',
    'Eintr?ge',
    'enregistrements',
    'registros',
  ),

  e(
    'aday',
    'candidates',
    'Kandidaten',
    'candidats',
    'candidatos',
  ),

  e(
    'rapor',
    'reports',
    'Berichte',
    'rapports',
    'informes',
  ),

  e(
    'sonu?',
    'results',
    'Ergebnisse',
    'r?sultats',
    'resultados',
  ),

  e(
    'degisiklik',
    'changes',
    '?nderungen',
    'modifications',
    'cambios',
  ),

  e(
    'analiz',
    'analyses',
    'Analysen',
    'analyses',
    'an?lisis',
  ),
]


/* =========================================================
   DATE MONTHS
   ========================================================= */

const FULL_MONTHS:
TranslationEntry[] = [
  e(
    'Ocak',
    'January',
    'Januar',
    'janvier',
    'enero',
  ),

  e(
    'Subat',
    'February',
    'Februar',
    'f?vrier',
    'febrero',
  ),

  e(
    'Mart',
    'March',
    'M?rz',
    'mars',
    'marzo',
  ),

  e(
    'Nisan',
    'April',
    'April',
    'avril',
    'abril',
  ),

  e(
    'Mayis',
    'May',
    'Mai',
    'mai',
    'mayo',
  ),

  e(
    'Haziran',
    'June',
    'Juni',
    'juin',
    'junio',
  ),

  e(
    'Temmuz',
    'July',
    'Juli',
    'juillet',
    'julio',
  ),

  e(
    'Agustos',
    'August',
    'August',
    'ao?t',
    'agosto',
  ),

  e(
    'Eyl?l',
    'September',
    'September',
    'septembre',
    'septiembre',
  ),

  e(
    'Ekim',
    'October',
    'Oktober',
    'octobre',
    'octubre',
  ),

  e(
    'Kasim',
    'November',
    'November',
    'novembre',
    'noviembre',
  ),

  e(
    'Aralik',
    'December',
    'Dezember',
    'd?cembre',
    'diciembre',
  ),
]


const SHORT_MONTHS:
TranslationEntry[] = [
  e('Oca', 'Jan', 'Jan', 'janv', 'ene'),
  e('Sub', 'Feb', 'Feb', 'f?vr', 'feb'),
  e('Mar', 'Mar', 'M?r', 'mars', 'mar'),
  e('Nis', 'Apr', 'Apr', 'avr', 'abr'),
  e('May', 'May', 'Mai', 'mai', 'may'),
  e('Haz', 'Jun', 'Jun', 'juin', 'jun'),
  e('Tem', 'Jul', 'Jul', 'juil', 'jul'),
  e('Agu', 'Aug', 'Aug', 'ao?t', 'ago'),
  e('Eyl', 'Sep', 'Sep', 'sept', 'sep'),
  e('Eki', 'Oct', 'Okt', 'oct', 'oct'),
  e('Kas', 'Nov', 'Nov', 'nov', 'nov'),
  e('Ara', 'Dec', 'Dez', 'd?c', 'dic'),
]


/* =========================================================
   HELPERS
   ========================================================= */

function normalize(
  value: string,
): string {
  return value
    .replaceAll(
      '?',
      "'",
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim()
}


function buildLookup(
  entries:
    TranslationEntry[],
): Map<
  string,
  TranslationEntry
> {
  const map =
    new Map<
      string,
      TranslationEntry
    >()


  for (
    const entry
    of entries
  ) {
    for (
      const value
      of Object.values(
        entry,
      )
    ) {
      map.set(
        normalize(
          value,
        ),
        entry,
      )
    }
  }


  return map
}


function getEntriesForPath(
  path: string,
): TranslationEntry[] {
  if (
    path
    === '/defects'
  ) {
    return [
      ...COMMON,
      ...DEFECT,
    ]
  }


  if (
    path
    === '/process-tracking'
  ) {
    return [
      ...COMMON,
      ...PROCESS,
    ]
  }


  if (
    path
    === '/reports'
  ) {
    return [
      ...COMMON,
      ...REPORTS,
    ]
  }


  if (
    path
    === '/dashboard'
  ) {
    return [
      ...COMMON,
      ...DASHBOARD,
    ]
  }


  return []
}


function buildCountLookup():
Map<
  string,
  TranslationEntry
> {
  return buildLookup(
    COUNT_UNITS,
  )
}


const COUNT_LOOKUP =
  buildCountLookup()


function translateCount(
  value: string,
  language:
    SupportedLanguage,
): string | null {
  const match =
    value.match(
      /^(\d+)\s+(.+)$/,
    )


  if (!match) {
    return null
  }


  const count =
    match[1]


  const unit =
    normalize(
      match[2],
    )


  const entry =
    COUNT_LOOKUP.get(
      unit,
    )


  if (!entry) {
    return null
  }


  return `${count} ${entry[language]}`
}


function findMonthEntry(
  token: string,
  entries:
    TranslationEntry[],
): TranslationEntry | null {
  const normalizedToken =
    token
      .replace(
        /[.,]/g,
        '',
      )
      .toLocaleLowerCase()


  for (
    const entry
    of entries
  ) {
    for (
      const value
      of Object.values(
        entry,
      )
    ) {
      const normalizedValue =
        value
          .replace(
            /[.,]/g,
            '',
          )
          .toLocaleLowerCase()


      if (
        normalizedValue
        === normalizedToken
      ) {
        return entry
      }
    }
  }


  return null
}


function translateDateLike(
  value: string,
  language:
    SupportedLanguage,
): string | null {
  /*
   * 11 Agustos 2026 13:16
   * 30 Agu 2026
   *
   * Veri tarihi degistirilmez.
   * Sadece ay adi yerellestirilir.
   */
  const match =
    value.match(
      /^(\d{1,2})\s+([^\s]+)\s+(\d{4})(.*)$/,
    )


  if (!match) {
    return null
  }


  const day =
    match[1]

  const monthToken =
    match[2]

  const year =
    match[3]

  const rest =
    match[4]


  const full =
    findMonthEntry(
      monthToken,
      FULL_MONTHS,
    )


  if (full) {
    return (
      `${day} `
      + `${full[language]} `
      + `${year}${rest}`
    )
  }


  const short =
    findMonthEntry(
      monthToken,
      SHORT_MONTHS,
    )


  if (short) {
    return (
      `${day} `
      + `${short[language]} `
      + `${year}${rest}`
    )
  }


  return null
}


function translatePrefixedNumber(
  value: string,
  language:
    SupportedLanguage,
): string | null {
  const analysisMatch =
    value.match(
      /^(Analiz|Analysis|Analyse|An?lisis)\s+#(\d+)$/i,
    )


  if (
    analysisMatch
  ) {
    const prefixes:
    Record<
      SupportedLanguage,
      string
    > = {
      tr:
        'Analiz',

      en:
        'Analysis',

      de:
        'Analyse',

      fr:
        'Analyse',

      es:
        'An?lisis',
    }


    return (
      `${prefixes[language]} `
      + `#${analysisMatch[2]}`
    )
  }


  const rowMatch =
    value.match(
      /^(Satir|Row|Zeile|Ligne|Fila)\s+(\d+)$/i,
    )


  if (
    rowMatch
  ) {
    const prefixes:
    Record<
      SupportedLanguage,
      string
    > = {
      tr:
        'Satir',

      en:
        'Row',

      de:
        'Zeile',

      fr:
        'Ligne',

      es:
        'Fila',
    }


    return (
      `${prefixes[language]} `
      + `${rowMatch[2]}`
    )
  }


  return null
}


function translateCore(
  value: string,
  language:
    SupportedLanguage,
  lookup:
    Map<
      string,
      TranslationEntry
    >,
): string {
  const normalized =
    normalize(
      value,
    )


  if (!normalized) {
    return value
  }


  const direct =
    lookup.get(
      normalized,
    )


  if (direct) {
    return (
      direct[
        language
      ]
    )
  }


  const count =
    translateCount(
      normalized,
      language,
    )


  if (count) {
    return count
  }


  const prefixed =
    translatePrefixedNumber(
      normalized,
      language,
    )


  if (prefixed) {
    return prefixed
  }


  const date =
    translateDateLike(
      normalized,
      language,
    )


  if (date) {
    return date
  }


  return value
}


function translateTextNode(
  node: Text,
  language:
    SupportedLanguage,
  lookup:
    Map<
      string,
      TranslationEntry
    >,
) {
  const value =
    node.nodeValue


  if (!value) {
    return
  }


  const source =
    getTextSource(
      node,
      value,
    )

  const state =
    textTranslationStates.get(
      node,
    )

  if (
    state
    && state.dynamic
    && language !== 'tr'
    && state.rendered === value
  ) {
    return
  }


  const trimmed =
    source.trim()


  if (!trimmed) {
    return
  }


  const translated =
    translateCore(
      trimmed,
      language,
      lookup,
    )


  const leading =
    source.match(
      /^\s*/,
    )?.[0]
    ?? ''


  const trailing =
    source.match(
      /\s*$/,
    )?.[0]
    ?? ''


  const rendered =
    `${leading}${translated}${trailing}`


  if (
    rendered
    !== value
  ) {
    node.nodeValue =
      rendered
  }


  setTextRenderedValue(
    node,
    rendered,
  )
}


function isLikelyDynamicTurkishContent(
  value: string,
): boolean {
  const normalized =
    value.trim()

  if (normalized.length < 12) {
    return false
  }

  return (
    /[?gi?s?I]/i.test(normalized)
    || /\b(?:gereksinim|degisiklik|a?iklama|s?re?|sistem|m?steri|kullanici|kontrol|g?nder|olmalidir|edilmelidir|yapilabilir|yapilmalidir|incelenmesi|kaynak|siparis|aktivasyon)\b/i.test(normalized)
  )
}


async function translateDynamicContent(
  root: Element,
  language: SupportedLanguage,
): Promise<void> {
  if (language === 'tr') {
    return
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  )
  const sourceNodes = new Map<string, Text[]>()
  const sources: string[] = []
  let current = walker.nextNode()

  while (current) {
    const node = current as Text
    const parent = node.parentElement

    if (
      parent
      && !shouldIgnore(parent)
      && node.nodeValue
      && isLikelyDynamicTurkishContent(
        node.nodeValue,
      )
    ) {
      const source = getTextSource(
        node,
        node.nodeValue,
      )
      const state = textTranslationStates.get(node)

      if (
        state?.dynamic
        && state.dynamicLanguage === language
        && state.rendered === node.nodeValue
      ) {
        current = walker.nextNode()
        continue
      }

      if (!sourceNodes.has(source)) {
        sourceNodes.set(source, [])
        sources.push(source)
      }

      sourceNodes.get(source)?.push(node)
    }

    current = walker.nextNode()
  }

  if (!sources.length) {
    return
  }

  let translations: string[]

  try {
    translations = await translateContentBatch(
      sources,
      language,
    )
  } catch {
    return
  }

  for (
    let index = 0;
    index < sources.length;
    index += 1
  ) {
    const source = sources[index]
    const translated = translations[index]

    if (!source || !translated) {
      continue
    }

    const leading = source.match(/^\s*/)?.[0] ?? ''
    const trailing = source.match(/\s*$/)?.[0] ?? ''
    const rendered = `${leading}${translated}${trailing}`

    for (const node of sourceNodes.get(source) ?? []) {
      const state = textTranslationStates.get(node)

      if (
        !state
        || state.source !== source
        || !node.isConnected
      ) {
        continue
      }

      node.nodeValue = rendered
      state.rendered = rendered
      state.dynamic = true
      state.dynamicLanguage = language
    }
  }
}


const ATTRIBUTES = [
  'placeholder',
  'aria-label',
  'title',
] as const


interface TextTranslationState {
  source: string
  rendered: string
  dynamic?: boolean
  dynamicLanguage?: SupportedLanguage
}


interface AttributeTranslationState {
  source: string
  rendered: string
}


/*
 * Bridge ile ?evrilen metinler React tarafindan yeniden render edilmedigi
 * i?in, bir sonraki dil degisiminde artik kaynak dilde g?r?nmeyebilir.
 * Orijinal degeri node ?zerinde saklayarak her ge?iste ayni kaynaktan
 * ?eviri yapiyoruz.
 */
const textTranslationStates =
  new WeakMap<
    Text,
    TextTranslationState
  >()


const attributeTranslationStates =
  new WeakMap<
    Element,
    Map<
      string,
      AttributeTranslationState
    >
  >()


function getTextSource(
  node: Text,
  value: string,
): string {
  const state =
    textTranslationStates.get(
      node,
    )


  /* Kendi son ?evirimiz h?l? node'daysa kaynak degeri koru. */
  if (
    state
    && state.rendered === value
  ) {
    return state.source
  }


  /* React node'u yeni bir degerle g?ncellediyse yeni kaynak degeri kaydet. */
  textTranslationStates.set(
    node,
    {
      source: value,
      rendered: value,
    },
  )


  return value
}


function setTextRenderedValue(
  node: Text,
  rendered: string,
) {
  const state =
    textTranslationStates.get(
      node,
    )


  if (!state) {
    textTranslationStates.set(
      node,
      {
        source: rendered,
        rendered,
      },
    )

    return
  }


  state.rendered = rendered
  state.dynamic = false
  state.dynamicLanguage = undefined
}


function getAttributeSource(
  element: Element,
  attribute: string,
  value: string,
): string {
  let states =
    attributeTranslationStates.get(
      element,
    )


  if (!states) {
    states = new Map()

    attributeTranslationStates.set(
      element,
      states,
    )
  }


  const state = states.get(
    attribute,
  )


  if (
    state
    && state.rendered === value
  ) {
    return state.source
  }


  states.set(
    attribute,
    {
      source: value,
      rendered: value,
    },
  )


  return value
}


function setAttributeRenderedValue(
  element: Element,
  attribute: string,
  rendered: string,
) {
  const states =
    attributeTranslationStates.get(
      element,
    )


  if (!states) {
    return
  }


  const state = states.get(
    attribute,
  )


  if (state) {
    state.rendered = rendered
  }
}


function translateAttributes(
  element: Element,
  language:
    SupportedLanguage,
  lookup:
    Map<
      string,
      TranslationEntry
    >,
) {
  for (
    const attribute
    of ATTRIBUTES
  ) {
    const current =
      element.getAttribute(
        attribute,
      )


    if (!current) {
      continue
    }


    const source =
      getAttributeSource(
        element,
        attribute,
        current,
      )


    const translated =
      translateCore(
        source,
        language,
        lookup,
      )


    if (
      translated
      !== current
    ) {
      element.setAttribute(
        attribute,
        translated,
      )

      setAttributeRenderedValue(
        element,
        attribute,
        translated,
      )

    } else {
      setAttributeRenderedValue(
        element,
        attribute,
        current,
      )
    }
  }
}


function shouldIgnore(
  element: Element,
): boolean {
  if (
    element.matches(
      'script, style, svg',
    )
  ) {
    return true
  }


  if (
    element.closest(
      '[data-i18n-ignore="true"]',
    )
  ) {
    return true
  }


  return false
}


function translateSubtree(
  root: Node,
  language:
    SupportedLanguage,
  lookup:
    Map<
      string,
      TranslationEntry
    >,
) {
  if (
    root
    instanceof Text
  ) {
    translateTextNode(
      root,
      language,
      lookup,
    )

    return
  }


  if (
    !(root
      instanceof Element)
  ) {
    return
  }


  if (
    shouldIgnore(
      root,
    )
  ) {
    return
  }


  translateAttributes(
    root,
    language,
    lookup,
  )


  const walker =
    document
      .createTreeWalker(
        root,
        NodeFilter
          .SHOW_TEXT,
      )


  let current =
  walker.nextNode()


while (current) {
  const textNode =
    current as Text


  const parent =
    textNode.parentElement


  if (
    parent
    && !shouldIgnore(
      parent,
    )
  ) {
    translateTextNode(
      textNode,
      language,
      lookup,
    )
  }


  current =
    walker.nextNode()
}


  const elements =
    root.querySelectorAll(
      '*',
    )


  for (
    const element
    of elements
  ) {
    if (
      shouldIgnore(
        element,
      )
    ) {
      continue
    }


    translateAttributes(
      element,
      language,
      lookup,
    )
  }
}


/* =========================================================
   COMPONENT
   ========================================================= */

function PageLanguageBridge() {
  const location =
    useLocation()


  const {
    language,
  } = useLanguage()


  useEffect(
    () => {
      const root =
        document
          .querySelector(
            '.page-content',
          )


      if (!root) {
        return
      }


      const entries =
        getEntriesForPath(
          location.pathname,
        )


      const lookup =
        buildLookup(
          entries,
        )


      translateSubtree(
        root,
        language,
        lookup,
      )

      let dynamicTranslationQueued = false

      const scheduleDynamicTranslation = () => {
        if (dynamicTranslationQueued) {
          return
        }

        dynamicTranslationQueued = true

        window.setTimeout(() => {
          dynamicTranslationQueued = false
          void translateDynamicContent(
            root,
            language,
          )
        }, 0)
      }

      scheduleDynamicTranslation()


      const observer =
        new MutationObserver(
          (
            mutations,
          ) => {
            for (
              const mutation
              of mutations
            ) {

              if (
                mutation.type
                === 'characterData'
              ) {
                if (
                  mutation.target
                  instanceof Text
                ) {
                  translateTextNode(
                    mutation.target,
                    language,
                    lookup,
                  )
                }

                continue
              }


              if (
                mutation.type
                === 'attributes'
              ) {
                if (
                  mutation.target
                  instanceof Element
                ) {
                  translateAttributes(
                    mutation.target,
                    language,
                    lookup,
                  )
                }

                continue
              }


              for (
                const addedNode
                of mutation.addedNodes
              ) {
                translateSubtree(
                  addedNode,
                  language,
                  lookup,
                )
              }
            }

            scheduleDynamicTranslation()
          },
        )


      observer.observe(
        root,
        {
          subtree:
            true,

          childList:
            true,

          characterData:
            true,

          attributes:
            true,

          attributeFilter:
            [
              'placeholder',
              'aria-label',
              'title',
            ],
        },
      )


      return () => {
        observer.disconnect()
      }
    },
    [
      language,
      location.pathname,
    ],
  )


  return null
}


export default PageLanguageBridge
