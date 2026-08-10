import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import './App.css'

import AppLayout from './layouts/AppLayout'
import ComparisonPage from './pages/ComparisonPage'
import DashboardPage from './pages/DashboardPage'
import DefectAnalysisPage from './pages/DefectAnalysisPage'
import HistoryPage from './pages/HistoryPage'
import ReportsPage from './pages/ReportsPage'
import UploadPage from './pages/UploadPage'


function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/upload"
          element={<UploadPage />}
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/comparison"
          element={<ComparisonPage />}
        />

        <Route
          path="/defects"
          element={<DefectAnalysisPage />}
        />

        <Route
          path="/history"
          element={<HistoryPage />}
        />

        <Route
          path="/reports"
          element={<ReportsPage />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Route>
    </Routes>
  )
}


export default App