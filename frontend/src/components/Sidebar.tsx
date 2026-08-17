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
            <rect
              x="16"
              y="9.5"
              width="19"
              height="25"
              rx="9.5"
              fill="#c8b7e8"
              fillOpacity=".2"
              stroke="#c8b7e8"
              strokeOpacity=".9"
              strokeWidth="1.8"
            />
            <rect
              x="9"
              y="9.5"
              width="19"
              height="25"
              rx="9.5"
              fill="#f4b18e"
              fillOpacity=".25"
              stroke="#f4b18e"
              strokeOpacity=".98"
              strokeWidth="1.8"
            />
            <path
              d="M15 19.5h7M15 24h4.6"
              fill="none"
              stroke="#ffe1cf"
              strokeLinecap="round"
              strokeWidth="1.6"
              opacity=".88"
            />
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
