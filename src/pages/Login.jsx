"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { FaMoneyBillWave, FaLock, FaUser } from "react-icons/fa"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, currentUser } = useAuth()
  const navigate = useNavigate()

  // If user is already logged in, redirect to dashboard
  if (currentUser) {
    navigate("/")
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const success = await login(username, password)
      if (success) {
        navigate("/")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FaMoneyBillWave className="login-logo" />
          <h1>Bureau de Change</h1>
          <p>Système de gestion</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <FaUser /> Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
