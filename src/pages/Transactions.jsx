"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { FaExchangeAlt, FaArrowDown, FaArrowUp, FaSearch, FaFileDownload, FaPlus } from "react-icons/fa"
import Layout from "../components/Layout"
import api from "../services/api"

const Transactions = () => {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [filters, setFilters] = useState({
    type: "",
    currencyCode: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch currencies
        const currenciesResponse = await api.get("/api/currencies")
        setCurrencies(currenciesResponse.data.currencies)

        // Fetch transactions
        const transactionsResponse = await api.get("/api/transactions")
        setTransactions(transactionsResponse.data.transactions)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({
      ...filters,
      [name]: value,
    })
  }

  const applyFilters = async () => {
    try {
      setLoading(true)

      const response = await api.get("/api/transactions", {
        params: filters,
      })

      setTransactions(response.data.transactions)
    } catch (error) {
      console.error("Error applying filters:", error)
      toast.error("Erreur lors de l'application des filtres")
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = async () => {
    setFilters({
      type: "",
      currencyCode: "",
      startDate: "",
      endDate: "",
    })

    try {
      setLoading(true)
      const response = await api.get("/api/transactions")
      setTransactions(response.data.transactions)
    } catch (error) {
      console.error("Error resetting filters:", error)
      toast.error("Erreur lors de la réinitialisation des filtres")
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = (transactionId, receiptNumber) => {
    // In a real app, this would download the receipt PDF
    toast.info(`Téléchargement du reçu ${receiptNumber}`)
    window.open(`/api/receipts/${transactionId}`, "_blank")
  }

  return (
    <Layout title="Transactions">
      <div className="transactions-page">
        <div className="page-actions">
          <Link to="/new-transaction" className="new-transaction-btn">
            <FaPlus /> Nouvelle Transaction
          </Link>
        </div>

        <div className="filters-section">
          <h2>
            <FaSearch /> Filtres
          </h2>
          <div className="filters-form">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="type">Type</label>
                <select id="type" name="type" value={filters.type} onChange={handleFilterChange}>
                  <option value="">Tous</option>
                  <option value="buy">Achat</option>
                  <option value="sell">Vente</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="currencyCode">Devise</label>
                <select
                  id="currencyCode"
                  name="currencyCode"
                  value={filters.currencyCode}
                  onChange={handleFilterChange}
                >
                  <option value="">Toutes</option>
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="startDate">Date de début</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="endDate">Date de fin</label>
                <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
              </div>
            </div>

            <div className="filter-actions">
              <button type="button" onClick={applyFilters} className="apply-filters-btn">
                <FaSearch /> Appliquer
              </button>
              <button type="button" onClick={resetFilters} className="reset-filters-btn">
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <div className="transactions-section">
          <h2>
            <FaExchangeAlt /> Transactions
          </h2>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement des transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>N° Reçu</th>
                    <th>Type</th>
                    <th>Devise</th>
                    <th>Montant</th>
                    <th>Taux</th>
                    <th>Montant Local</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className={transaction.type}>
                      <td>{transaction.receipt_number}</td>
                      <td>
                        <span className={`transaction-type ${transaction.type}`}>
                          {transaction.type === "buy" ? (
                            <>
                              <FaArrowDown /> Achat
                            </>
                          ) : (
                            <>
                              <FaArrowUp /> Vente
                            </>
                          )}
                        </span>
                      </td>
                      <td>{transaction.currency_code}</td>
                      <td>{Number.parseFloat(transaction.amount).toLocaleString("fr-FR")}</td>
                      <td>{Number.parseFloat(transaction.rate).toLocaleString("fr-FR")}</td>
                      <td>{Number.parseFloat(transaction.local_amount).toLocaleString("fr-FR")} XOF</td>
                      <td>{new Date(transaction.timestamp).toLocaleString("fr-FR")}</td>
                      <td>
                        <button
                          className="receipt-btn"
                          onClick={() => downloadReceipt(transaction.id, transaction.receipt_number)}
                        >
                          <FaFileDownload /> Reçu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>Aucune transaction trouvée</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Transactions
