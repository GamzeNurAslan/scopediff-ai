export type SupportedLanguage =
  | 'tr'
  | 'en'
  | 'de'
  | 'fr'
  | 'es'


export interface LanguageOption {
  code: SupportedLanguage
  shortLabel: string
  label: string
  locale: string
}


export const SUPPORTED_LANGUAGES:
LanguageOption[] = [
  {
    code: 'tr',
    shortLabel: 'TR',
    label: 'Türkçe',
    locale: 'tr-TR',
  },
  {
    code: 'en',
    shortLabel: 'EN',
    label: 'English',
    locale: 'en-US',
  },
  {
    code: 'de',
    shortLabel: 'DE',
    label: 'Deutsch',
    locale: 'de-DE',
  },
  {
    code: 'fr',
    shortLabel: 'FR',
    label: 'Français',
    locale: 'fr-FR',
  },
  {
    code: 'es',
    shortLabel: 'ES',
    label: 'Español',
    locale: 'es-ES',
  },
]


type TranslationDictionary =
  Record<string, string>


export const TRANSLATIONS:
Record<
  SupportedLanguage,
  TranslationDictionary
> = {

  /* =====================================================
     TÜRKÇE
     ===================================================== */

  tr: {
    'common.systemReady':
      'Sistem hazır',

    'common.interfaceLanguage':
      'Uygulama Dili',

    'common.reportLanguage':
      'Rapor Dili',

    'common.languageSettings':
      'Dil Ayarları',

    'common.reportLanguageHint':
      'Rapor dili Excel çıktılarında kullanılır.',

    'common.language':
      'Dil',

    'common.close':
      'Kapat',


    'profile.department':
      'Departman',

    'profile.role':
      'Rol',

    'profile.chooseAvatar':
      'Avatarını seç',

    'profile.profile':
      'Profil',


    'navigation.workspace':
      'ÇALIŞMA ALANI',

    'navigation.upload':
      'Yükleme',

    'navigation.dashboard':
      'Dashboard',

    'navigation.comparison':
      'Karşılaştırma',

    'navigation.defects':
      'Defect Analizi',

    'navigation.processTracking':
      'Süreç Takibi',

    'navigation.teamLead':
      'Takım Lideri',

    'navigation.history':
      'Geçmiş',

    'navigation.reports':
      'Raporlar',


    'brand.subtitle':
      'Değişiklik Analizi',

    'traceability.label':
      'İZLENEBİLİRLİK',

    'traceability.message':
      'Değişikliği izle, riski önceliklendir.',


    'route.upload.eyebrow':
      'ÇALIŞMA ALANI',

    'route.upload.title':
      'Dosya ve Versiyon Yükleme',

    'route.upload.description':
      'Yeni bir gereksinim karşılaştırması oluştur.',

    'route.dashboard.eyebrow':
      'GENEL BAKIŞ',

    'route.dashboard.title':
      'Analiz Dashboard',

    'route.dashboard.description':
      'Değişiklikleri, riskleri ve analiz sinyallerini izle.',

    'route.comparison.eyebrow':
      'DEĞİŞİKLİK ANALİZİ',

    'route.comparison.title':
      'Versiyon Karşılaştırma',

    'route.comparison.description':
      'Gereksinim değişikliklerini anlamsal olarak incele.',

    'route.defects.eyebrow':
      'KARAR DESTEK',

    'route.defects.title':
      'Defect Analizi',

    'route.defects.description':
      'Defect ile ilişkili olabilecek aday değişiklikleri önceliklendir.',

    'route.processTracking.eyebrow':
      'OPERASYON',

    'route.processTracking.title':
      'Süreç Takibi',

    'route.processTracking.description':
      'Geliştirme ve test akışındaki işleri takip et.',

    'route.teamLead.eyebrow':
      'TAKIM LİDERİ',

    'route.teamLead.title':
      'Takım Lideri Paneli',

    'route.teamLead.description':
      'Ekip iş yükünü ve süreç durumunu tek ekrandan yönet.',

    'route.history.eyebrow':
      'İZLENEBİLİRLİK',

    'route.history.title':
      'Analiz Geçmişi',

    'route.history.description':
      'Requirement versiyon geçmişi ve değişim izlerini incele.',

    'route.reports.eyebrow':
      'RAPORLAMA',

    'route.reports.title':
      'Raporlar',

    'route.reports.description':
      'Analiz çıktılarını ve raporlarını yönet.',


    /* UPLOAD */

    'upload.kicker':
      'YENİ ANALİZ',

    'upload.title':
      'Gereksinim versiyonlarını karşılaştır',

    'upload.description':
      'İki farklı gereksinim versiyonunu yükleyerek anlamsal değişiklikleri, risk seviyelerini ve incelenmesi gereken değişiklikleri analiz et.',

    'upload.step':
      'Dosyaları yükle',

    'upload.source.title':
      'Kaynak Versiyon',

    'upload.source.description':
      'Karşılaştırmanın eski gereksinim dosyası',

    'upload.target.title':
      'Hedef Versiyon',

    'upload.target.description':
      'Karşılaştırmanın yeni gereksinim dosyası',

    'upload.drop.title':
      'Excel dosyasını buraya bırak',

    'upload.drop.subtitle':
      'veya dosya seçmek için tıkla',

    'upload.source.remove':
      'Kaynak dosyayı kaldır',

    'upload.target.remove':
      'Hedef dosyayı kaldır',

    'upload.settings.title':
      'Analiz Ayarları',

    'upload.settings.description':
      'Karşılaştırma için isteğe bağlı bir analiz adı belirleyebilirsin.',

    'upload.analysisName':
      'ANALİZ ADI',

    'upload.optional':
      'İsteğe bağlı',

    'upload.placeholder':
      'Örn. v1.0 → v2.0 Aktivasyon Analizi',

    'upload.creator':
      'ANALİZİ OLUŞTURAN',

    'upload.ready.select':
      'Devam etmek için iki Excel dosyasını seç',

    'upload.ready.ready':
      'İki dosya da karşılaştırmaya hazır',

    'upload.ready.analyzing':
      'ScopeDiff AI gereksinimleri analiz ediyor...',

    'upload.button.start':
      'Karşılaştırmayı Başlat',

    'upload.button.analyzing':
      'Analiz Yapılıyor...',

    'upload.error.xlsx':
      'Lütfen .xlsx uzantılı bir Excel dosyası seç.',

    'upload.error.profile':
      'Analizi başlatmak için kullanıcı profili gerekli.',

    'upload.error.comparison':
      'Karşılaştırma işlemi tamamlanamadı.',
  },


  /* =====================================================
     ENGLISH
     ===================================================== */

  en: {
    'common.systemReady':
      'System ready',

    'common.interfaceLanguage':
      'Interface Language',

    'common.reportLanguage':
      'Report Language',

    'common.languageSettings':
      'Language Settings',

    'common.reportLanguageHint':
      'Report language is used for Excel exports.',

    'common.language':
      'Language',

    'common.close':
      'Close',


    'profile.department':
      'Department',

    'profile.role':
      'Role',

    'profile.chooseAvatar':
      'Choose avatar',

    'profile.profile':
      'Profile',


    'navigation.workspace':
      'WORKSPACE',

    'navigation.upload':
      'Upload',

    'navigation.dashboard':
      'Dashboard',

    'navigation.comparison':
      'Comparison',

    'navigation.defects':
      'Defect Analysis',

    'navigation.processTracking':
      'Process Tracking',

    'navigation.teamLead':
      'Team Lead',

    'navigation.history':
      'History',

    'navigation.reports':
      'Reports',


    'brand.subtitle':
      'Change Intelligence',

    'traceability.label':
      'TRACEABILITY',

    'traceability.message':
      'Track change, prioritize risk.',


    'route.upload.eyebrow':
      'WORKSPACE',

    'route.upload.title':
      'File and Version Upload',

    'route.upload.description':
      'Create a new requirement comparison.',

    'route.dashboard.eyebrow':
      'OVERVIEW',

    'route.dashboard.title':
      'Analysis Dashboard',

    'route.dashboard.description':
      'Monitor changes, risks and analysis signals.',

    'route.comparison.eyebrow':
      'CHANGE INTELLIGENCE',

    'route.comparison.title':
      'Version Comparison',

    'route.comparison.description':
      'Review requirement changes semantically.',

    'route.defects.eyebrow':
      'DECISION SUPPORT',

    'route.defects.title':
      'Defect Analysis',

    'route.defects.description':
      'Prioritize candidate changes that may be related to defects.',

    'route.processTracking.eyebrow':
      'OPERATIONS',

    'route.processTracking.title':
      'Process Tracking',

    'route.processTracking.description':
      'Track work across development and testing.',

    'route.teamLead.eyebrow':
      'TEAM LEAD',

    'route.teamLead.title':
      'Team Lead Panel',

    'route.teamLead.description':
      'Manage team workload and process status from one screen.',

    'route.history.eyebrow':
      'TRACEABILITY',

    'route.history.title':
      'Analysis History',

    'route.history.description':
      'Review requirement version history and change traces.',

    'route.reports.eyebrow':
      'REPORTING',

    'route.reports.title':
      'Reports',

    'route.reports.description':
      'Manage analysis outputs and reports.',


    /* UPLOAD */

    'upload.kicker':
      'NEW ANALYSIS',

    'upload.title':
      'Compare requirement versions',

    'upload.description':
      'Upload two different requirement versions to analyze semantic changes, risk levels and changes that may require review.',

    'upload.step':
      'Upload files',

    'upload.source.title':
      'Source Version',

    'upload.source.description':
      'Previous requirement file for comparison',

    'upload.target.title':
      'Target Version',

    'upload.target.description':
      'New requirement file for comparison',

    'upload.drop.title':
      'Drop the Excel file here',

    'upload.drop.subtitle':
      'or click to choose a file',

    'upload.source.remove':
      'Remove source file',

    'upload.target.remove':
      'Remove target file',

    'upload.settings.title':
      'Analysis Settings',

    'upload.settings.description':
      'Optionally provide a name for this comparison.',

    'upload.analysisName':
      'ANALYSIS NAME',

    'upload.optional':
      'Optional',

    'upload.placeholder':
      'E.g. v1.0 → v2.0 Activation Analysis',

    'upload.creator':
      'CREATED BY',

    'upload.ready.select':
      'Select two Excel files to continue',

    'upload.ready.ready':
      'Both files are ready for comparison',

    'upload.ready.analyzing':
      'ScopeDiff AI is analyzing the requirements...',

    'upload.button.start':
      'Start Comparison',

    'upload.button.analyzing':
      'Analyzing...',

    'upload.error.xlsx':
      'Please select an Excel file with the .xlsx extension.',

    'upload.error.profile':
      'A user profile is required to start the analysis.',

    'upload.error.comparison':
      'The comparison could not be completed.',
  },


  /* =====================================================
     DEUTSCH
     ===================================================== */

  de: {
    'common.systemReady':
      'System bereit',

    'common.interfaceLanguage':
      'Oberflächensprache',

    'common.reportLanguage':
      'Berichtssprache',

    'common.languageSettings':
      'Spracheinstellungen',

    'common.reportLanguageHint':
      'Die Berichtssprache wird für Excel-Exporte verwendet.',

    'common.language':
      'Sprache',

    'common.close':
      'Schließen',


    'profile.department':
      'Abteilung',

    'profile.role':
      'Rolle',

    'profile.chooseAvatar':
      'Avatar auswählen',

    'profile.profile':
      'Profil',


    'navigation.workspace':
      'ARBEITSBEREICH',

    'navigation.upload':
      'Hochladen',

    'navigation.dashboard':
      'Dashboard',

    'navigation.comparison':
      'Vergleich',

    'navigation.defects':
      'Defektanalyse',

    'navigation.processTracking':
      'Prozessverfolgung',

    'navigation.teamLead':
      'Teamleitung',

    'navigation.history':
      'Verlauf',

    'navigation.reports':
      'Berichte',


    'brand.subtitle':
      'Änderungsanalyse',

    'traceability.label':
      'NACHVERFOLGBARKEIT',

    'traceability.message':
      'Änderungen verfolgen, Risiken priorisieren.',


    'route.upload.eyebrow':
      'ARBEITSBEREICH',

    'route.upload.title':
      'Datei- und Versionsupload',

    'route.upload.description':
      'Einen neuen Anforderungsvergleich erstellen.',

    'route.dashboard.eyebrow':
      'ÜBERSICHT',

    'route.dashboard.title':
      'Analyse-Dashboard',

    'route.dashboard.description':
      'Änderungen, Risiken und Analysesignale überwachen.',

    'route.comparison.eyebrow':
      'ÄNDERUNGSANALYSE',

    'route.comparison.title':
      'Versionsvergleich',

    'route.comparison.description':
      'Anforderungsänderungen semantisch prüfen.',

    'route.defects.eyebrow':
      'ENTSCHEIDUNGSUNTERSTÜTZUNG',

    'route.defects.title':
      'Defektanalyse',

    'route.defects.description':
      'Potentiell relevante Änderungen priorisieren.',

    'route.processTracking.eyebrow':
      'BETRIEB',

    'route.processTracking.title':
      'Prozessverfolgung',

    'route.processTracking.description':
      'Entwicklungs- und Testarbeiten verfolgen.',

    'route.teamLead.eyebrow':
      'TEAMLEITUNG',

    'route.teamLead.title':
      'Teamleiter-Panel',

    'route.teamLead.description':
      'Teamlast und Prozessstatus auf einen Blick verwalten.',

    'route.history.eyebrow':
      'NACHVERFOLGBARKEIT',

    'route.history.title':
      'Analyseverlauf',

    'route.history.description':
      'Versionshistorie und Änderungsspuren prüfen.',

    'route.reports.eyebrow':
      'BERICHTE',

    'route.reports.title':
      'Berichte',

    'route.reports.description':
      'Analyseergebnisse und Berichte verwalten.',


    /* UPLOAD */

    'upload.kicker':
      'NEUE ANALYSE',

    'upload.title':
      'Anforderungsversionen vergleichen',

    'upload.description':
      'Laden Sie zwei verschiedene Anforderungsversionen hoch, um semantische Änderungen, Risikostufen und prüfungsrelevante Änderungen zu analysieren.',

    'upload.step':
      'Dateien hochladen',

    'upload.source.title':
      'Quellversion',

    'upload.source.description':
      'Vorherige Anforderungsdatei für den Vergleich',

    'upload.target.title':
      'Zielversion',

    'upload.target.description':
      'Neue Anforderungsdatei für den Vergleich',

    'upload.drop.title':
      'Excel-Datei hier ablegen',

    'upload.drop.subtitle':
      'oder klicken, um eine Datei auszuwählen',

    'upload.source.remove':
      'Quelldatei entfernen',

    'upload.target.remove':
      'Zieldatei entfernen',

    'upload.settings.title':
      'Analyseeinstellungen',

    'upload.settings.description':
      'Optional können Sie einen Namen für diesen Vergleich angeben.',

    'upload.analysisName':
      'ANALYSENAME',

    'upload.optional':
      'Optional',

    'upload.placeholder':
      'Z. B. v1.0 → v2.0 Aktivierungsanalyse',

    'upload.creator':
      'ERSTELLT VON',

    'upload.ready.select':
      'Wählen Sie zwei Excel-Dateien aus, um fortzufahren',

    'upload.ready.ready':
      'Beide Dateien sind für den Vergleich bereit',

    'upload.ready.analyzing':
      'ScopeDiff AI analysiert die Anforderungen...',

    'upload.button.start':
      'Vergleich starten',

    'upload.button.analyzing':
      'Analyse läuft...',

    'upload.error.xlsx':
      'Bitte wählen Sie eine Excel-Datei mit der Erweiterung .xlsx aus.',

    'upload.error.profile':
      'Zum Starten der Analyse ist ein Benutzerprofil erforderlich.',

    'upload.error.comparison':
      'Der Vergleich konnte nicht abgeschlossen werden.',
  },


  /* =====================================================
     FRANÇAIS
     ===================================================== */

  fr: {
    'common.systemReady':
      'Système prêt',

    'common.interfaceLanguage':
      'Langue de l’interface',

    'common.reportLanguage':
      'Langue du rapport',

    'common.languageSettings':
      'Paramètres de langue',

    'common.reportLanguageHint':
      'La langue du rapport est utilisée pour les exports Excel.',

    'common.language':
      'Langue',

    'common.close':
      'Fermer',


    'profile.department':
      'Département',

    'profile.role':
      'Rôle',

    'profile.chooseAvatar':
      'Choisir un avatar',

    'profile.profile':
      'Profil',


    'navigation.workspace':
      'ESPACE DE TRAVAIL',

    'navigation.upload':
      'Téléversement',

    'navigation.dashboard':
      'Tableau de bord',

    'navigation.comparison':
      'Comparaison',

    'navigation.defects':
      'Analyse des défauts',

    'navigation.processTracking':
      'Suivi des processus',

    'navigation.teamLead':
      'Chef d’équipe',

    'navigation.history':
      'Historique',

    'navigation.reports':
      'Rapports',


    'brand.subtitle':
      'Analyse des changements',

    'traceability.label':
      'TRAÇABILITÉ',

    'traceability.message':
      'Suivre les changements, prioriser les risques.',


    'route.upload.eyebrow':
      'ESPACE DE TRAVAIL',

    'route.upload.title':
      'Téléversement des fichiers et versions',

    'route.upload.description':
      'Créer une nouvelle comparaison des exigences.',

    'route.dashboard.eyebrow':
      'VUE D’ENSEMBLE',

    'route.dashboard.title':
      'Tableau de bord d’analyse',

    'route.dashboard.description':
      'Suivre les changements, risques et signaux d’analyse.',

    'route.comparison.eyebrow':
      'ANALYSE DES CHANGEMENTS',

    'route.comparison.title':
      'Comparaison des versions',

    'route.comparison.description':
      'Examiner sémantiquement les changements des exigences.',

    'route.defects.eyebrow':
      'AIDE À LA DÉCISION',

    'route.defects.title':
      'Analyse des défauts',

    'route.defects.description':
      'Prioriser les changements candidats potentiellement liés aux défauts.',

    'route.processTracking.eyebrow':
      'OPÉRATIONS',

    'route.processTracking.title':
      'Suivi des processus',

    'route.processTracking.description':
      'Suivre les travaux de développement et de test.',

    'route.teamLead.eyebrow':
      'CHEF D’ÉQUIPE',

    'route.teamLead.title':
      'Espace chef d’équipe',

    'route.teamLead.description':
      'Gérer la charge de l’équipe et l’état des processus.',

    'route.history.eyebrow':
      'TRAÇABILITÉ',

    'route.history.title':
      'Historique des analyses',

    'route.history.description':
      'Examiner les versions et les traces de changement.',

    'route.reports.eyebrow':
      'RAPPORTS',

    'route.reports.title':
      'Rapports',

    'route.reports.description':
      'Gérer les résultats d’analyse et les rapports.',


    /* UPLOAD */

    'upload.kicker':
      'NOUVELLE ANALYSE',

    'upload.title':
      'Comparer les versions des exigences',

    'upload.description':
      'Téléversez deux versions différentes des exigences afin d’analyser les changements sémantiques, les niveaux de risque et les changements nécessitant une vérification.',

    'upload.step':
      'Téléverser les fichiers',

    'upload.source.title':
      'Version source',

    'upload.source.description':
      'Fichier d’exigences précédent pour la comparaison',

    'upload.target.title':
      'Version cible',

    'upload.target.description':
      'Nouveau fichier d’exigences pour la comparaison',

    'upload.drop.title':
      'Déposez le fichier Excel ici',

    'upload.drop.subtitle':
      'ou cliquez pour choisir un fichier',

    'upload.source.remove':
      'Supprimer le fichier source',

    'upload.target.remove':
      'Supprimer le fichier cible',

    'upload.settings.title':
      'Paramètres de l’analyse',

    'upload.settings.description':
      'Vous pouvez éventuellement donner un nom à cette comparaison.',

    'upload.analysisName':
      'NOM DE L’ANALYSE',

    'upload.optional':
      'Facultatif',

    'upload.placeholder':
      'Ex. v1.0 → v2.0 Analyse d’activation',

    'upload.creator':
      'CRÉÉ PAR',

    'upload.ready.select':
      'Sélectionnez deux fichiers Excel pour continuer',

    'upload.ready.ready':
      'Les deux fichiers sont prêts pour la comparaison',

    'upload.ready.analyzing':
      'ScopeDiff AI analyse les exigences...',

    'upload.button.start':
      'Démarrer la comparaison',

    'upload.button.analyzing':
      'Analyse en cours...',

    'upload.error.xlsx':
      'Veuillez sélectionner un fichier Excel avec l’extension .xlsx.',

    'upload.error.profile':
      'Un profil utilisateur est requis pour démarrer l’analyse.',

    'upload.error.comparison':
      'La comparaison n’a pas pu être terminée.',
  },


  /* =====================================================
     ESPAÑOL
     ===================================================== */

  es: {
    'common.systemReady':
      'Sistema listo',

    'common.interfaceLanguage':
      'Idioma de la interfaz',

    'common.reportLanguage':
      'Idioma del informe',

    'common.languageSettings':
      'Configuración de idioma',

    'common.reportLanguageHint':
      'El idioma del informe se utiliza en las exportaciones de Excel.',

    'common.language':
      'Idioma',

    'common.close':
      'Cerrar',


    'profile.department':
      'Departamento',

    'profile.role':
      'Rol',

    'profile.chooseAvatar':
      'Elegir avatar',

    'profile.profile':
      'Perfil',


    'navigation.workspace':
      'ÁREA DE TRABAJO',

    'navigation.upload':
      'Carga',

    'navigation.dashboard':
      'Panel',

    'navigation.comparison':
      'Comparación',

    'navigation.defects':
      'Análisis de defectos',

    'navigation.processTracking':
      'Seguimiento de procesos',

    'navigation.teamLead':
      'Líder de equipo',

    'navigation.history':
      'Historial',

    'navigation.reports':
      'Informes',


    'brand.subtitle':
      'Análisis de cambios',

    'traceability.label':
      'TRAZABILIDAD',

    'traceability.message':
      'Seguir cambios, priorizar riesgos.',


    'route.upload.eyebrow':
      'ÁREA DE TRABAJO',

    'route.upload.title':
      'Carga de archivos y versiones',

    'route.upload.description':
      'Crear una nueva comparación de requisitos.',

    'route.dashboard.eyebrow':
      'RESUMEN',

    'route.dashboard.title':
      'Panel de análisis',

    'route.dashboard.description':
      'Supervisar cambios, riesgos y señales de análisis.',

    'route.comparison.eyebrow':
      'ANÁLISIS DE CAMBIOS',

    'route.comparison.title':
      'Comparación de versiones',

    'route.comparison.description':
      'Revisar semánticamente los cambios de requisitos.',

    'route.defects.eyebrow':
      'APOYO A DECISIONES',

    'route.defects.title':
      'Análisis de defectos',

    'route.defects.description':
      'Priorizar cambios candidatos posiblemente relacionados con defectos.',

    'route.processTracking.eyebrow':
      'OPERACIONES',

    'route.processTracking.title':
      'Seguimiento de procesos',

    'route.processTracking.description':
      'Seguir trabajos de desarrollo y pruebas.',

    'route.teamLead.eyebrow':
      'LÍDER DE EQUIPO',

    'route.teamLead.title':
      'Panel del líder de equipo',

    'route.teamLead.description':
      'Gestiona la carga del equipo y el estado de los procesos.',

    'route.history.eyebrow':
      'TRAZABILIDAD',

    'route.history.title':
      'Historial de análisis',

    'route.history.description':
      'Revisar versiones y trazas de cambios.',

    'route.reports.eyebrow':
      'INFORMES',

    'route.reports.title':
      'Informes',

    'route.reports.description':
      'Gestionar resultados de análisis e informes.',


    /* UPLOAD */

    'upload.kicker':
      'NUEVO ANÁLISIS',

    'upload.title':
      'Comparar versiones de requisitos',

    'upload.description':
      'Carga dos versiones diferentes de requisitos para analizar cambios semánticos, niveles de riesgo y cambios que puedan requerir revisión.',

    'upload.step':
      'Cargar archivos',

    'upload.source.title':
      'Versión de origen',

    'upload.source.description':
      'Archivo de requisitos anterior para la comparación',

    'upload.target.title':
      'Versión de destino',

    'upload.target.description':
      'Nuevo archivo de requisitos para la comparación',

    'upload.drop.title':
      'Suelta el archivo Excel aquí',

    'upload.drop.subtitle':
      'o haz clic para elegir un archivo',

    'upload.source.remove':
      'Eliminar archivo de origen',

    'upload.target.remove':
      'Eliminar archivo de destino',

    'upload.settings.title':
      'Configuración del análisis',

    'upload.settings.description':
      'Opcionalmente, puedes asignar un nombre a esta comparación.',

    'upload.analysisName':
      'NOMBRE DEL ANÁLISIS',

    'upload.optional':
      'Opcional',

    'upload.placeholder':
      'Ej. v1.0 → v2.0 Análisis de activación',

    'upload.creator':
      'CREADO POR',

    'upload.ready.select':
      'Selecciona dos archivos Excel para continuar',

    'upload.ready.ready':
      'Ambos archivos están listos para la comparación',

    'upload.ready.analyzing':
      'ScopeDiff AI está analizando los requisitos...',

    'upload.button.start':
      'Iniciar comparación',

    'upload.button.analyzing':
      'Analizando...',

    'upload.error.xlsx':
      'Selecciona un archivo Excel con la extensión .xlsx.',

    'upload.error.profile':
      'Se requiere un perfil de usuario para iniciar el análisis.',

    'upload.error.comparison':
      'No se pudo completar la comparación.',
  },
}


export function isSupportedLanguage(
  value: string,
): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some(
    (language) =>
      language.code === value,
  )
}


export function parseLanguage(
  value: string,
): SupportedLanguage {
  if (
    isSupportedLanguage(
      value,
    )
  ) {
    return value
  }

  return 'tr'
}


export function getLanguageOption(
  language: SupportedLanguage,
): LanguageOption {
  return (
    SUPPORTED_LANGUAGES.find(
      (item) =>
        item.code === language,
    )
    ?? SUPPORTED_LANGUAGES[0]
  )
}
