import { useState } from 'react';
import './Navbar.fixed.css';

const Navbar = () => {
  // Estado para controlar si el menú móvil está abierto o cerrado
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>DuocUC</h2>
      </div>

      {/* Enlaces de navegación. En móvil cerramos el menú al hacer clic */}
      <ul className={`navbar-links ${isOpen ? 'active' : ''}`}>
        <li><a href="#inicio" onClick={() => setIsOpen(false)}>Inicio</a></li>
        <li><a href="#servicios" onClick={() => setIsOpen(false)}>Servicios</a></li>
        <li><a href="#acerca" onClick={() => setIsOpen(false)}>Acerca de</a></li>
        <li><a href="#contacto" onClick={() => setIsOpen(false)}>Contacto</a></li>
      </ul>

      {/* Botón de menú hamburguesa para móviles */}
      <div className="navbar-toggle" onClick={toggleMenu} aria-expanded={isOpen} aria-label="Toggle navigation">
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
    </nav>
  );
};

export default Navbar;