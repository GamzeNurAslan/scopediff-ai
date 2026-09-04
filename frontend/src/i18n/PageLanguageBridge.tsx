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
    'ANALİZ',
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
    'OLUŞTURULMA',
    'CREATED',
    'ERSTELLT',
    'CR?? LE',
    'CREADO',
  ),

  e(
    'ANALİZİ OLUŞTURAN',
    'CREATED BY',
    'ERSTELLT VON',
    'CR?? PAR',
    'CREADO POR',
  ),

  e(
    'Düşük',
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
    'Yüksek',
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
    'Düşük Risk',
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
    'Yüksek Risk',
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
    'Toplam Değişiklik',
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



const DEFECT:
TranslationEntry[] = [
  e(
    'DEFECT ANALİZİ',
    'DEFECT ANALYSIS',
    'DEFEKTANALYSE',
    'ANALYSE DES D?FAUTS',
    'AN?LISIS DE DEFECTOS',
  ),

  e(
    'Defect ile İlişkili Değişiklikleri Önceliklendir',
    'Prioritize Changes Related to the Defect',
    'Defektbezogene ?nderungen priorisieren',
    'Prioriser les modifications li?es au d?faut',
    'Priorizar cambios relacionados con el defecto',
  ),

  e(
    'Defect açıklamasını seçili gereksinim değişiklikleriyle anlamsal olarak karşılaştır. Sonuçlar kesin kök neden değildir; incelenmesi gereken aday değişikliklerdir.',
    'Semantically compare the defect description with the selected requirement changes. Results are not definitive root causes; they are candidate changes that require review.',
    'Vergleichen Sie die Defektbeschreibung semantisch mit den ausgew?hlten Anforderungs?nderungen. Die Ergebnisse sind keine endg?ltigen Grundursachen, sondern zu pr?fende Kandidaten?nderungen.',
    'Comparez s?mantiquement la description du d?faut avec les modifications d?exigences s?lectionn?es. Les r?sultats ne constituent pas des causes racines d?finitives, mais des modifications candidates ? examiner.',
    'Compare sem?nticamente la descripci?n del defecto con los cambios de requisitos seleccionados. Los resultados no son causas ra?z definitivas, sino cambios candidatos que deben revisarse.',
  ),

  e(
    'ANALİZ EDİLECEK DEĞİŞİKLİK',
    'CHANGES TO ANALYZE',
    'ZU ANALYSIERENDE ?NDERUNGEN',
    'MODIFICATIONS ? ANALYSER',
    'CAMBIOS A ANALIZAR',
  ),

  e(
    'Defect Açıklaması',
    'Defect Description',
    'Defektbeschreibung',
    'Description du d?faut',
    'Descripci?n del defecto',
  ),

  e(
    'Hata kaydındaki davranışı, belirtileri ve ilgili bağlamı mümkün olduğunca açık yaz.',
    'Describe the behavior, symptoms and relevant context from the defect record as clearly as possible.',
    'Beschreiben Sie Verhalten, Symptome und relevanten Kontext des Defekteintrags so klar wie m?glich.',
    'D?crivez aussi clairement que possible le comportement, les sympt?mes et le contexte du d?faut.',
    'Describe con la mayor claridad posible el comportamiento, los s?ntomas y el contexto relevante del defecto.',
  ),

  e(
    'Örn. Aktivasyon sırasında port doğrulaması tamamlanmadan kaynak rezervasyonu yapılabiliyor...',
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
    'Defect’i Analiz Et',
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
    'Henüz defect analizi yapılmadı',
    'No defect analysis yet',
    'Noch keine Defektanalyse',
    'Aucune analyse de d?faut pour le moment',
    'Todav?a no se ha realizado un an?lisis de defectos',
  ),

  e(
    'Bir defect açıklaması girerek seçili analizdeki değişiklikleri önceliklendirebilirsin.',
    'Enter a defect description to prioritize changes in the selected analysis.',
    'Geben Sie eine Defektbeschreibung ein, um ?nderungen in der ausgew?hlten Analyse zu priorisieren.',
    'Saisissez une description du d?faut pour prioriser les modifications de l?analyse s?lectionn?e.',
    'Introduce una descripci?n del defecto para priorizar los cambios del an?lisis seleccionado.',
  ),

  e(
    'İncelenmesi Gereken Aday Değişiklikler',
    'Candidate Changes Requiring Review',
    'Zu pr?fende Kandidaten?nderungen',
    'Modifications candidates ? examiner',
    'Cambios candidatos que requieren revisi?n',
  ),

  e(
    'ÖNCEKİ GEREKSİNİM',
    'PREVIOUS REQUIREMENT',
    'VORHERIGE ANFORDERUNG',
    'EXIGENCE PR?C?DENTE',
    'REQUISITO ANTERIOR',
  ),

  e(
    'YENİ GEREKSİNİM',
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
    'Gerekçe',
    'Reason',
    'Begr?ndung',
    'Justification',
    'Motivo',
  ),

  e(
    'Bu sonuç kesin kök neden değildir; incelenmesi gereken aday değişikliklerden biridir.',
    'This result is not a definitive root cause; it is one of the candidate changes that should be reviewed.',
    'Dieses Ergebnis ist keine endg?ltige Grundursache, sondern eine der zu pr?fenden Kandidaten?nderungen.',
    'Ce r?sultat n?est pas une cause racine d?finitive ; il s?agit d?une modification candidate ? examiner.',
    'Este resultado no es una causa ra?z definitiva; es uno de los cambios candidatos que deben revisarse.',
  ),

  e(
    'Defect analizi gerçekleştirilemedi.',
    'Defect analysis could not be completed.',
    'Die Defektanalyse konnte nicht abgeschlossen werden.',
    'L?analyse du d?faut n?a pas pu ?tre effectu?e.',
    'No se pudo completar el an?lisis del defecto.',
  ),
]



const PROCESS:
TranslationEntry[] = [
  e(
    'OPERASYONEL TAKİP',
    'OPERATIONAL TRACKING',
    'OPERATIVE VERFOLGUNG',
    'SUIVI OP?RATIONNEL',
    'SEGUIMIENTO OPERATIVO',
  ),

  e(
    'Süreç Takibi',
    'Process Tracking',
    'Prozessverfolgung',
    'Suivi des processus',
    'Seguimiento de procesos',
  ),

  e(
    'Geliştirme ve test süreçlerini tek ekrandan takip et. Süreç sorumluları kullanıcı tarafından atanır.',
    'Track development and testing processes from a single screen. Process owners are assigned by users.',
    'Verfolgen Sie Entwicklungs- und Testprozesse auf einem Bildschirm. Prozessverantwortliche werden von Benutzern zugewiesen.',
    'Suivez les processus de d?veloppement et de test depuis un seul ?cran. Les responsables sont attribu?s par les utilisateurs.',
    'Sigue los procesos de desarrollo y pruebas desde una sola pantalla. Los responsables son asignados por los usuarios.',
  ),

  e(
    'Excel Yükle',
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
    'Süreç, sorumlu, analist veya modül ara...',
    'Search process, owner, analyst or module...',
    'Prozess, Verantwortlichen, Analysten oder Modul suchen...',
    'Rechercher un processus, un responsable, un analyste ou un module...',
    'Buscar proceso, responsable, analista o m?dulo...',
  ),

  e(
    'Tüm Aşamalar',
    'All Stages',
    'Alle Phasen',
    'Toutes les ?tapes',
    'Todas las etapas',
  ),

  e(
    'Tüm Kayıtlar',
    'All Records',
    'Alle Eintr?ge',
    'Tous les enregistrements',
    'Todos los registros',
  ),

  e(
    'SÜREÇLER',
    'PROCESSES',
    'PROZESSE',
    'PROCESSUS',
    'PROCESOS',
  ),

  e(
    'Güncel İş Listesi',
    'Current Work List',
    'Aktuelle Arbeitsliste',
    'Liste de travail actuelle',
    'Lista de trabajo actual',
  ),

  e(
    'SÜREÇ / İŞ',
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
    'AŞAMA',
    'STAGE',
    'PHASE',
    '?TAPE',
    'ETAPA',
  ),

  e(
    'Aşama',
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
    'Atanmamış',
    'Unassigned',
    'Nicht zugewiesen',
    'Non attribu?',
    'Sin asignar',
  ),

  e(
    'Atanmadı',
    'Unassigned',
    'Nicht zugewiesen',
    'Non attribu?',
    'Sin asignar',
  ),

  e(
    'Tamamlandı',
    'Completed',
    'Abgeschlossen',
    'Termin?',
    'Completado',
  ),

  e(
    'Teslim Hazır',
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
    'Tasarım',
    'Design',
    'Design',
    'Conception',
    'Dise?o',
  ),

  e(
    'Geliştirme',
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
    'Bağlı değil',
    'Not linked',
    'Nicht verkn?pft',
    'Non li?',
    'No vinculado',
  ),

  e(
    'SÜREÇ DETAYI',
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
    'Yazılımcı',
    'Developer',
    'Entwickler',
    'D?veloppeur',
    'Desarrollador',
  ),

  e(
    'Bitiş',
    'Due',
    'F?llig',
    '?ch?ance',
    'Vencimiento',
  ),

  e(
    'Modül',
    'Module',
    'Modul',
    'Module',
    'M?dulo',
  ),

  e(
    'DURUM VERİLERİ',
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
    'Varsayılan olarak aşama, Excel durum bilgilerinden otomatik hesaplanır.',
    'By default, the stage is automatically calculated from the Excel status information.',
    'Standardm??ig wird die Phase automatisch aus den Excel-Statusinformationen berechnet.',
    'Par d?faut, l??tape est calcul?e automatiquement ? partir des informations de statut Excel.',
    'De forma predeterminada, la etapa se calcula autom?ticamente a partir de la informaci?n de estado de Excel.',
  ),

  e(
    'Analiz Bağlantısı',
    'Analysis Link',
    'Analyseverkn?pfung',
    'Lien d?analyse',
    'V?nculo de an?lisis',
  ),

  e(
    'Analiz bağlı değil',
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
    'Hayır',
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



const REPORTS:
TranslationEntry[] = [
  e(
    'RAPOR MERKEZİ',
    'REPORT CENTER',
    'BERICHTSZENTRUM',
    'CENTRE DE RAPPORTS',
    'CENTRO DE INFORMES',
  ),

  e(
    'Analiz Raporları',
    'Analysis Reports',
    'Analyseberichte',
    'Rapports d?analyse',
    'Informes de an?lisis',
  ),

  e(
    'Analiz sonuçlarını, risk profilini ve geçmiş rapor kayıtlarını tek ekrandan yönet.',
    'Manage analysis results, risk profiles and historical report records from a single screen.',
    'Verwalten Sie Analyseergebnisse, Risikoprofile und fr?here Berichte auf einem Bildschirm.',
    'G?rez les r?sultats d?analyse, les profils de risque et l?historique des rapports depuis un seul ?cran.',
    'Gestiona los resultados del an?lisis, los perfiles de riesgo y el historial de informes desde una sola pantalla.',
  ),

  e(
    'Oluşturulan analizleri görüntüle, Excel raporlarını indir veya artık gerekli olmayan analizleri kaldır.',
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
    'Rapor Formatı',
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
    'kayıtlı karşılaştırma',
    'saved comparisons',
    'gespeicherte Vergleiche',
    'comparaisons enregistr?es',
    'comparaciones guardadas',
  ),

  e(
    'tespit edilen değişiklik',
    'detected changes',
    'erkannte ?nderungen',
    'modifications d?tect?es',
    'cambios detectados',
  ),

  e(
    'Defect Aday Kaydı',
    'Defect Candidate Records',
    'Defektkandidaten',
    'Candidats de d?faut',
    'Registros de candidatos a defecto',
  ),

  e(
    'Toplam Defect Adayı Kaydı',
    'Total Defect Candidate Records',
    'Defektkandidaten gesamt',
    'Total des candidats de d?faut',
    'Total de candidatos a defecto',
  ),

  e(
    'önceliklendirilmiş aday',
    'prioritized candidates',
    'priorisierte Kandidaten',
    'candidats prioris?s',
    'candidatos priorizados',
  ),

  e(
    'Son Analiz Öncelikli Risk',
    'Latest Analysis Priority Risk',
    'Priorit?tsrisiko der letzten Analyse',
    'Risque prioritaire de la derni?re analyse',
    'Riesgo prioritario del ?ltimo an?lisis',
  ),

  e(
    'yüksek + kritik',
    'high + critical',
    'hoch + kritisch',
    '?lev? + critique',
    'alto + cr?tico',
  ),

  e(
    'SON ANALİZ',
    'LATEST ANALYSIS',
    'LETZTE ANALYSE',
    'DERNI?RE ANALYSE',
    '?LTIMO AN?LISIS',
  ),

  e(
    'Karşılaştırmayı İncele',
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
    'Excel Raporunu İndir',
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
    'DEĞİŞİKLİK',
    'CHANGES',
    '?NDERUNGEN',
    'MODIFICATIONS',
    'CAMBIOS',
  ),

  e(
    'YÜKSEK RİSK',
    'HIGH RISK',
    'HOHES RISIKO',
    'RISQUE ?LEV?',
    'RIESGO ALTO',
  ),

  e(
    'KRİTİK RİSK',
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
    'RİSK PROFİLİ',
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
    'Risk seviyelerinin dağılımı',
    'Distribution of risk levels',
    'Verteilung der Risikostufen',
    'R?partition des niveaux de risque',
    'Distribuci?n de niveles de riesgo',
  ),

  e(
    'DEĞİŞİM PROFİLİ',
    'CHANGE PROFILE',
    '?NDERUNGSPROFIL',
    'PROFIL DES MODIFICATIONS',
    'PERFIL DE CAMBIOS',
  ),

  e(
    'Öne Çıkan Değişimler',
    'Highlighted Changes',
    'Wesentliche ?nderungen',
    'Modifications principales',
    'Cambios destacados',
  ),

  e(
    'Son analizde tespit edilen değişim türleri',
    'Change types detected in the latest analysis',
    'In der letzten Analyse erkannte ?nderungstypen',
    'Types de modifications d?tect?s dans la derni?re analyse',
    'Tipos de cambio detectados en el ?ltimo an?lisis',
  ),

  e(
    'Raporlar yükleniyor',
    'Loading reports',
    'Berichte werden geladen',
    'Chargement des rapports',
    'Cargando informes',
  ),

  e(
    'Analiz kayıtları getiriliyor.',
    'Loading analysis records.',
    'Analysedatens?tze werden geladen.',
    'Chargement des enregistrements d?analyse.',
    'Cargando registros de an?lisis.',
  ),

  e(
    'Henüz rapor bulunmuyor',
    'No reports yet',
    'Noch keine Berichte',
    'Aucun rapport pour le moment',
    'Todav?a no hay informes',
  ),

  e(
    'Yükleme ekranından yeni bir karşılaştırma oluşturduğunda rapor burada görünecek.',
    'When you create a new comparison from the Upload page, the report will appear here.',
    'Wenn Sie auf der Upload-Seite einen neuen Vergleich erstellen, erscheint der Bericht hier.',
    'Lorsque vous cr?ez une nouvelle comparaison depuis la page de t?l?versement, le rapport appara?t ici.',
    'Cuando crees una nueva comparaci?n desde la p?gina de carga, el informe aparecer? aqu?.',
  ),

  e(
    'Eşleşen rapor bulunamadı',
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
    'Vazgeç',
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
    'Analiz raporları yüklenemedi.',
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
    'Analiz adı, versiyon veya ID ara...',
    'Search analysis name, version or ID...',
    'Analysename, Version oder ID suchen...',
    'Rechercher un nom d?analyse, une version ou un ID...',
    'Buscar nombre de an?lisis, versi?n o ID...',
  ),
]


void REPORTS


const REPORTS_UNICODE:
TranslationEntry[] = [
  e('RAPOR MERKEZİ', 'REPORT CENTER', 'BERICHTSZENTRUM', 'CENTRE DE RAPPORTS', 'CENTRO DE INFORMES'),
  e('Analiz Raporları', 'Analysis Reports', 'Analyseberichte', 'Rapports d’analyse', 'Informes de análisis'),
  e('Analiz sonuçlarını, risk profilini ve geçmiş rapor kayıtlarını tek ekrandan yönet.', 'Manage analysis results, risk profiles and historical report records from a single screen.', 'Verwalten Sie Analyseergebnisse, Risikoprofile und frühere Berichte auf einem Bildschirm.', 'Gérez les résultats d’analyse, les profils de risque et l’historique des rapports depuis un seul écran.', 'Gestiona los resultados del análisis, los perfiles de riesgo y el historial de informes desde una sola pantalla.'),
  e('Analiz sonuçlarını,', 'Manage analysis results,', 'Verwalten Sie Analyseergebnisse,', 'Gérez les résultats d’analyse,', 'Gestiona los resultados del análisis,'),
  e('risk profilini ve geçmiş', 'risk profiles and historical', 'Risikoprofile und frühere', 'les profils de risque et l’historique', 'los perfiles de riesgo y el historial'),
  e('rapor kayıtlarını tek', 'report records from a single', 'Berichte auf einem', 'des rapports depuis un seul', 'de informes desde una sola'),
  e('ekrandan yönet.', 'screen.', 'Bildschirm.', 'écran.', 'pantalla.'),
  e('RAPOR FORMATI', 'REPORT FORMAT', 'BERICHTSFORMAT', 'FORMAT DU RAPPORT', 'FORMATO DEL INFORME'),
  e('Toplam Analiz', 'Total Analyses', 'Analysen gesamt', 'Total des analyses', 'Análisis totales'),
  e('kayıtlı karşılaştırma', 'saved comparisons', 'gespeicherte Vergleiche', 'comparaisons enregistrées', 'comparaciones guardadas'),
  e('Toplam Değişiklik', 'Total Changes', 'Gesamtänderungen', 'Total des modifications', 'Cambios totales'),
  e('tespit edilen değişiklik', 'detected changes', 'erkannte Änderungen', 'modifications détectées', 'cambios detectados'),
  e('Defect Aday Kaydı', 'Defect Candidate Records', 'Defektkandidaten', 'Candidats de défaut', 'Registros de candidatos a defecto'),
  e('önceliklendirilmiş aday', 'prioritized candidates', 'priorisierte Kandidaten', 'candidats priorisés', 'candidatos priorizados'),
  e('Son Analiz Öncelikli Risk', 'Latest Analysis Priority Risk', 'Prioritätsrisiko der letzten Analyse', 'Risque prioritaire de la dernière analyse', 'Riesgo prioritario del último análisis'),
  e('yüksek + kritik', 'high + critical', 'hoch + kritisch', 'élevé + critique', 'alto + crítico'),
  e('Raporlar yükleniyor', 'Loading reports', 'Berichte werden geladen', 'Chargement des rapports', 'Cargando informes'),
  e('Analiz kayıtları getiriliyor.', 'Loading analysis records.', 'Analysedatensätze werden geladen.', 'Chargement des enregistrements d’analyse.', 'Cargando registros de análisis.'),
  e('Henüz rapor bulunmuyor', 'No reports yet', 'Noch keine Berichte', 'Aucun rapport pour le moment', 'Todavía no hay informes'),
  e('Yeni bir karşılaştırma oluşturduğunda rapor burada görünecek.', 'When you create a new comparison from the Upload page, the report will appear here.', 'Wenn Sie auf der Upload-Seite einen neuen Vergleich erstellen, erscheint der Bericht hier.', 'Lorsque vous créez une nouvelle comparaison depuis la page de téléversement, le rapport apparaît ici.', 'Cuando crees una nueva comparación desde la página de carga, el informe aparecerá aquí.'),
  e('Yeni bir karşılaştırma', 'When you create a new comparison', 'Wenn Sie einen neuen Vergleich', 'Lorsque vous créez une nouvelle comparaison', 'Cuando crees una nueva comparación'),
  e('oluşturduğunda rapor', 'from the Upload page, the report', 'auf der Upload-Seite erstellen, erscheint der Bericht', 'depuis la page de téléversement, le rapport', 'desde la página de carga, el informe'),
  e('burada görünecek.', 'will appear here.', 'hier.', 'apparaît ici.', 'aparecerá aquí.'),
  e('SON ANALİZ', 'LATEST ANALYSIS', 'LETZTE ANALYSE', 'DERNIÈRE ANALYSE', 'ÚLTIMO ANÁLISIS'),
  e('Analiz #', 'Analysis #', 'Analyse #', 'Analyse #', 'Análisis #'),
  e('Karşılaştırmayı İncele', 'Review Comparison', 'Vergleich prüfen', 'Examiner la comparaison', 'Revisar comparación'),
  e('Hazırlanıyor...', 'Preparing...', 'Wird vorbereitet ...', 'Préparation...', 'Preparando...'),
  e('Excel Raporu', 'Excel Report', 'Excel-Bericht', 'Rapport Excel', 'Informe Excel'),
  e('KAYNAK', 'SOURCE', 'QUELLE', 'SOURCE', 'ORIGEN'),
  e('HEDEF', 'TARGET', 'ZIEL', 'CIBLE', 'DESTINO'),
  e('ANALİZİ OLUŞTURAN', 'CREATED BY', 'ERSTELLT VON', 'CRÉÉ PAR', 'CREADO POR'),
  e('Kullanıcı bilgisi yok', 'No user information', 'Keine Benutzerinformationen', 'Aucune information utilisateur', 'No hay información del usuario'),
  e('OLUŞTURULMA', 'CREATED', 'ERSTELLT', 'CRÉÉ LE', 'CREADO'),
  e('DEĞİŞİKLİK', 'CHANGES', 'ÄNDERUNGEN', 'MODIFICATIONS', 'CAMBIOS'),
  e('YÜKSEK RİSK', 'HIGH RISK', 'HOHES RISIKO', 'RISQUE ÉLEVÉ', 'RIESGO ALTO'),
  e('KRİTİK RİSK', 'CRITICAL RISK', 'KRITISCHES RISIKO', 'RISQUE CRITIQUE', 'RIESGO CRÍTICO'),
  e('DEFECT ADAYI', 'DEFECT CANDIDATES', 'DEFEKTKANDIDATEN', 'CANDIDATS DE DÉFAUT', 'CANDIDATOS A DEFECTO'),
  e('Ortalama Risk Skoru', 'Average Risk Score', 'Durchschnittlicher Risikowert', 'Score de risque moyen', 'Puntuación media de riesgo'),
  e('Ortalama Confidence', 'Average Confidence', 'Durchschnittliche Konfidenz', 'Confiance moyenne', 'Confianza media'),
  e('Risk Profili', 'Risk Profile', 'Risikoprofil', 'Profil de risque', 'Perfil de riesgo'),
  e('Risk seviyelerinin dağılımı', 'Distribution of risk levels', 'Verteilung der Risikostufen', 'Répartition des niveaux de risque', 'Distribución de niveles de riesgo'),
  e('Risk seviyelerinin', 'Distribution of risk', 'Verteilung der Risiko', 'Répartition des niveaux', 'Distribución de los niveles'),
  e('dağılımı', 'levels', 'stufen', 'de risque', 'de riesgo'),
  e('DEĞİŞİM PROFİLİ', 'CHANGE PROFILE', 'ÄNDERUNGSPROFIL', 'PROFIL DES MODIFICATIONS', 'PERFIL DE CAMBIOS'),
  e('Öne Çıkan Değişimler', 'Highlighted Changes', 'Wesentliche Änderungen', 'Modifications principales', 'Cambios destacados'),
  e('Son analizde tespit edilen değişim türleri', 'Change types detected in the latest analysis', 'In der letzten Analyse erkannte Änderungstypen', 'Types de modifications détectés dans la dernière analyse', 'Tipos de cambio detectados en el último análisis'),
  e('Son analizde tespit', 'Change types detected', 'In der letzten Analyse erkannte', 'Types de modifications détectés', 'Tipos de cambio detectados'),
  e('edilen değişim türleri', 'in the latest analysis', 'Änderungstypen', 'dans la dernière analyse', 'en el último análisis'),
  e('Değişim profili', 'Change profile', 'Änderungsprofil', 'Profil des modifications', 'Perfil de cambios'),
  e('bulunmuyor.', 'not available.', 'nicht verfügbar.', 'indisponible.', 'no disponible.'),
  e('Düşük', 'Low', 'Niedrig', 'Faible', 'Bajo'),
  e('Orta', 'Medium', 'Mittel', 'Moyen', 'Medio'),
  e('Yüksek', 'High', 'Hoch', 'Élevé', 'Alto'),
  e('Kritik', 'Critical', 'Kritisch', 'Critique', 'Crítico'),
  e('RAPOR ARŞİVİ', 'REPORT ARCHIVE', 'BERICHTSARCHIV', 'ARCHIVES DES RAPPORTS', 'ARCHIVO DE INFORMES'),
  e('Tüm Analizler', 'All Analyses', 'Alle Analysen', 'Toutes les analyses', 'Todos los análisis'),
  e('Geçmiş analiz raporlarını', 'View and manage historical', 'Historische Analyseberichte', 'Consultez et gérez les rapports', 'Consulta y gestiona los informes'),
  e('Geçmiş analiz raporlarını görüntüle ve yönet.', 'View and manage historical analysis reports.', 'Historische Analyseberichte anzeigen und verwalten.', 'Consultez et gérez les rapports d’analyse historiques.', 'Consulta y gestiona los informes de análisis históricos.'),
  e('görüntüle ve yönet.', 'analysis reports.', 'anzeigen und verwalten.', 'd’analyse historiques.', 'de análisis históricos.'),
  e('Eşleşen rapor bulunamadı', 'No matching reports found', 'Keine passenden Berichte gefunden', 'Aucun rapport correspondant', 'No se encontraron informes coincidentes'),
  e('Arama ifadesini', 'Change your search term', 'Ändern Sie den Suchbegriff', 'Modifiez votre recherche', 'Cambia el término de búsqueda'),
  e('değiştirerek tekrar dene.', 'and try again.', 'und versuchen Sie es erneut.', 'et réessayez.', 'e inténtalo de nuevo.'),
  e('Analiz adı, versiyon veya ID ara...', 'Search analysis name, version or ID...', 'Analysename, Version oder ID suchen ...', 'Rechercher un nom d’analyse, une version ou un ID...', 'Buscar nombre de análisis, versión o ID...'),
  e('OLUŞTURAN', 'CREATED BY', 'ERSTELLT VON', 'CRÉÉ PAR', 'CREADO POR'),
  e('Bilgi yok', 'No information', 'Keine Angaben', 'Aucune information', 'Sin información'),
  e('ANALİZİ SİL', 'DELETE ANALYSIS', 'ANALYSE LÖSCHEN', 'SUPPRIMER L’ANALYSE', 'ELIMINAR ANÁLISIS'),
  e('Bu analizi silmek', 'Are you sure you want to', 'Möchten Sie diese Analyse', 'Voulez-vous vraiment', '¿Seguro que quieres'),
  e('Bu analizi silmek istediğine emin misin?', 'Are you sure you want to delete this analysis?', 'Möchten Sie diese Analyse wirklich löschen?', 'Voulez-vous vraiment supprimer cette analyse ?', '¿Seguro que quieres eliminar este análisis?'),
  e('istediğine emin misin?', 'delete this analysis?', 'löschen?', 'supprimer cette analyse ?', 'eliminar este análisis?'),
  e('silinecek.', 'will be permanently deleted.', 'wird dauerhaft gelöscht.', 'sera définitivement supprimée.', 'se eliminará permanentemente.'),
  e('ANALİZ', 'ANALYSIS', 'ANALYSE', 'ANALYSE', 'ANÁLISIS'),
  e('Bu işlem geri alınamaz.', 'This action cannot be undone.', 'Diese Aktion kann nicht rückgängig gemacht werden.', 'Cette action est irréversible.', 'Esta acción no se puede deshacer.'),
  e('Analize bağlı değişiklik', 'Changes and defect candidate records', 'Änderungen und Defektkandidaten', 'Les modifications et candidats de défaut', 'Los cambios y registros de candidatos a defecto'),
  e('ve defect aday kayıtları', 'related to the analysis', 'dieser Analyse', 'liés à l’analyse', 'relacionados con el análisis'),
  e('da silinir.', 'will also be deleted.', 'werden ebenfalls gelöscht.', 'seront également supprimés.', 'también se eliminarán.'),
  e('Vazgeç', 'Cancel', 'Abbrechen', 'Annuler', 'Cancelar'),
  e('Siliniyor...', 'Deleting...', 'Wird gelöscht ...', 'Suppression...', 'Eliminando...'),
  e('Analizi Kalıcı Olarak Sil', 'Delete Analysis Permanently', 'Analyse dauerhaft löschen', 'Supprimer définitivement l’analyse', 'Eliminar análisis permanentemente'),
]



const DASHBOARD:
TranslationEntry[] = [
  e(
    'KARŞILAŞTIRMA',
    'COMPARISON',
    'VERGLEICH',
    'COMPARAISON',
    'COMPARACI?N',
  ),

  e(
    'Değişim Dağılımı',
    'Change Distribution',
    '?nderungsverteilung',
    'R?partition des modifications',
    'Distribuci?n de cambios',
  ),

  e(
    'Tespit edilen değişiklik türlerinin dağılımı',
    'Distribution of detected change types',
    'Verteilung der erkannten ?nderungstypen',
    'R?partition des types de modifications d?tect?s',
    'Distribuci?n de los tipos de cambio detectados',
  ),

  e(
    'Risk Seviyesi Dağılımı',
    'Risk Level Distribution',
    'Risikostufenverteilung',
    'R?partition des niveaux de risque',
    'Distribuci?n del nivel de riesgo',
  ),

  e(
    'Değişikliklerin risk seviyelerine göre dağılımı',
    'Distribution of changes by risk level',
    'Verteilung der ?nderungen nach Risikostufe',
    'R?partition des modifications selon le niveau de risque',
    'Distribuci?n de los cambios seg?n el nivel de riesgo',
  ),

  e(
    'Gereksinim Değişiklikleri',
    'Requirement Changes',
    'Anforderungs?nderungen',
    'Modifications des exigences',
    'Cambios de requisitos',
  ),
]



const COUNT_UNITS:
TranslationEntry[] = [
  e(
    'kayıt',
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
    'sonuç',
    'results',
    'Ergebnisse',
    'r?sultats',
    'resultados',
  ),

  e(
    'değişiklik',
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
    'Şubat',
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
    'Mayıs',
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
    'Ağustos',
    'August',
    'August',
    'ao?t',
    'agosto',
  ),

  e(
    'Eylül',
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
    'Kasım',
    'November',
    'November',
    'novembre',
    'noviembre',
  ),

  e(
    'Aralık',
    'December',
    'Dezember',
    'd?cembre',
    'diciembre',
  ),
]


const SHORT_MONTHS:
TranslationEntry[] = [
  e('Oca', 'Jan', 'Jan', 'janv', 'ene'),
  e('Şub', 'Feb', 'Feb', 'f?vr', 'feb'),
  e('Mar', 'Mar', 'M?r', 'mars', 'mar'),
  e('Nis', 'Apr', 'Apr', 'avr', 'abr'),
  e('May', 'May', 'Mai', 'mai', 'may'),
  e('Haz', 'Jun', 'Jun', 'juin', 'jun'),
  e('Tem', 'Jul', 'Jul', 'juil', 'jul'),
  e('Ağu', 'Aug', 'Aug', 'ao?t', 'ago'),
  e('Eyl', 'Sep', 'Sep', 'sept', 'sep'),
  e('Eki', 'Oct', 'Okt', 'oct', 'oct'),
  e('Kas', 'Nov', 'Nov', 'nov', 'nov'),
  e('Ara', 'Dec', 'Dez', 'd?c', 'dic'),
]



function normalize(
  value: string,
): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ı', 'i')
    .replaceAll('İ', 'I')
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
      ...REPORTS_UNICODE,
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


  for (const [candidate, entry] of lookup) {
    if (!candidate.includes('?')) {
      continue
    }

    const pattern = new RegExp(
      `^${candidate
        .replace(/[.*+^${}()|[\]\\]/g, '\\$&')
        .replaceAll('?', '.')}$`,
      'i',
    )

    if (pattern.test(normalized)) {
      return entry[language]
    }
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
    /[çğıöşü]/i.test(normalized)
    || /\b(?:gereksinim|değişiklik|açıklama|süreç|sistem|müşteri|kullanıcı|kontrol|gönder|olmalıdır|edilmelidir|yapılabilir|yapılmalıdır|incelenmesi|kaynak|sipariş|aktivasyon)\b/i.test(normalized)
  )
}


async function translateDynamicContent(
  root: Element,
  language: SupportedLanguage,
): Promise<void> {
  if (language === 'tr') {
    return
  }

  if (dynamicTranslationInFlight) {
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

  const pendingSources =
    sources.filter(
      (source) =>
        !dynamicTranslationCache.has(
          `${language}:${source}`,
        ),
    )

  if (!pendingSources.length) {
    for (const source of sources) {
      const translated =
        dynamicTranslationCache.get(
          `${language}:${source}`,
        )

      if (!translated) {
        continue
      }

      const leading = source.match(/^\s*/)?.[0] ?? ''
      const trailing = source.match(/\s*$/)?.[0] ?? ''
      const rendered = `${leading}${translated}${trailing}`

      for (const node of sourceNodes.get(source) ?? []) {
        if (!node.isConnected) {
          continue
        }

        node.nodeValue = rendered
        const state = textTranslationStates.get(node)
        if (state) {
          state.rendered = rendered
          state.dynamic = true
          state.dynamicLanguage = language
        }
      }
    }

    return
  }

  let translations: string[]

  dynamicTranslationInFlight = true

  try {
    translations = await translateContentBatch(
      pendingSources,
      language,
    )
  } catch {
    dynamicTranslationInFlight = false
    return
  }

  dynamicTranslationInFlight = false

  for (
    let index = 0;
    index < pendingSources.length;
    index += 1
  ) {
    const source = pendingSources[index]
    const translated = translations[index]

    if (!source || !translated) {
      continue
    }

    dynamicTranslationCache.set(
      `${language}:${source}`,
      translated,
    )

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


const dynamicTranslationCache =
  new Map<
    string,
    string
  >()


let dynamicTranslationInFlight =
  false


function getTextSource(
  node: Text,
  value: string,
): string {
  const state =
    textTranslationStates.get(
      node,
    )


  if (
    state
    && state.rendered === value
  ) {
    return state.source
  }


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
