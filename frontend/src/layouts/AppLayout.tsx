import {
  Outlet,
} from 'react-router'

import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

import PageLanguageBridge from '../i18n/PageLanguageBridge'

import './AppLayout.css'


function AppLayout() {
  return (
    <div className="app-layout">

      <Sidebar />


      <div className="app-main">

        <Topbar />


        <main className="page-content">

          <PageLanguageBridge />

          <Outlet />

        </main>

      </div>

    </div>
  )
}


export default AppLayout