"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <div className="loading">Chargement...</div>
  }

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  return children
}

export default ProtectedRoute
