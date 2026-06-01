import { NavLink, Link } from 'react-router-dom'
import { useState } from 'react'

function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <Link to="/" className="brand">Duoc UC</Link>

        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Abrir menú">
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Inicio</NavLink>
          <NavLink to="/scanner" className={({isActive}) => isActive ? 'active' : ''}>Escáner</NavLink>
          <NavLink to="/help" className={({isActive}) => isActive ? 'active' : ''}>Ayuda</NavLink>
          <NavLink to="/roominfo" className={({isActive}) => isActive ? 'active' : ''}>Mapa</NavLink>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
