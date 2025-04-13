"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { FaCoins, FaPlus, FaEdit, FaToggleOn, FaToggleOff } from "react-icons/fa"
import Layout from "../components/Layout"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const Currencies = () => {
  const { isAdminOrSupervisor } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currencies, setCurrencies] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState(null)
  const [currencyForm, setCurrencyForm] = useState({
    code: "",
    name: "",
    symbol: "",
    buyRate: "",
    sellRate: "",
    isActive: true,
  })

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      setLoading(true)
      const response = await api.get("/api/currencies")
      setCurrencies(response.data.currencies)
    } catch (error) {
      console.error("Error fetching currencies:", error)
      toast.error("Erreur lors du chargement des devises")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setCurrencyForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleAddCurrency = async (e) => {
    e.preventDefault()

    // Validate form
    if (!currencyForm.code || !currencyForm.name || !currencyForm.buyRate || !currencyForm.sellRate) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      setLoading(true)

      await api.post("/api/currencies", {
        code: currencyForm.code,
        name: currencyForm.name,
        symbol: currencyForm.symbol || currencyForm.code,
        buyRate: Number.parseFloat(currencyForm.buyRate),
        sellRate: Number.parseFloat(currencyForm.sellRate),
        isActive: currencyForm.isActive,
      })

      toast.success("Devise ajoutée avec succès")

      // Reset form and refresh currencies
      setCurrencyForm({
        code: "",
        name: "",
        symbol: "",
        buyRate: "",
        sellRate: "",
        isActive: true,
      })

      setShowAddForm(false)
      fetchCurrencies()
    } catch (error) {
      console.error("Error adding currency:", error)
      toast.error(error.response?.data?.error || "Erreur lors de l'ajout de la devise")
    } finally {
      setLoading(false)
    }
  }

  const handleEditCurrency = async (e) => {
    e.preventDefault()

    // Validate form
    if (!currencyForm.buyRate || !currencyForm.sellRate) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      setLoading(true)

      await api.put(`/api/currencies/${editingCurrency.id}`, {
        buyRate: Number.parseFloat(currencyForm.buyRate),
        sellRate: Number.parseFloat(currencyForm.sellRate),
        isActive: currencyForm.isActive,
      })

      toast.success("Devise mise à jour avec succès")

      // Reset form and refresh currencies
      setCurrencyForm({
        code: "",
        name: "",
        symbol: "",
        buyRate: "",
        sellRate: "",
        isActive: true,
      })

      setEditingCurrency(null)
      fetchCurrencies()
    } catch (error) {
      console.error("Error updating currency:", error)
      toast.error(error.response?.data?.error || "Erreur lors de la mise à jour de la devise")
    } finally {
      setLoading(false)
    }
  }

  const startEditCurrency = (currency) => {
    setEditingCurrency(currency)
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      buyRate: currency.buy_rate,
      sellRate: currency.sell_rate,
      isActive: currency.is_active,
    })
  }

  const cancelEdit = () => {
    setEditingCurrency(null)
    setCurrencyForm({
      code: "",
      name: "",
      symbol: "",
      buyRate: "",
      sellRate: "",
      isActive: true,
    })
  }

  const toggleCurrencyStatus = async (currency) => {
    try {
      setLoading(true)

      await api.put(`/api/currencies/${currency.id}`, {
        isActive: !currency.is_active,
      })

      toast.success(`Devise ${currency.is_active ? "désactivée" : "activée"} avec succès`)
      fetchCurrencies()
    } catch (error) {
      console.error("Error toggling currency status:", error)
      toast.error("Erreur lors de la modification du statut de la devise")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Gestion des Devises">
      <div className="currencies-page">
        {isAdminOrSupervisor() && (
          <div className="page-actions">
            {!showAddForm && !editingCurrency && (
              <button className="add-currency-btn" onClick={() => setShowAddForm(true)}>
                <FaPlus /> Ajouter une devise
              </button>
            )}
          </div>
        )}

        {(showAddForm || editingCurrency) && isAdminOrSupervisor() && (
          <div className="currency-form-container">
            <h2>
              {editingCurrency ? (
                <>
                  <FaEdit /> Modifier la devise {editingCurrency.code}
                </>
              ) : (
                <>
                  <FaPlus /> Ajouter une nouvelle devise
                </>
              )}
            </h2>
            <form className="currency-form" onSubmit={editingCurrency ? handleEditCurrency : handleAddCurrency}>
              {!editingCurrency && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="code">Code</label>
                      <input
                        type="text"
                        id="code"
                        name="code"
                        value={currencyForm.code}
                        onChange={handleInputChange}
                        required
                        maxLength={3}
                        placeholder="Ex: EUR"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="name">Nom</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={currencyForm.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Ex: Euro"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="symbol">Symbole</label>
                      <input
                        type="text"
                        id="symbol"
                        name="symbol"
                        value={currencyForm.symbol}
                        onChange={handleInputChange}
                        placeholder="Ex: €"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="buyRate">Taux d'achat</label>
                  <input
                    type="number"
                    id="buyRate"
                    name="buyRate"
                    value={currencyForm.buyRate}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="Ex: 655.5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sellRate">Taux de vente</label>
                  <input
                    type="number"
                    id="sellRate"
                    name="sellRate"
                    value={currencyForm.sellRate}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="Ex: 660.0"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={currencyForm.isActive}
                      onChange={handleInputChange}
                    />
                    Actif
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingCurrency ? "Mettre à jour" : "Ajouter"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    if (editingCurrency) {
                      cancelEdit()
                    } else {
                      setShowAddForm(false)
                    }
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="currencies-section">
          <h2>
            <FaCoins /> Devises disponibles
          </h2>

          {loading && !currencies.length ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement des devises...</p>
            </div>
          ) : currencies.length > 0 ? (
            <div className="currencies-table-container">
              <table className="currencies-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nom</th>
                    <th>Symbole</th>
                    <th>Taux d'achat</th>
                    <th>Taux de vente</th>
                    <th>Statut</th>
                    {isAdminOrSupervisor() && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((currency) => (
                    <tr key={currency.id} className={!currency.is_active ? "inactive" : ""}>
                      <td>{currency.code}</td>
                      <td>{currency.name}</td>
                      <td>{currency.symbol}</td>
                      <td>{Number.parseFloat(currency.buy_rate).toLocaleString("fr-FR")}</td>
                      <td>{Number.parseFloat(currency.sell_rate).toLocaleString("fr-FR")}</td>
                      <td>
                        <span className={`status-badge ${currency.is_active ? "active" : "inactive"}`}>
                          {currency.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      {isAdminOrSupervisor() && (
                        <td>
                          <div className="action-buttons">
                            <button className="edit-btn" onClick={() => startEditCurrency(currency)} disabled={loading}>
                              <FaEdit />
                            </button>
                            <button
                              className={`toggle-btn ${currency.is_active ? "active" : "inactive"}`}
                              onClick={() => toggleCurrencyStatus(currency)}
                              disabled={loading}
                            >
                              {currency.is_active ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>Aucune devise disponible</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Currencies
