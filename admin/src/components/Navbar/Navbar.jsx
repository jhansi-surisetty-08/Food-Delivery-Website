import React from 'react'
import './Navbar.css'
import { assets } from './../../assets/assets';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getAvatarOption } from '../../utils/avatarOptions';

const Navbar = () => {
  const { theme, toggleTheme } = React.useContext(ThemeContext);
  const { user, logout } = useAuth();
  const currentAvatar = getAvatarOption(user?.avatar);

  return (
    <div className='navbar'>
        <img className='logo' src={assets.logo} alt="" />
        <div className="navbar-right">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            type="button"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {theme === 'light' ? 'Light' : 'Dark'}
          </button>
          <div className="admin-profile-copy">
            <p>{user?.name || 'Admin'}</p>
            <span>{user?.role || 'admin'}</span>
          </div>
          <button
            className="logout-button"
            onClick={() => logout("You have been logged out.")}
            type="button"
          >
            Logout
          </button>
          <div
            className="profile profile-avatar"
            style={{ background: currentAvatar.gradient }}
            aria-hidden="true"
          >
            <span>{currentAvatar.emoji}</span>
          </div>
        </div>
    </div>
  )
}

export default Navbar
