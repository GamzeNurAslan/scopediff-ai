import {
  Bell,
  ChevronDown,
  Loader2,
  LogOut,
  UserRound,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router'

import LanguageMenu from './LanguageMenu'

import ProfileAvatar, {
  PROFILE_AVATAR_OPTIONS,
} from './ProfileAvatar'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import {
  useProfile,
} from '../context/ProfileContext'

import type {
  SupportedLanguage,
} from '../i18n/translations'

import {
  getNotifications,
  markNotificationRead,
} from '../services/processTrackingApi'

import type {
  Notification,
} from '../types/notifications'


interface RouteMeta {
  eyebrow: string
  title: string
  description: string
}


const routeMetadata:
Record<string, RouteMeta> = {
  '/upload': {
    eyebrow:
      'route.upload.eyebrow',

    title:
      'route.upload.title',

    description:
      'route.upload.description',
  },

  '/dashboard': {
    eyebrow:
      'route.dashboard.eyebrow',

    title:
      'route.dashboard.title',

    description:
      'route.dashboard.description',
  },

  '/comparison': {
    eyebrow:
      'route.comparison.eyebrow',

    title:
      'route.comparison.title',

    description:
      'route.comparison.description',
  },

  '/defects': {
    eyebrow:
      'route.defects.eyebrow',

    title:
      'route.defects.title',

    description:
      'route.defects.description',
  },

  '/process-tracking': {
    eyebrow:
      'route.processTracking.eyebrow',

    title:
      'route.processTracking.title',

    description:
      'route.processTracking.description',
  },

  '/team-lead': {
    eyebrow:
      'route.teamLead.eyebrow',

    title:
      'route.teamLead.title',

    description:
      'route.teamLead.description',
  },

  '/history': {
    eyebrow:
      'route.history.eyebrow',

    title:
      'route.history.title',

    description:
      'route.history.description',
  },

  '/reports': {
    eyebrow:
      'route.reports.eyebrow',

    title:
      'route.reports.title',

    description:
      'route.reports.description',
  },
}


function getInitials(
  fullName: string,
): string {
  const parts =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (
    parts.length === 0
  ) {
    return 'SD'
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(
        0,
        2,
      )
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


type ProfileValueKind =
  | 'department'
  | 'role'


const profileValueTranslations:
Record<
  ProfileValueKind,
  Record<
    string,
    Record<SupportedLanguage, string>
  >
> = {
  department: {
    'çözüm geliştirme': {
      tr: 'Çözüm Geliştirme',
      en: 'Solution Development',
      de: 'Lösungsentwicklung',
      fr: 'Développement de solutions',
      es: 'Desarrollo de soluciones',
    },
  },

  role: {
    kullanıcı: {
      tr: 'Kullanıcı',
      en: 'Team Member',
      de: 'Benutzer',
      fr: 'Utilisateur',
      es: 'Usuario',
    },
    stajyer: {
      tr: 'Stajyer',
      en: 'Intern',
      de: 'Praktikant',
      fr: 'Stagiaire',
      es: 'Pasante',
    },
    'yazılım geliştirici': {
      tr: 'Yazılım Geliştirici',
      en: 'Software Developer',
      de: 'Softwareentwickler',
      fr: 'Développeur logiciel',
      es: 'Desarrollador de software',
    },
    'veri bilimci / ml mühendisi': {
      tr: 'Veri Bilimci / ML Mühendisi',
      en: 'Data Scientist / ML Engineer',
      de: 'Data Scientist / ML-Ingenieur',
      fr: 'Data Scientist / Ingénieur ML',
      es: 'Científico de datos / Ingeniero ML',
    },
    'iş analisti': {
      tr: 'İş Analisti',
      en: 'Business Analyst',
      de: 'Business-Analyst',
      fr: 'Analyste métier',
      es: 'Analista de negocio',
    },
    'qa / test mühendisi': {
      tr: 'QA / Test Mühendisi',
      en: 'QA / Test Engineer',
      de: 'QA- / Testingenieur',
      fr: 'Ingénieur QA / Test',
      es: 'Ingeniero QA / Pruebas',
    },
    'ürün yöneticisi': {
      tr: 'Ürün Yöneticisi',
      en: 'Product Manager',
      de: 'Produktmanager',
      fr: 'Chef de produit',
      es: 'Gerente de producto',
    },
    'proje yöneticisi': {
      tr: 'Proje Yöneticisi',
      en: 'Project Manager',
      de: 'Projektmanager',
      fr: 'Chef de projet',
      es: 'Gerente de proyectos',
    },
    'devops / sistem mühendisi': {
      tr: 'DevOps / Sistem Mühendisi',
      en: 'DevOps / Systems Engineer',
      de: 'DevOps- / Systemingenieur',
      fr: 'Ingénieur DevOps / Systèmes',
      es: 'Ingeniero DevOps / Sistemas',
    },
    reviewer: {
      tr: 'Reviewer',
      en: 'Reviewer',
      de: 'Reviewer',
      fr: 'Reviewer',
      es: 'Revisor',
    },
    tester: {
      tr: 'Tester',
      en: 'Tester',
      de: 'Tester',
      fr: 'Testeur',
      es: 'Probador',
    },
    'takım lideri': {
      tr: 'Takım Lideri',
      en: 'Team Lead',
      de: 'Teamleiter',
      fr: "Chef d'équipe",
      es: 'Líder de equipo',
    },
    yönetici: {
      tr: 'Yönetici',
      en: 'Manager',
      de: 'Manager',
      fr: 'Responsable',
      es: 'Gerente',
    },
    diğer: {
      tr: 'Diğer',
      en: 'Other',
      de: 'Andere',
      fr: 'Autre',
      es: 'Otro',
    },
  },
}


export function localizeProfileValue(
  value: string,
  kind: ProfileValueKind,
  language: SupportedLanguage,
): string {
  const key = value.trim().toLocaleLowerCase('tr-TR')

  if (
    kind === 'role'
    && (
      key === 'kullan\u0131c\u0131'
      || key === 'team member'
      || key.includes('ekip')
    )
  ) {
    return ({
      tr: 'Ekip \u00DCyesi',
      en: 'Team Member',
      de: 'Teammitglied',
      fr: 'Membre de l\u2019equipe',
      es: 'Miembro del equipo',
    } as Record<SupportedLanguage, string>)[language]
  }

  return (
    profileValueTranslations[kind][key]?.[language]
    ?? value
  )
}


function Topbar() {
  const location =
    useLocation()
  const navigate = useNavigate()


  const {
    t,
    language,
  } = useLanguage()


  const {
    profile,
    saveProfile,
    clearProfile,
  } = useProfile()


  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false)

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false)

  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([])

  const [
    notificationLoading,
    setNotificationLoading,
  ] = useState(false)


  const profileRef =
    useRef<
      HTMLDivElement | null
    >(null)


  const routeMeta =
    routeMetadata[
      location.pathname
    ]
    ?? {
      eyebrow:
        'route.dashboard.eyebrow',

      title:
        'route.dashboard.title',

      description:
        'route.dashboard.description',
    }


  const localizedDepartment = profile
    ? localizeProfileValue(
        profile.department,
        'department',
        language,
      )
    : ''


  const localizedRole = profile
    ? localizeProfileValue(
        profile.role,
        'role',
        language,
      )
    : ''


  function handleAvatarChange(
    avatarId: string,
  ) {
    if (!profile) {
      return
    }

    saveProfile({
      ...profile,
      avatarId,
    })
  }


  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      const target =
        event.target

      if (
        !(target instanceof Node)
      ) {
        return
      }

      if (
        profileRef.current
        && !profileRef
          .current
          .contains(
            target,
          )
      ) {
        setProfileOpen(
          false,
        )
      }
    }


    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )


    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])


  useEffect(() => {
    setProfileOpen(
      false,
    )
  }, [
    location.pathname,
  ])


  useEffect(() => {
    let cancelled = false

    async function loadNotifications() {
      if (!profile?.fullName) {
        setNotifications([])
        return
      }

      try {
        setNotificationLoading(true)
        const nextNotifications = await getNotifications(profile.fullName)
        if (!cancelled) {
          setNotifications(nextNotifications)
        }
      } catch {
        // Bildirimler yardımcı bir özellik; ana ekranı bu hata için durdurma.
      } finally {
        if (!cancelled) {
          setNotificationLoading(false)
        }
      }
    }

    void loadNotifications()
    const timer = window.setInterval(() => void loadNotifications(), 30000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [profile?.fullName])


  async function handleNotificationClick(notification: Notification) {
    if (!profile) {
      return
    }

    try {
      if (!notification.is_read) {
        await markNotificationRead(notification.id, profile.fullName)
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, is_read: true } : item
        )))
      }
    } catch {
      // Navigasyon yine de devam edebilir.
    }

    setNotificationOpen(false)
    if (notification.work_item_id) {
      navigate('/process-tracking')
    }
  }


  return (
    <header className="sd-topbar">

      <div className="sd-topbar-heading">

        <span className="sd-topbar-eyebrow">
          {
            t(
              routeMeta.eyebrow,
            )
          }
        </span>


        <div className="sd-topbar-title-row">

          <h1>
            {
              t(
                routeMeta.title,
              )
            }
          </h1>


          <span className="sd-topbar-separator" />


          <p>
            {
              t(
                routeMeta.description,
              )
            }
          </p>

        </div>

      </div>


      <div className="sd-topbar-actions">

        <LanguageMenu />


        {profile && (
          <div className="sd-notifications">
            <button
              type="button"
              className={notificationOpen ? 'sd-notification-trigger open' : 'sd-notification-trigger'}
              aria-label={language === 'tr' ? 'Bildirimler' : 'Notifications'}
              onClick={() => setNotificationOpen((current) => !current)}
            >
              {notificationLoading ? <Loader2 size={16} className="sd-notification-spin" /> : <Bell size={17} />}
              {notifications.some((notification) => !notification.is_read) && <span className="sd-notification-dot" />}
            </button>

            {notificationOpen && (
              <div className="sd-notification-popover">
                <div className="sd-notification-head">
                  <strong>{language === 'tr' ? 'Bildirimler' : 'Notifications'}</strong>
                  <span>{notifications.filter((notification) => !notification.is_read).length}</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="sd-notification-empty">
                    {language === 'tr' ? 'Yeni bildirimin yok.' : 'You have no new notifications.'}
                  </div>
                ) : (
                  <div className="sd-notification-list">
                    {notifications.slice(0, 8).map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        className={notification.is_read ? 'sd-notification-item read' : 'sd-notification-item'}
                        onClick={() => void handleNotificationClick(notification)}
                      >
                        <span className="sd-notification-icon"><Bell size={14} /></span>
                        <span>
                          <strong>{notification.title}</strong>
                          <small>{notification.message}</small>
                        </span>
                        {!notification.is_read && <i />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {
          profile
            ? (
              <div
                className="sd-profile"
                ref={profileRef}
              >

                <button
                  type="button"
                  className={
                    profileOpen
                      ? 'sd-profile-trigger open'
                      : 'sd-profile-trigger'
                  }
                  onClick={
                    () =>
                      setProfileOpen(
                        (current) =>
                          !current,
                      )
                  }
                >

                  <ProfileAvatar
                    avatarId={profile.avatarId}
                    initials={getInitials(profile.fullName)}
                    className="sd-profile-avatar"
                  />


                  <span className="sd-profile-summary">

                    <strong>
                      {
                        profile.fullName
                      }
                    </strong>

                    <small>
                      {
                        `${localizedDepartment} · ${localizedRole}`
                      }
                    </small>

                  </span>


                  <ChevronDown
                    size={15}
                    className="sd-profile-chevron"
                  />

                </button>


                {
                  profileOpen
                  && (
                    <div className="sd-profile-popover">

                      <div className="sd-profile-popover-head">

                        <ProfileAvatar
                          avatarId={profile.avatarId}
                          initials={getInitials(profile.fullName)}
                          className="sd-profile-large-avatar"
                        />


                        <div>

                          <strong>
                            {
                              profile.fullName
                            }
                          </strong>

                          <span>
                            {
                              profile.corporateEmail
                            }
                          </span>

                        </div>

                      </div>


                      <div className="sd-profile-avatar-picker">

                        <span>
                          {
                            t(
                              'profile.chooseAvatar',
                            )
                          }
                        </span>

                        <div className="sd-profile-avatar-options">

                          {
                            PROFILE_AVATAR_OPTIONS.map(
                              ({
                                id,
                                label,
                                icon: Icon,
                              }) => (
                                <button
                                  key={id}
                                  type="button"
                                  className={
                                    profile.avatarId === id
                                      ? `sd-profile-avatar-option selected ${id}`
                                      : `sd-profile-avatar-option ${id}`
                                  }
                                  aria-label={`${label} avatarını seç`}
                                  aria-pressed={profile.avatarId === id}
                                  onClick={() => handleAvatarChange(id)}
                                >
                                  <Icon
                                    size={14}
                                    strokeWidth={2.3}
                                  />
                                </button>
                              ),
                            )
                          }

                        </div>

                      </div>


                      <div className="sd-profile-info">

                        <div>

                          <span>
                            {
                              t(
                                'profile.department',
                              )
                            }
                          </span>

                          <strong>
                            {localizedDepartment}
                          </strong>

                        </div>


                        <div>

                          <span>
                            {
                              t(
                                'profile.role',
                              )
                            }
                          </span>

                          <strong>
                            {localizedRole}
                          </strong>

                        </div>

                      </div>

                      <button
                        type="button"
                        className="sd-profile-logout"
                        onClick={clearProfile}
                      >
                        <LogOut size={14} />
                        {language === 'tr' ? 'Çıkış yap' : 'Sign out'}
                      </button>

                    </div>
                  )
                }

              </div>
            )

            : (
              <div className="sd-profile-empty">

                <UserRound
                  size={15}
                />

                {
                  t(
                    'profile.profile',
                  )
                }

              </div>
            )
        }

      </div>

    </header>
  )
}


export default Topbar
