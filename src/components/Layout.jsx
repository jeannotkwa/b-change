"use client"

import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  FaHome,
  FaCashRegister,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCoins,
  FaPlus,
} from "react-icons/fa"

const Layout = ({ children, title }) => {
  const { currentUser, logout, isAdmin, isAdminOrSupervisor } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path ? "active" : ""
  }

  return (
    <div className="layout">
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Bureau de Change</h2>
          <button className="close-sidebar" onClick={closeSidebar}>
            <FaTimes />
          </button>
        </div>
        <div className="user-info">
          <div className="user-avatar">{currentUser?.fullName?.charAt(0) || currentUser?.username?.charAt(0)}</div>
          <div className="user-details">
            <p className="user-name">{currentUser?.fullName || currentUser?.username}</p>
            <p className="user-role">{currentUser?.role}</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={isActive("/")} onClick={closeSidebar}>
            <FaHome /> Tableau de bord
          </Link>
          <Link to="/cash-register" className={isActive("/cash-register")} onClick={closeSidebar}>
            <FaCashRegister /> Caisse
          </Link>
          <Link to="/transactions" className={isActive("/transactions")} onClick={closeSidebar}>
            <FaExchangeAlt /> Transactions
          </Link>
          <Link to="/new-transaction" className={isActive("/new-transaction")} onClick={closeSidebar}>
            <FaPlus /> Nouvelle Transaction
          </Link>
          <Link to="/supply" className={isActive("/supply")} onClick={closeSidebar}>
            <FaMoneyBillWave /> Approvisionnement
          </Link>
          <Link to="/currencies" className={isActive("/currencies")} onClick={closeSidebar}>
            <FaCoins /> Devises
          </Link>
          {isAdmin() && (
            <Link to="/users" className={isActive("/users")} onClick={closeSidebar}>
              <FaUsers /> Utilisateurs
            </Link>
          )}
          {isAdminOrSupervisor() && (
            <Link to="/reports" className={isActive("/reports")} onClick={closeSidebar}>
              <FaChartBar /> Rapports
            </Link>
          )}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Déconnexion
          </button>
        </div>
      </div>

      <div className="main-content">
        <header className="header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <h1>{title}</h1>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}

export default Layout
