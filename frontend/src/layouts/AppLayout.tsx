import { Outlet } from 'react-router'

import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

import '../App.css'

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <Topbar />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout