import { Link } from 'react-router-dom'
import { Sun } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import UserSearch from './UserSearch'
import './Navbar.css'

function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" title="Ir al inicio">
          <span className="navbar-logo-icon-wrapper">
            <Sun size={28} className="navbar-logo-sun" />
          </span>
          <span>Lumina</span>
        </Link>

        <UserSearch />

        <div className="navbar-menu">
          <div className="navbar-user">
            <Link to="/profile" className="user-profile" title="Mi perfil">
              <div className="user-avatar">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="user-avatar-img" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <span className="user-name">{user?.name}</span>
            </Link>
            <button onClick={logout} className="btn-logout" title="Cerrar sesión">
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
