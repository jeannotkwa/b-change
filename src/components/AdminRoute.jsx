"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth()

  if (loading) {
    return <div className="loading">Chargement...</div>
  }

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (!isAdmin()) {
    return <Navigate to="/" />
  }

  return children
}

export default AdminRoute
