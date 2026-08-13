import {
  BarChart3,
  Bug,
  FileSpreadsheet,
  GitCompareArrows,
  History,
  Upload,
  UsersRound,
  Workflow,
} from 'lucide-react'

import {
  NavLink,
} from 'react-router'

import {
  useLanguage,
} from '../i18n/LanguageContext'

import {
  useProfile,
} from '../context/ProfileContext'


interface NavigationItem {
  labelKey: string
  path: string
  icon: typeof Upload
  teamLeadOnly?: boolean
}


const navigationItems:
NavigationItem[] = [
  {
    labelKey:
      'navigation.upload',

    path:
      '/upload',

    icon:
      Upload,
  },

  {
    labelKey:
      'navigation.dashboard',

    path:
      '/dashboard',

    icon:
      BarChart3,
  },

  {
    labelKey:
      'navigation.comparison',

    path:
      '/comparison',

    icon:
      GitCompareArrows,
  },

  {
    labelKey:
      'navigation.defects',

    path:
      '/defects',

    icon:
      Bug,
  },

  {
    labelKey:
      'navigation.processTracking',

    path:
      '/process-tracking',

    icon:
      Workflow,
  },

  {
    labelKey:
      'navigation.teamLead',

    path:
      '/team-lead',

    icon:
      UsersRound,

    teamLeadOnly: true,
  },

  {
    labelKey:
      'navigation.history',

    path:
      '/history',

    icon:
      History,
  },

  {
    labelKey:
      'navigation.reports',

    path:
      '/reports',

    icon:
      FileSpreadsheet,
  },
]


function Sidebar() {
  const {
    t,
  } = useLanguage()

  const { profile } = useProfile()
  const role = (profile?.role ?? '')
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
  const isTeamLead = role.includes('takimlideri') || role.includes('yonetici') || role.includes('teamlead') || role.includes('manager')


  return (
    <aside className="sd-sidebar">

      <div className="sd-sidebar-brand">

        <div className="sd-brand-symbol">

          <svg
            className="sd-brand-logo"
            viewBox="0 0 44 44"
            role="img"
            aria-label="ScopeDiff"
          >
            <defs>
              <linearGradient
                id="scope-diff-logo-line"
                x1="6"
                y1="7"
                x2="38"
                y2="37"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#ff9a3d" />
                <stop offset="0.52" stopColor="#ffd166" />
                <stop offset="1" stopColor="#a88cff" />
              </linearGradient>
            </defs>

            <circle cx="22" cy="22" r="15.5" fill="none" stroke="url(#scope-diff-logo-line)" strokeWidth="2.2" />
            <text x="22" y="26" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11.5" fontWeight="800" letterSpacing="-0.8" fill="currentColor">SD</text>
            <circle cx="8" cy="22" r="2.6" fill="#ff7900" />
            <circle cx="36" cy="22" r="2.6" fill="#a88cff" />
          </svg>

        </div>


        <div className="sd-brand-copy">

          <strong>
            ScopeDiff
          </strong>

          <span>
            {
              t(
                'brand.subtitle',
              )
            }
          </span>

        </div>

      </div>


      <nav className="sd-sidebar-nav">

        <span className="sd-nav-label">
          {
            t(
              'navigation.workspace',
            )
          }
        </span>


        <div className="sd-nav-list">

          {
            navigationItems.filter((item) => !item.teamLeadOnly || isTeamLead).map(
              ({
                labelKey,
                path,
                icon: Icon,
              }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={
                    ({
                      isActive,
                    }) =>
                      isActive
                        ? 'sd-nav-item active'
                        : 'sd-nav-item'
                  }
                >

                  <span className="sd-nav-icon">

                    <Icon
                      size={17}
                      strokeWidth={1.8}
                    />

                  </span>

                  <span className="sd-nav-text">
                    {
                      t(
                        labelKey,
                      )
                    }
                  </span>

                  <span className="sd-active-marker" />

                </NavLink>
              ),
            )
          }

        </div>

      </nav>


      <div className="sd-sidebar-insight">

        <div>

          <span>
            {
              t(
                'traceability.label',
              )
            }
          </span>

          <strong>
            {
              t(
                'traceability.message',
              )
            }
          </strong>

        </div>

      </div>


      <footer className="sd-sidebar-footer">

        <strong>
          etiya
        </strong>

        <span>
          ScopeDiff
        </span>

      </footer>

    </aside>
  )
}


export default Sidebar
