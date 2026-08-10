import {
  Bug,
  FileSpreadsheet,
  GitCompare,
  History,
  LayoutDashboard,
  Upload,
} from 'lucide-react'
import { NavLink } from 'react-router'

const menuItems = [
  {
    label: 'Yükleme',
    path: '/upload',
    icon: Upload,
  },
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Karşılaştırma',
    path: '/comparison',
    icon: GitCompare,
  },
  {
    label: 'Defect Analizi',
    path: '/defects',
    icon: Bug,
  },
  {
    label: 'Geçmiş',
    path: '/history',
    icon: History,
  },
  {
    label: 'Raporlar',
    path: '/reports',
    icon: FileSpreadsheet,
  },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">S</div>

        <div>
          <strong>ScopeDiff AI</strong>
          <span>Requirement Intelligence</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-title">
          ANALİZ PLATFORMU
        </span>

        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <Icon size={19} />

              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <span>ScopeDiff AI</span>
        <small>v0.1.0</small>
      </div>
    </aside>
  )
}

export default Sidebar