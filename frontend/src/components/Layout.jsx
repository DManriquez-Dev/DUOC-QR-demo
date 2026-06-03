import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

function Layout() {
  return (
    <div className="app-root">
      <Navbar />
      <div className="content-wrapper">
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
