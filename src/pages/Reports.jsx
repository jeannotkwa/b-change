"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { FaChartBar, FaFileExport, FaSearch, FaExchangeAlt, FaMoneyBillWave, FaUsers } from "react-icons/fa"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import Layout from "../components/Layout"
import api from "../services/api"

const Reports = () => {
  const [loading, setLoading] = useState(false)
  const [currencies, setCurrencies] = useState([])
  const [users, setUsers] = useState([])
  const [reportType, setReportType] = useState("transactions")
  const [reportData, setReportData] = useState(null)
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    currencyCode: "",
    cashierId: "",
  })

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)

        // Fetch currencies
        const currenciesResponse = await api.get("/api/currencies")
        setCurrencies(currenciesResponse.data.currencies)

        // Fetch users
        const usersResponse = await api.get("/api/users")
        setUsers(usersResponse.data.users)

        // Generate initial report
        await generateReport()
      } catch (error) {
        console.error("Error fetching initial data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  const handleReportTypeChange = (type) => {
    setReportType(type)
  }

  const generateReport = async () => {
    try {
      setLoading(true)

      const response = await api.get("/api/reports", {
        params: {
          type: reportType,
          ...filters,
        },
      })

      setReportData(response.data)
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Erreur lors de la génération du rapport")
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    // In a real app, this would generate a CSV or PDF file
    toast.info("Export de rapport non implémenté dans cette démo")
  }

  // Helper function to prepare data for charts
  const prepareChartData = () => {
    if (!reportData) return []

    switch (reportType) {
      case "transactions": {
        // Prepare data for transaction charts
        const totals = reportData.totals
        const chartData = Object.keys(totals).map((currencyCode) => {
          return {
            name: currencyCode,
            achats: totals[currencyCode].buys.amount,
            ventes: totals[currencyCode].sells.amount,
          }
        })
        return chartData
      }
      case "supplies": {
        // Prepare data for supplies charts
        const totals = reportData.totals
        const chartData = Object.keys(totals).map((currencyCode) => {
          return {
            name: currencyCode,
            interne: totals[currencyCode].internal.amount,
            externe: totals[currencyCode].external.amount,
          }
        })
        return chartData
      }
      case "cashiers": {
        // Prepare data for cashiers charts
        if (!reportData.cashiers) return []

        return reportData.cashiers.map((cashier) => {
          // Sum up all transactions for this cashier
          let totalBuys = 0
          let totalSells = 0

          Object.values(cashier.currencies).forEach((currency) => {
            totalBuys += currency.buys.amount
            totalSells += currency.sells.amount
          })

          return {
            name: cashier.cashierName,
            achats: totalBuys,
            ventes: totalSells,
            total: totalBuys + totalSells,
          }
        })
      }
      default:
        return []
    }
  }

  // Prepare pie chart data
  const preparePieData = () => {
    if (!reportData) return []

    switch (reportType) {
      case "transactions": {
        // Calculate total buys vs sells
        let totalBuys = 0
        let totalSells = 0

        Object.values(reportData.totals).forEach((currency) => {
          totalBuys += currency.buys.amount
          totalSells += currency.sells.amount
        })

        return [
          { name: "Achats", value: totalBuys },
          { name: "Ventes", value: totalSells },
        ]
      }
      case "supplies": {
        // Calculate internal vs external supplies
        let totalInternal = 0
        let totalExternal = 0

        Object.values(reportData.totals).forEach((currency) => {
          totalInternal += currency.internal.amount
          totalExternal += currency.external.amount
        })

        return [
          { name: "Interne", value: totalInternal },
          { name: "Externe", value: totalExternal },
        ]
      }
      default:
        return []
    }
  }

  const COLORS = ["#4caf50", "#2196f3", "#ff9800", "#f44336", "#9c27b0"]

  return (
    <Layout title="Rapports">
      <div className="reports-page">
        <div className="report-controls">
          <div className="report-types">
            <button
              className={`report-type-btn ${reportType === "transactions" ? "active" : ""}`}
              onClick={() => handleReportTypeChange("transactions")}
            >
              <FaExchangeAlt /> Transactions
            </button>
            <button
              className={`report-type-btn ${reportType === "supplies" ? "active" : ""}`}
              onClick={() => handleReportTypeChange("supplies")}
            >
              <FaMoneyBillWave /> Approvisionnements
            </button>
            <button
              className={`report-type-btn ${reportType === "cashiers" ? "active" : ""}`}
              onClick={() => handleReportTypeChange("cashiers")}
            >
              <FaUsers /> Caissiers
            </button>
          </div>

          <div className="filters-section">
            <h3>
              <FaSearch /> Filtres
            </h3>
            <div className="filters-form">
              <div className="filter-row">
                <div className="filter-group">
                  <label htmlFor="startDate">Date de début</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    required
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="endDate">Date de fin</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    required
                  />
                </div>
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <label htmlFor="currencyCode">Devise</label>
                  <select
                    id="currencyCode"
                    name="currencyCode"
                    value={filters.currencyCode}
                    onChange={handleFilterChange}
                  >
                    <option value="">Toutes les devises</option>
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                {reportType === "transactions" && (
                  <div className="filter-group">
                    <label htmlFor="cashierId">Caissier</label>
                    <select id="cashierId" name="cashierId" value={filters.cashierId} onChange={handleFilterChange}>
                      <option value="">Tous les caissiers</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="filter-actions">
                <button type="button" className="generate-btn" onClick={generateReport} disabled={loading}>
                  <FaChartBar /> Générer le rapport
                </button>
                {reportData && (
                  <button type="button" className="export-btn" onClick={exportReport}>
                    <FaFileExport /> Exporter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Génération du rapport en cours...</p>
          </div>
        ) : reportData ? (
          <div className="report-results">
            <div className="report-header">
              <h2>
                {reportType === "transactions" && (
                  <>
                    <FaExchangeAlt /> Rapport des transactions
                  </>
                )}
                {reportType === "supplies" && (
                  <>
                    <FaMoneyBillWave /> Rapport des approvisionnements
                  </>
                )}
                {reportType === "cashiers" && (
                  <>
                    <FaUsers /> Rapport des caissiers
                  </>
                )}
              </h2>
              <p>
                Période: {new Date(reportData.startDate).toLocaleDateString("fr-FR")} -{" "}
                {new Date(reportData.endDate).toLocaleDateString("fr-FR")}
              </p>
            </div>

            <div className="charts-container">
              <div className="chart-card">
                <h3>Répartition par devise</h3>
                <div className="chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {reportType === "transactions" && (
                        <>
                          <Bar dataKey="achats" name="Achats" fill="#4caf50" />
                          <Bar dataKey="ventes" name="Ventes" fill="#2196f3" />
                        </>
                      )}
                      {reportType === "supplies" && (
                        <>
                          <Bar dataKey="interne" name="Interne" fill="#ff9800" />
                          <Bar dataKey="externe" name="Externe" fill="#9c27b0" />
                        </>
                      )}
                      {reportType === "cashiers" && (
                        <>
                          <Bar dataKey="total" name="Total" fill="#f44336" />
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {(reportType === "transactions" || reportType === "supplies") && (
                <div className="chart-card">
                  <h3>Répartition globale</h3>
                  <div className="chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={preparePieData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {preparePieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div className="report-details">
              <h3>Détails du rapport</h3>

              {reportType === "transactions" && (
                <div className="transactions-summary">
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Devise</th>
                        <th>Achats (Nombre)</th>
                        <th>Achats (Montant)</th>
                        <th>Ventes (Nombre)</th>
                        <th>Ventes (Montant)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.totals).map(([currencyCode, data]) => (
                        <tr key={currencyCode}>
                          <td>{currencyCode}</td>
                          <td>{data.buys.count}</td>
                          <td>{data.buys.amount.toLocaleString("fr-FR")}</td>
                          <td>{data.sells.count}</td>
                          <td>{data.sells.amount.toLocaleString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {reportType === "supplies" && (
                <div className="supplies-summary">
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Devise</th>
                        <th>Interne (Nombre)</th>
                        <th>Interne (Montant)</th>
                        <th>Externe (Nombre)</th>
                        <th>Externe (Montant)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.totals).map(([currencyCode, data]) => (
                        <tr key={currencyCode}>
                          <td>{currencyCode}</td>
                          <td>{data.internal.count}</td>
                          <td>{data.internal.amount.toLocaleString("fr-FR")}</td>
                          <td>{data.external.count}</td>
                          <td>{data.external.amount.toLocaleString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {reportType === "cashiers" && (
                <div className="cashiers-summary">
                  <table className="summary-table">
                    <thead>
                      <tr>
                        <th>Caissier</th>
                        <th>Transactions</th>
                        <th>Devises</th>
                        <th>Achats (Montant)</th>
                        <th>Ventes (Montant)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.cashiers.map((cashier) => (
                        <tr key={cashier.cashierId}>
                          <td>{cashier.cashierName}</td>
                          <td>{cashier.transactionCount}</td>
                          <td>{Object.keys(cashier.currencies).join(", ")}</td>
                          <td>
                            {Object.values(cashier.currencies)
                              .reduce((sum, currency) => sum + currency.buys.amount, 0)
                              .toLocaleString("fr-FR")}
                          </td>
                          <td>
                            {Object.values(cashier.currencies)
                              .reduce((sum, currency) => sum + currency.sells.amount, 0)
                              .toLocaleString("fr-FR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-report">
            <p>Veuillez générer un rapport en utilisant les filtres ci-dessus</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Reports
