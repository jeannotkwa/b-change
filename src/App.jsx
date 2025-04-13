import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import AdminRoute from "./components/AdminRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import CashRegister from "./pages/CashRegister"
import Transactions from "./pages/Transactions"
import NewTransaction from "./pages/NewTransaction"
import Currencies from "./pages/Currencies"
import Users from "./pages/Users"
import Reports from "./pages/Reports"
import Supply from "./pages/Supply"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cash-register"
              element={
                <ProtectedRoute>
                  <CashRegister />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-transaction"
              element={
                <ProtectedRoute>
                  <NewTransaction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supply"
              element={
                <ProtectedRoute>
                  <Supply />
                </ProtectedRoute>
              }
            />
            <Route
              path="/currencies"
              element={
                <ProtectedRoute>
                  <Currencies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
