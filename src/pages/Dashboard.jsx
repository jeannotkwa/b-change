"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { FaMoneyBillWave, FaExchangeAlt, FaCoins, FaArrowUp, FaArrowDown, FaPlus } from "react-icons/fa"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Layout from "../components/Layout"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const Dashboard = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [cashRegister, setCashRegister] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [stats, setStats] = useState({
    totalTransactions: 0,
    buyTransactions: 0,
    sellTransactions: 0,
    transactionsByDay: [],
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch active cash register for current user
        const cashRegisterResponse = await api.get("/api/cash-registers", {
          params: { status: "open" },
        })

        const userCashRegister = cashRegisterResponse.data.cashRegisters.find(
          (register) => register.cashier_id === currentUser.id,
        )
        setCashRegister(userCashRegister || null)

        // Fetch recent transactions if cash register is open
        if (userCashRegister) {
          const transactionsResponse = await api.get("/api/transactions", {
            params: {
              cashRegisterId: userCashRegister.id,
              limit: 5,
            },
          })
          setTransactions(transactionsResponse.data.transactions)

          // Calculate transaction stats
          const allTransactions = transactionsResponse.data.transactions
          const buyCount = allTransactions.filter((t) => t.type === "buy").length
          const sellCount = allTransactions.filter((t) => t.type === "sell").length

          // Group transactions by day for chart
          const last7Days = getLast7Days()
          const transactionsByDay = last7Days.map((date) => {
            const dayTransactions = allTransactions.filter(
              (t) => new Date(t.timestamp).toDateString() === date.toDateString(),
            )

            return {
              date: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
              buy: dayTransactions.filter((t) => t.type === "buy").length,
              sell: dayTransactions.filter((t) => t.type === "sell").length,
            }
          })

          setStats({
            totalTransactions: allTransactions.length,
            buyTransactions: buyCount,
            sellTransactions: sellCount,
            transactionsByDay,
          })
        }

        // Fetch currencies
        const currenciesResponse = await api.get("/api/currencies")
        setCurrencies(currenciesResponse.data.currencies)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [currentUser.id])

  // Helper function to get last 7 days
  const getLast7Days = () => {
    const result = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      result.push(date)
    }
    return result
  }

  return (
    <Layout title="Tableau de bord">
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      ) : (
        <div className="dashboard">
          <div className="dashboard-header">
            <div className="cash-register-status">
              <h2>Statut de la caisse</h2>
              {cashRegister ? (
                <div className="status-card open">
                  <FaMoneyBillWave />
                  <div>
                    <h3>Caisse ouverte</h3>
                    <p>Ouverte le {new Date(cashRegister.opened_at).toLocaleString("fr-FR")}</p>
                  </div>
                </div>
              ) : (
                <div className="status-card closed">
                  <FaMoneyBillWave />
                  <div>
                    <h3>Caisse fermée</h3>
                    <p>Vous devez ouvrir une caisse pour effectuer des transactions</p>
                    <Link to="/cash-register" className="open-register-btn">
                      Ouvrir une caisse
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {cashRegister && (
              <div className="quick-actions">
                <h2>Actions rapides</h2>
                <div className="action-buttons">
                  <Link to="/new-transaction" className="action-button buy">
                    <FaExchangeAlt />
                    <span>Nouvelle transaction</span>
                  </Link>
                  <Link to="/supply" className="action-button supply">
                    <FaPlus />
                    <span>Approvisionnement</span>
                  </Link>
                  <Link to="/cash-register" className="action-button close">
                    <FaMoneyBillWave />
                    <span>Gérer la caisse</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {cashRegister && (
            <>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaExchangeAlt />
                  </div>
                  <div className="stat-content">
                    <h3>Transactions totales</h3>
                    <p className="stat-value">{stats.totalTransactions}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon buy">
                    <FaArrowDown />
                  </div>
                  <div className="stat-content">
                    <h3>Achats</h3>
                    <p className="stat-value">{stats.buyTransactions}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon sell">
                    <FaArrowUp />
                  </div>
                  <div className="stat-content">
                    <h3>Ventes</h3>
                    <p className="stat-value">{stats.sellTransactions}</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-sections">
                <div className="dashboard-section">
                  <h2>Transactions récentes</h2>
                  {transactions.length > 0 ? (
                    <div className="transactions-list">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                          <div className="transaction-icon">
                            {transaction.type === "buy" ? <FaArrowDown /> : <FaArrowUp />}
                          </div>
                          <div className="transaction-details">
                            <h4>
                              {transaction.type === "buy" ? "Achat" : "Vente"} de {transaction.amount}{" "}
                              {transaction.currency_code}
                            </h4>
                            <p>
                              Taux: {transaction.rate} | Montant: {transaction.local_amount} XOF
                            </p>
                            <p className="transaction-time">
                              {new Date(transaction.timestamp).toLocaleString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      ))}
                      <Link to="/transactions" className="view-all">
                        Voir toutes les transactions
                      </Link>
                    </div>
                  ) : (
                    <p className="no-data">Aucune transaction récente</p>
                  )}
                </div>

                <div className="dashboard-section">
                  <h2>Activité récente</h2>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.transactionsByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="buy" name="Achats" fill="#4caf50" />
                        <Bar dataKey="sell" name="Ventes" fill="#2196f3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="dashboard-section">
            <h2>Taux de change actuels</h2>
            <div className="currencies-grid">
              {currencies.map((currency) => (
                <div key={currency.id} className="currency-card">
                  <div className="currency-header">
                    <FaCoins />
                    <h3>{currency.name}</h3>
                    <span className="currency-code">{currency.code}</span>
                  </div>
                  <div className="currency-rates">
                    <div className="rate buy">
                      <span>Achat</span>
                      <span className="rate-value">{currency.buy_rate}</span>
                    </div>
                    <div className="rate sell">
                      <span>Vente</span>
                      <span className="rate-value">{currency.sell_rate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Dashboard
