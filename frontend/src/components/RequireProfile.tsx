import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router'

import {
  useProfile,
} from '../context/ProfileContext'


function RequireProfile() {
  const {
    profile,
    authenticated,
  } = useProfile()

  const location =
    useLocation()


  if (!profile || !authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    )
  }


  return <Outlet />
}


export default RequireProfile
