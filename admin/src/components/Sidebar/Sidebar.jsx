import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Sidebar = () => {
  const { user } = useAuth()
  const sidebarItems = [
    { to: '/dashboard', icon: assets.order_icon, label: 'Dashboard', roles: ['admin'] },
    { to: '/add', icon: assets.add_icon, label: 'Add Items', roles: ['admin'] },
    { to: '/list', icon: assets.order_icon, label: 'List Items', roles: ['admin'] },
    { to: '/orders', icon: assets.order_icon, label: 'Orders', roles: ['admin'] },
    { to: '/users', icon: assets.order_icon, label: 'Users', roles: ['admin'] },
    { to: '/categories', icon: assets.order_icon, label: 'Categories', roles: ['admin'] },
    { to: '/coupons', icon: assets.order_icon, label: 'Coupons', roles: ['admin'] },
    { to: '/delivery', icon: assets.parcel_icon, label: 'Delivery', roles: ['admin'] },
    { to: '/notifications', icon: assets.order_icon, label: 'Notifications', roles: ['admin'] },
    { to: '/reports', icon: assets.order_icon, label: 'Reports', roles: ['admin'] },
  ]
  const visibleItems = sidebarItems.filter((item) => item.roles.includes(user?.role || ''))

  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="sidebar-option"
            title={item.label}
          >
            <img src={item.icon} alt={`${item.label} icon`} />
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
