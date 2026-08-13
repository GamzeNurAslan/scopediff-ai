import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ClipboardPlus,
  Loader2,
  Users,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import {
  useProfile,
} from '../context/ProfileContext'

import {
  getNotifications,
  getProcessItems,
  getProcessSummary,
} from '../services/processTrackingApi'

import type {
  ProcessTrackingSummary,
  WorkItem,
} from '../types/processTracking'

import type {
  Notification,
} from '../types/notifications'

import './TeamLeadPage.css'


const COPY = {
  tr: {
    kicker: 'TAKIM LİDERİ PANELİ',
    title: 'Ekip görünümü',
    description: 'Ekibin iş yükünü, geciken kayıtları ve son bildirimleri tek ekrandan takip edin.',
    newRecord: 'Yeni süreç kaydı',
    openTracking: 'Süreç takibini aç',
    total: 'Toplam kayıt',
    active: 'Aktif',
    blocked: 'Blokeli',
    overdue: 'Geciken',
    workload: 'Ekip iş yükü',
    assigned: 'atanmış kayıt',
    attention: 'Dikkat gerektiren kayıtlar',
    notifications: 'Son bildirimler',
    noAttention: 'Şu anda dikkat gerektiren kayıt yok.',
    noNotifications: 'Yeni bildirim yok.',
    noAssignee: 'Atanmamış',
    stage: 'Aşama',
    date: 'Hedef tarih',
    loading: 'Panel yükleniyor...',
    error: 'Panel verileri yüklenemedi.',
    onlyTeamLead: 'Bu panel yalnızca takım liderleri içindir.',
  },
  en: {
    kicker: 'TEAM LEAD PANEL',
    title: 'Team overview',
    description: 'Track team workload, overdue records and recent notifications from one screen.',
    newRecord: 'New process record',
    openTracking: 'Open process tracking',
    total: 'Total records',
    active: 'Active',
    blocked: 'Blocked',
    overdue: 'Overdue',
    workload: 'Team workload',
    assigned: 'assigned records',
    attention: 'Records needing attention',
    notifications: 'Recent notifications',
    noAttention: 'There are no records needing attention.',
    noNotifications: 'No new notifications.',
    noAssignee: 'Unassigned',
    stage: 'Stage',
    date: 'Due date',
    loading: 'Loading panel...',
    error: 'Panel data could not be loaded.',
    onlyTeamLead: 'This panel is for team leads only.',
  },
} as const


function normalizedRole(value: string | undefined): string {
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


function formatDate(value: string | null, language: string): string {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}


function TeamLeadPage() {
  const { language } = useLanguage()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const copy = language === 'tr' ? COPY.tr : COPY.en
  const isTeamLead = ['takimlideri', 'yonetici', 'teamlead', 'manager']
    .some((role) => normalizedRole(profile?.role).includes(role))

  const [summary, setSummary] = useState<ProcessTrackingSummary | null>(null)
  const [items, setItems] = useState<WorkItem[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPanel() {
      if (!isTeamLead || !profile) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [nextSummary, nextItems, nextNotifications] = await Promise.all([
          getProcessSummary(),
          getProcessItems(),
          getNotifications(profile.fullName),
        ])
        if (!cancelled) {
          setSummary(nextSummary)
          setItems(nextItems)
          setNotifications(nextNotifications)
        }
      } catch {
        if (!cancelled) setError(copy.error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPanel()
    return () => { cancelled = true }
  }, [copy.error, isTeamLead, profile])

  const attentionItems = useMemo(
    () => items.filter((item) => item.is_blocked || item.is_overdue).slice(0, 7),
    [items],
  )

  const workload = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach((item) => {
      const names = [item.developer, item.analyst].filter(Boolean) as string[]
      names.forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1))
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [items])

  if (!isTeamLead) {
    return <div className="tl-page"><div className="tl-access-card"><AlertTriangle size={19} /><span>{copy.onlyTeamLead}</span></div></div>
  }

  return (
    <div className="tl-page">
      <header className="tl-header">
        <div>
          <span className="tl-kicker">{copy.kicker}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="tl-header-actions">
          <button type="button" className="tl-secondary-button" onClick={() => navigate('/process-tracking')}>
            {copy.openTracking}<ArrowRight size={15} />
          </button>
          <button type="button" className="tl-primary-button" onClick={() => navigate('/process-tracking?new=1')}>
            <ClipboardPlus size={16} />{copy.newRecord}
          </button>
        </div>
      </header>

      {error && <div className="tl-error"><AlertTriangle size={16} />{error}</div>}

      {loading ? (
        <div className="tl-loading"><Loader2 size={22} className="tl-spin" />{copy.loading}</div>
      ) : summary && (
        <>
          <section className="tl-stat-grid">
            <div className="tl-stat"><span>{copy.total}</span><strong>{summary.total}</strong></div>
            <div className="tl-stat blue"><span>{copy.active}</span><strong>{summary.active}</strong></div>
            <div className="tl-stat red"><span>{copy.blocked}</span><strong>{summary.blocked}</strong></div>
            <div className="tl-stat orange"><span>{copy.overdue}</span><strong>{summary.overdue}</strong></div>
          </section>

          <div className="tl-content-grid">
            <section className="tl-card">
              <div className="tl-card-heading"><div><span className="tl-section-kicker">{copy.attention}</span><h2>{copy.attention}</h2></div><AlertTriangle size={18} /></div>
              {attentionItems.length === 0 ? <div className="tl-empty">{copy.noAttention}</div> : (
                <div className="tl-attention-list">
                  {attentionItems.map((item) => (
                    <button type="button" className="tl-attention-row" key={item.id} onClick={() => navigate('/process-tracking')}>
                      <span><strong>{item.title}</strong><small>{item.developer || item.analyst || copy.noAssignee}</small></span>
                      <span className={item.is_blocked ? 'tl-badge red' : 'tl-badge orange'}>{item.is_blocked ? copy.blocked : copy.overdue}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="tl-card">
              <div className="tl-card-heading"><div><span className="tl-section-kicker">{copy.workload}</span><h2>{copy.workload}</h2></div><Users size={18} /></div>
              {workload.length === 0 ? <div className="tl-empty">{copy.noAssignee}</div> : (
                <div className="tl-workload-list">
                  {workload.map(([name, count]) => <div className="tl-workload-row" key={name}><span>{name}</span><div><i style={{ width: `${Math.min(100, (count / Math.max(workload[0][1], 1)) * 100)}%` }} /></div><strong>{count}</strong><small>{copy.assigned}</small></div>)}
                </div>
              )}
            </section>
          </div>

          <section className="tl-card">
            <div className="tl-card-heading"><div><span className="tl-section-kicker">{copy.notifications}</span><h2>{copy.notifications}</h2></div><Bell size={18} /></div>
            {notifications.length === 0 ? <div className="tl-empty">{copy.noNotifications}</div> : (
              <div className="tl-notification-list">
                {notifications.slice(0, 6).map((notification) => <div className="tl-notification-row" key={notification.id}><span className="tl-notification-dot" /><div><strong>{notification.title}</strong><p>{notification.message}</p></div><small>{formatDate(notification.created_at, language)}</small></div>)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}


export default TeamLeadPage
