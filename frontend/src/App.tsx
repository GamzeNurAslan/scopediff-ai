import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import RequireProfile from './components/RequireProfile'
import AppLayout from './layouts/AppLayout'

import ComparisonPage from './pages/ComparisonPage'
import DashboardPage from './pages/DashboardPage'
import DefectAnalysisPage from './pages/DefectAnalysisPage'
import HistoryPage from './pages/HistoryPage'
import LoginPage from './pages/LoginPage'
import ProcessTrackingPage from './pages/ProcessTrackingPage'
import TeamLeadPage from './pages/TeamLeadPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import ReportsPage from './pages/ReportsPage'
import UploadPage from './pages/UploadPage'

import {
  ProfileProvider,
} from './context/ProfileContext'

import {
  LanguageProvider,
} from './i18n/LanguageContext'


function App() {
  return (
    <LanguageProvider>

      <ProfileProvider>

        <Routes>

          <Route
            path="/login"
            element={
              <LoginPage />
            }
          />


          <Route
            path="/profile-setup"
            element={
              <ProfileSetupPage />
            }
          />


          <Route
            element={
              <RequireProfile />
            }
          >

            <Route
              element={
                <AppLayout />
              }
            >

              <Route
                index
                element={
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                }
              />


              <Route
                path="/upload"
                element={
                  <UploadPage />
                }
              />


              <Route
                path="/dashboard"
                element={
                  <DashboardPage />
                }
              />


              <Route
                path="/comparison"
                element={
                  <ComparisonPage />
                }
              />


              <Route
                path="/defects"
                element={
                  <DefectAnalysisPage />
                }
              />


              <Route
                path="/process-tracking"
                element={
                  <ProcessTrackingPage />
                }
              />


              <Route
                path="/team-lead"
                element={
                  <TeamLeadPage />
                }
              />


              <Route
                path="/history"
                element={
                  <HistoryPage />
                }
              />


              <Route
                path="/reports"
                element={
                  <ReportsPage />
                }
              />

            </Route>

          </Route>


          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </ProfileProvider>

    </LanguageProvider>
  )
}


export default App
