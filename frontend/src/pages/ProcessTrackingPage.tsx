import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  History,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createWorkItem,
  deleteWorkItem,
  exportProcessExcel,
  getProcessSummary,
  getProcessItems,
  getWorkItemHistory,
  updateWorkItem,
} from '../services/processTrackingApi'

import type {
  CreateWorkItemInput,
  ProcessStage,
  ProcessTrackingSummary,
  WorkItem,
  WorkItemStageHistory,
} from '../types/processTracking'

import type {
  SupportedLanguage,
} from '../i18n/translations'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import { useProfile } from '../context/ProfileContext'

import './ProcessTrackingPage.css'


const STAGES: ProcessStage[] = [
  'TASARIM',
  'GELISTIRME',
  'TEST',
  'TESLIM_HAZIR',
  'TAMAMLANDI',
]


const STAGE_LABELS: Record<ProcessStage, { tr: string; en: string }> = {
  TASARIM: { tr: 'Tasarım', en: 'Design' },
  GELISTIRME: { tr: 'Geliştirme', en: 'Development' },
  TEST: { tr: 'Test', en: 'Test' },
  TESLIM_HAZIR: { tr: 'Teslim Hazır', en: 'Ready for delivery' },
  TAMAMLANDI: { tr: 'Tamamlandı', en: 'Completed' },
}


const COPY = {
  tr: {
    kicker: 'TAKIM LİDERİ VERİ GİRİŞİ',
    title: 'Süreç Takibi',
    description: 'Takım liderleri süreç kayıtlarını buradan ekler, ekip durumunu tek tabloda takip eder.',
    export: 'Excel İndir',
    exportPreparing: 'Excel hazırlanıyor...',
    newRecord: 'Yeni süreç kaydı',
    newRecordHint: 'Süreç bilgilerini girerek tabloya yeni bir kayıt ekleyin.',
    process: 'Süreç / İş',
    processPlaceholder: 'Örn. Yeni Aktivasyon Akışı',
    menu: 'Menü / Kategori',
    menuPlaceholder: 'Örn. Aktivasyon',
    module: 'Modül',
    modulePlaceholder: 'Örn. Yeni Başvuru',
    owner: 'Yazılımcı',
    ownerPlaceholder: 'Yazılımcı adı',
    analyst: 'Analist',
    analystPlaceholder: 'Analist adı',
    stage: 'Aşama',
    date: 'Hedef tarih',
    blocked: 'Blokeli olarak işaretle',
    notes: 'Not / Açıklama',
    notesPlaceholder: 'Takım lideri notu (isteğe bağlı)',
    add: 'Kaydı Ekle',
    adding: 'Kaydediliyor...',
    updating: 'Güncelleniyor...',
    editRecord: 'Süreç kaydını düzenle',
    cancelEdit: 'Düzenlemeyi iptal et',
    updated: 'Süreç kaydı güncellendi.',
    duplicate: 'Aynı süreç/iş adı ve tarihle kayıt zaten mevcut.',
    teamLeadOnly: 'Kayıt ekleme, düzenleme ve silme yetkisi yalnızca takım liderlerindedir.',
    summary: 'Genel görünüm',
    active: 'Aktif',
    testSummary: 'Testte',
    blockedSummary: 'Blokeli',
    overdueSummary: 'Geciken',
    stageSummary: 'Aşama dağılımı',
    history: 'Geçmiş',
    historyTitle: 'Aşama geçmişi',
    historyEmpty: 'Bu kayıt için henüz aşama değişikliği yok.',
    historyBy: 'değiştiren',
    readOnlyActions: 'Düzenleme ve silme yalnızca takım liderlerine açıktır.',
    records: 'Kayıt',
    tableTitle: 'Süreç kayıtları',
    search: 'Süreç, yazılımcı, analist veya modül ara...',
    allStages: 'Tüm Aşamalar',
    loading: 'Kayıtlar yükleniyor...',
    empty: 'Henüz süreç kaydı yok.',
    emptyHint: 'İlk kaydı yukarıdaki formdan ekleyebilirsiniz.',
    noMatch: 'Aramanızla eşleşen kayıt yok.',
    emptyValue: '—',
    delete: 'Kaydı sil',
    deleteConfirm: 'Bu süreç kaydı silinsin mi?',
    created: 'Süreç kaydı tabloya eklendi.',
    deleted: 'Süreç kaydı silindi.',
    error: 'İşlem sırasında bir hata oluştu.',
    required: 'Süreç / İş alanı zorunludur.',
    dateEmpty: 'Tarih yok',
    blockedShort: 'Blokeli',
  },
  en: {
    kicker: 'TEAM LEAD DATA ENTRY',
    title: 'Process Tracking',
    description: 'Team leads add process records here and track the team status in one table.',
    export: 'Download Excel',
    exportPreparing: 'Preparing Excel...',
    newRecord: 'New process record',
    newRecordHint: 'Enter the process details to add a new row to the table.',
    process: 'Process / Work',
    processPlaceholder: 'e.g. New Activation Flow',
    menu: 'Menu / Category',
    menuPlaceholder: 'e.g. Activation',
    module: 'Module',
    modulePlaceholder: 'e.g. New Application',
    owner: 'Developer',
    ownerPlaceholder: 'Developer name',
    analyst: 'Analyst',
    analystPlaceholder: 'Analyst name',
    stage: 'Stage',
    date: 'Target date',
    blocked: 'Mark as blocked',
    notes: 'Note / Description',
    notesPlaceholder: 'Optional team lead note',
    add: 'Add Record',
    adding: 'Saving...',
    updating: 'Updating...',
    editRecord: 'Edit process record',
    cancelEdit: 'Cancel editing',
    updated: 'Process record updated.',
    duplicate: 'A record with the same process/work name and date already exists.',
    teamLeadOnly: 'Only team leads can add, edit or delete records.',
    summary: 'Overview',
    active: 'Active',
    testSummary: 'In test',
    blockedSummary: 'Blocked',
    overdueSummary: 'Overdue',
    stageSummary: 'Stage distribution',
    history: 'History',
    historyTitle: 'Stage history',
    historyEmpty: 'No stage changes have been recorded for this item yet.',
    historyBy: 'changed by',
    readOnlyActions: 'Editing and deleting are available to team leads only.',
    records: 'Records',
    tableTitle: 'Process records',
    search: 'Search process, developer, analyst or module...',
    allStages: 'All Stages',
    loading: 'Loading records...',
    empty: 'No process records yet.',
    emptyHint: 'Add the first record from the form above.',
    noMatch: 'No records match your search.',
    emptyValue: '—',
    delete: 'Delete record',
    deleteConfirm: 'Delete this process record?',
    created: 'Process record added to the table.',
    deleted: 'Process record deleted.',
    error: 'Something went wrong.',
    required: 'Process / Work is required.',
    dateEmpty: 'No date',
    blockedShort: 'Blocked',
  },
} as const


type TextField =
  | 'title'
  | 'portal_menu'
  | 'module'
  | 'developer'
  | 'analyst'
  | 'due_date'
  | 'notes'


type FormState = Omit<CreateWorkItemInput, 'current_stage'> & {
  current_stage: ProcessStage
}


const EMPTY_FORM: FormState = {
  title: '',
  portal_menu: '',
  module: '',
  developer: '',
  analyst: '',
  due_date: '',
  current_stage: 'TASARIM',
  is_blocked: false,
  notes: '',
}


function stageLabel(
  stage: ProcessStage,
  language: SupportedLanguage,
): string {
  return language === 'tr'
    ? STAGE_LABELS[stage].tr
    : STAGE_LABELS[stage].en
}


function formatDate(
  value: string | null,
  language: SupportedLanguage,
  emptyLabel: string,
): string {
  if (!value) {
    return emptyLabel
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    language === 'tr' ? 'tr-TR' : 'en-US',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(date)
}


function roleKey(value: string | undefined): string {
  return (value ?? '')
    .replace(/[ıİ]/g, 'i')
    .replace(/[şŞ]/g, 's')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9]+/g, '')
}


function stageSummaryValue(
  summary: ProcessTrackingSummary,
  stage: ProcessStage,
): number {
  return {
    TASARIM: summary.design,
    GELISTIRME: summary.development,
    TEST: summary.test,
    TESLIM_HAZIR: summary.delivery_ready,
    TAMAMLANDI: summary.completed,
  }[stage]
}


function ProcessTrackingPage() {
  const { language } = useLanguage()
  const { profile } = useProfile()
  const copy = language === 'tr' ? COPY.tr : COPY.en

  const currentRoleKey = roleKey(profile?.role)
  const isTeamLead = Boolean(
    currentRoleKey.includes('takimlideri')
    || currentRoleKey.includes('yonetici')
    || currentRoleKey.includes('teamlead')
    || currentRoleKey.includes('manager'),
  )

  const actor = profile
    ? {
        // Turkish characters in HTTP headers can be folded differently by
        // local browsers/proxies; backend receives a stable canonical role.
        role: isTeamLead ? 'teamlead' : profile.role,
        userId: profile.userId,
        name: profile.fullName,
      }
    : undefined

  const [items, setItems] = useState<WorkItem[]>([])
  const [summary, setSummary] = useState<ProcessTrackingSummary | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [historyItemId, setHistoryItemId] = useState<number | null>(null)
  const [historyRows, setHistoryRows] = useState<WorkItemStageHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState<'all' | ProcessStage>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadItems() {
    try {
      setLoading(true)
      setError(null)
      const [nextItems, nextSummary] = await Promise.all([
        getProcessItems(),
        getProcessSummary(),
      ])
      setItems(nextItems)
      setSummary(nextSummary)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : copy.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [])

  function setTextField(field: TextField, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingItem(null)
  }

  function startEditing(item: WorkItem) {
    if (!isTeamLead) {
      setError(copy.readOnlyActions)
      return
    }

    setEditingItem(item)
    setForm({
      title: item.title,
      portal_menu: item.portal_menu ?? '',
      module: item.module ?? '',
      developer: item.developer ?? '',
      analyst: item.analyst ?? '',
      due_date: item.due_date ?? '',
      current_stage: item.current_stage,
      is_blocked: item.is_blocked,
      notes: item.notes ?? '',
    })
    setSuccess(null)
    setError(null)
    window.setTimeout(() => {
      document.querySelector('.pt-entry-card')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 0)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError(copy.required)
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const input: CreateWorkItemInput = {
        title: form.title.trim(),
        portal_menu: form.portal_menu?.trim() || undefined,
        module: form.module?.trim() || undefined,
        developer: form.developer?.trim() || undefined,
        analyst: form.analyst?.trim() || undefined,
        due_date: form.due_date || undefined,
        current_stage: form.current_stage,
        is_blocked: form.is_blocked,
        notes: form.notes?.trim() || undefined,
      }

      if (editingItem) {
        const updated = await updateWorkItem(editingItem.id, input, actor)
        setItems((current) => current.map((row) => row.id === updated.id ? updated : row))
        resetForm()
        setSuccess(copy.updated)
      } else {
        const created = await createWorkItem(input, actor)
        setItems((current) => [created, ...current])
        resetForm()
        setSuccess(copy.created)
      }
      const nextSummary = await getProcessSummary()
      setSummary(nextSummary)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : copy.error)
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    try {
      setExporting(true)
      setError(null)

      const blob = await exportProcessExcel({
        search: searchTerm,
        stage: stageFilter,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'surec-takibi.xlsx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : copy.error)
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete(item: WorkItem) {
    if (!isTeamLead) {
      setError(copy.readOnlyActions)
      return
    }

    if (!window.confirm(copy.deleteConfirm)) {
      return
    }

    try {
      setDeletingId(item.id)
      setError(null)
      await deleteWorkItem(item.id, actor)
      setItems((current) => current.filter((row) => row.id !== item.id))
      setSummary(await getProcessSummary())
      setSuccess(copy.deleted)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : copy.error)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleHistory(item: WorkItem) {
    if (historyItemId === item.id) {
      setHistoryItemId(null)
      return
    }

    try {
      setHistoryItemId(item.id)
      setHistoryLoading(true)
      setError(null)
      setHistoryRows(await getWorkItemHistory(item.id))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : copy.error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const filteredItems = useMemo(() => {
    const search = searchTerm.trim().toLocaleLowerCase('tr-TR')

    return items.filter((item) => {
      const searchable = [
        item.title,
        item.portal_menu,
        item.module,
        item.developer,
        item.analyst,
        item.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr-TR')

      return (
        (!search || searchable.includes(search))
        && (stageFilter === 'all' || item.current_stage === stageFilter)
      )
    })
  }, [items, searchTerm, stageFilter])

  const developerOptions = useMemo(
    () => Array.from(
      new Set(
        items
          .map((item) => item.developer)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right, 'tr-TR')),
    [items],
  )

  const analystOptions = useMemo(
    () => Array.from(
      new Set(
        items
          .map((item) => item.analyst)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((left, right) => left.localeCompare(right, 'tr-TR')),
    [items],
  )

  return (
    <div className="pt-page">
      <header className="pt-header">
        <div>
          <span className="pt-kicker">{copy.kicker}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>

        <button
          type="button"
          className="pt-export-button"
          onClick={() => void handleExport()}
          disabled={exporting || loading}
        >
          {exporting ? <Loader2 size={17} className="pt-spin" /> : <Download size={17} />}
          {exporting ? copy.exportPreparing : copy.export}
        </button>
      </header>

      {(error || success) && (
        <div className={`pt-message ${error ? 'error' : 'success'}`}>
          {error ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{error ?? success}</span>
          <button
            type="button"
            aria-label="Close message"
            onClick={() => {
              setError(null)
              setSuccess(null)
            }}
          >
            ×
          </button>
        </div>
      )}

      {summary && (
        <>
          <section className="pt-summary-strip" aria-label={copy.summary}>
            <div className="pt-summary-card">
              <span>{copy.records}</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="pt-summary-card pt-summary-active">
              <span>{copy.active}</span>
              <strong>{summary.active}</strong>
            </div>
            <div className="pt-summary-card pt-summary-test">
              <span>{copy.testSummary}</span>
              <strong>{summary.test}</strong>
            </div>
            <div className="pt-summary-card pt-summary-blocked">
              <span>{copy.blockedSummary}</span>
              <strong>{summary.blocked}</strong>
            </div>
            <div className="pt-summary-card pt-summary-overdue">
              <span>{copy.overdueSummary}</span>
              <strong>{summary.overdue}</strong>
            </div>
          </section>

          <section className="pt-stage-summary">
            <div className="pt-stage-summary-heading">
              <span className="pt-section-kicker">{copy.summary}</span>
              <h2>{copy.stageSummary}</h2>
            </div>
            <div className="pt-stage-bars">
              {STAGES.map((stage) => {
                const value = stageSummaryValue(summary, stage)
                const width = summary.total ? Math.max((value / summary.total) * 100, value ? 4 : 0) : 0
                return (
                  <div className="pt-stage-bar-row" key={stage}>
                    <span>{stageLabel(stage, language)}</span>
                    <div className="pt-stage-bar-track"><i style={{ width: `${width}%` }} /></div>
                    <strong>{value}</strong>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {!isTeamLead ? (
        <section className="pt-permission-card">
          <AlertTriangle size={17} />
          <span>{copy.teamLeadOnly}</span>
        </section>
      ) : (
      <section className="pt-entry-card">
        <div className="pt-section-heading">
          <div>
            <span className="pt-section-kicker">{copy.kicker}</span>
            <h2>{editingItem ? copy.editRecord : copy.newRecord}</h2>
            <p>{editingItem ? copy.newRecordHint : copy.newRecordHint}</p>
          </div>
          <div className="pt-entry-icon">{editingItem ? <Pencil size={17} /> : <Plus size={19} />}</div>
        </div>

        <form className="pt-entry-form" onSubmit={handleSubmit}>
          <label className="pt-field pt-field-wide">
            <span>{copy.process} *</span>
            <input
              value={form.title}
              placeholder={copy.processPlaceholder}
              onChange={(event) => setTextField('title', event.target.value)}
              disabled={saving}
              required
            />
          </label>

          <label className="pt-field">
            <span>{copy.menu}</span>
            <input
              value={form.portal_menu}
              placeholder={copy.menuPlaceholder}
              onChange={(event) => setTextField('portal_menu', event.target.value)}
              disabled={saving}
            />
          </label>

          <label className="pt-field">
            <span>{copy.module}</span>
            <input
              value={form.module}
              placeholder={copy.modulePlaceholder}
              onChange={(event) => setTextField('module', event.target.value)}
              disabled={saving}
            />
          </label>

          <label className="pt-field">
            <span>{copy.owner}</span>
            <input
              list="pt-developer-options"
              value={form.developer}
              placeholder={copy.ownerPlaceholder}
              onChange={(event) => setTextField('developer', event.target.value)}
              disabled={saving}
            />
          </label>

          <label className="pt-field">
            <span>{copy.analyst}</span>
            <input
              list="pt-analyst-options"
              value={form.analyst}
              placeholder={copy.analystPlaceholder}
              onChange={(event) => setTextField('analyst', event.target.value)}
              disabled={saving}
            />
          </label>

          <label className="pt-field">
            <span>{copy.stage}</span>
            <select
              value={form.current_stage}
              onChange={(event) => setForm((current) => ({
                ...current,
                current_stage: event.target.value as ProcessStage,
              }))}
              disabled={saving}
            >
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabel(stage, language)}
                </option>
              ))}
            </select>
          </label>

          <label className="pt-field">
            <span>{copy.date}</span>
            <div className="pt-input-with-icon">
              <CalendarDays size={15} />
              <input
                type="date"
                value={form.due_date}
                onChange={(event) => setTextField('due_date', event.target.value)}
                disabled={saving}
              />
            </div>
          </label>

          <label className="pt-field pt-field-notes">
            <span>{copy.notes}</span>
            <textarea
              value={form.notes}
              placeholder={copy.notesPlaceholder}
              onChange={(event) => setTextField('notes', event.target.value)}
              disabled={saving}
              rows={2}
            />
          </label>

          <label className="pt-checkbox">
            <input
              type="checkbox"
              checked={form.is_blocked}
              onChange={(event) => setForm((current) => ({
                ...current,
                is_blocked: event.target.checked,
              }))}
              disabled={saving}
            />
            <span>{copy.blocked}</span>
          </label>

          <div className="pt-form-actions">
            {editingItem && (
              <button className="pt-cancel-button" type="button" onClick={resetForm} disabled={saving}>
                <X size={15} />
                {copy.cancelEdit}
              </button>
            )}
            <button className="pt-add-button" type="submit" disabled={saving}>
              {saving ? <Loader2 size={16} className="pt-spin" /> : editingItem ? <Pencil size={16} /> : <Plus size={16} />}
              {saving ? (editingItem ? copy.updating : copy.adding) : editingItem ? copy.updated.replace('.', '') : copy.add}
            </button>
          </div>

          <datalist id="pt-developer-options">
            {developerOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>

          <datalist id="pt-analyst-options">
            {analystOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </form>
      </section>
      )}

      <section className="pt-table-card">
        <div className="pt-table-heading">
          <div>
            <span className="pt-section-kicker">{copy.kicker}</span>
            <h2>{copy.tableTitle}</h2>
          </div>
          <strong>{filteredItems.length} {copy.records}</strong>
        </div>

        <div className="pt-table-toolbar">
          <div className="pt-search">
            <Search size={16} />
            <input
              value={searchTerm}
              placeholder={copy.search}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value as 'all' | ProcessStage)}
          >
            <option value="all">{copy.allStages}</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>{stageLabel(stage, language)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="pt-state">
            <Loader2 size={22} className="pt-spin" />
            <span>{copy.loading}</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="pt-state">
            <strong>{searchTerm || stageFilter !== 'all' ? copy.noMatch : copy.empty}</strong>
            <span>{searchTerm || stageFilter !== 'all' ? copy.emptyHint : copy.emptyHint}</span>
          </div>
        ) : (
          <div className="pt-table-scroll">
            <table className="pt-table">
              <thead>
                <tr>
                  <th>{copy.process}</th>
                  <th>{copy.owner}</th>
                  <th>{copy.analyst}</th>
                  <th>{copy.stage}</th>
                  <th>{copy.date}</th>
                  <th>{copy.notes}</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="pt-title-cell">
                        <strong>{item.title}</strong>
                        <span>{item.portal_menu || item.module || copy.emptyValue}</span>
                        {item.is_blocked && <em>{copy.blockedShort}</em>}
                      </div>
                    </td>
                    <td>{item.developer || copy.emptyValue}</td>
                    <td>{item.analyst || copy.emptyValue}</td>
                    <td>
                      <span className={`pt-stage pt-stage-${item.current_stage.toLowerCase()}`}>
                        {stageLabel(item.current_stage, language)}
                      </span>
                    </td>
                    <td>{formatDate(item.due_date, language, copy.dateEmpty)}</td>
                    <td className="pt-notes-cell">{item.notes || copy.emptyValue}</td>
                    <td className="pt-actions-cell">
                      <button
                        type="button"
                        className="pt-action-button"
                        aria-label={copy.history}
                        title={copy.history}
                        onClick={() => void handleHistory(item)}
                      >
                        <History size={15} />
                      </button>
                      {isTeamLead && (
                        <>
                          <button
                            type="button"
                            className="pt-action-button"
                            aria-label={copy.editRecord}
                            title={copy.editRecord}
                            onClick={() => startEditing(item)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="pt-delete-button"
                            aria-label={copy.delete}
                            title={copy.delete}
                            disabled={deletingId === item.id}
                            onClick={() => void handleDelete(item)}
                          >
                            {deletingId === item.id ? <Loader2 size={15} className="pt-spin" /> : <Trash2 size={15} />}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {historyItemId !== null && (
          <div className="pt-history-panel">
            <div className="pt-history-heading">
              <div>
                <span className="pt-section-kicker">{copy.history}</span>
                <h3>{copy.historyTitle}</h3>
              </div>
              <button type="button" className="pt-action-button" onClick={() => setHistoryItemId(null)} aria-label={copy.cancelEdit}>
                <X size={15} />
              </button>
            </div>
            {historyLoading ? (
              <div className="pt-history-empty"><Loader2 size={16} className="pt-spin" /></div>
            ) : historyRows.length === 0 ? (
              <div className="pt-history-empty">{copy.historyEmpty}</div>
            ) : (
              <div className="pt-history-list">
                {historyRows.map((entry) => (
                  <div className="pt-history-row" key={entry.id}>
                    <span>{entry.from_stage ? stageLabel(entry.from_stage, language) : copy.newRecord} → {stageLabel(entry.to_stage, language)}</span>
                    <small>{formatDate(entry.created_at.slice(0, 10), language, copy.dateEmpty)} · {entry.changed_by_name || copy.historyBy}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}


export default ProcessTrackingPage
