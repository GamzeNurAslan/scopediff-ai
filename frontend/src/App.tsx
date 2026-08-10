import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'

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
          path="/dashboard"
          element={<DashboardPage />}
        />
      </Route>
    </Routes>
  )
}

export default App