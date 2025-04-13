"use client"

import { createContext, useState, useEffect, useContext } from "react"
import { toast } from "react-toastify"
import api from "../services/api"
import jwtDecode from "jwt-decode"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token") || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token")
      if (storedToken) {
        try {
          // Verify token is valid
          const decoded = jwtDecode(storedToken)
          const currentTime = Date.now() / 1000

          if (decoded.exp < currentTime) {
            // Token expired
            logout()
          } else {
            // Set token in axios headers
            api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
            setToken(storedToken)
            setCurrentUser({
              id: decoded.id,
              username: decoded.username,
              role: decoded.role,
              fullName: decoded.fullName || decoded.username,
            })
          }
        } catch (error) {
          console.error("Invalid token", error)
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.post("/api/auth", { username, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setToken(token)
      setCurrentUser(user)

      toast.success("Connexion réussie")
      return true
    } catch (error) {
      console.error("Login error:", error)
      const message = error.response?.data?.error || "Erreur de connexion"
      toast.error(message)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete api.defaults.headers.common["Authorization"]
    setToken(null)
    setCurrentUser(null)
  }

  const isAdmin = () => {
    return currentUser?.role === "admin"
  }

  const isSupervisor = () => {
    return currentUser?.role === "supervisor"
  }

  const isAdminOrSupervisor = () => {
    return isAdmin() || isSupervisor()
  }

  const value = {
    currentUser,
    token,
    loading,
    login,
    logout,
    isAdmin,
    isSupervisor,
    isAdminOrSupervisor,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
