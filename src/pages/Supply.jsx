"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { FaMoneyBillWave, FaPlus, FaUpload } from "react-icons/fa"
import Layout from "../components/Layout"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const Supply = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cashRegister, setCashRegister] = useState(null)
  const [currencies, setCurrencies] = useState([])
  const [supplies, setSupplies] = useState([])
  const [supplyForm, setSupplyForm] = useState({
    currencyCode: "",
    amount: "",
    source: "internal",
    reference: "",
    notes: "",
    attachmentUrl: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch active cash register for current user
        const cashRegisterResponse = await api.get("/api/cash-registers", {
          params: { status: "open" },
        })

        const userCashRegister = cashRegisterResponse.data.cashRegisters.find(
          (register) => register.cashier_id === currentUser.id,
        )

        if (!userCashRegister) {
          toast.error("Vous devez ouvrir une caisse pour effectuer des approvisionnements")
          return
        }

        setCashRegister(userCashRegister)

        // Fetch currencies
        const currenciesResponse = await api.get("/api/currencies")
        const activeCurrencies = currenciesResponse.data.currencies.filter((c) => c.is_active)
        setCurrencies(activeCurrencies)

        // Set default currency if available
        if (activeCurrencies.length > 0) {
          setSupplyForm((prev) => ({
            ...prev,
            currencyCode: activeCurrencies[0].code,
          }))
        }

        // Fetch recent supplies
        const suppliesResponse = await api.get("/api/supply", {
          params: { cashRegisterId: userCashRegister.id },
        })
        setSupplies(suppliesResponse.data.supplies)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser.id])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSupplyForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!supplyForm.currencyCode) {
      toast.error("Veuillez sélectionner une devise")
      return
    }

    if (!supplyForm.amount || Number.parseFloat(supplyForm.amount) <= 0) {
      toast.error("Veuillez entrer un montant valide")
      return
    }

    try {
      setSubmitting(true)

      const response = await api.post("/api/supply", {
        cashRegisterId: cashRegister.id,
        currencyCode: supplyForm.currencyCode,
        amount: Number.parseFloat(supplyForm.amount),
        source: supplyForm.source,
        reference: supplyForm.reference,
        notes: supplyForm.notes,
        attachmentUrl: supplyForm.attachmentUrl,
      })

      toast.success("Approvisionnement enregistré avec succès")

      // Add new supply to the list
      setSupplies((prev) => [response.data.supply, ...prev])

      // Reset form
      setSupplyForm({
        currencyCode: currencies[0]?.code || "",
        amount: "",
        source: "internal",
        reference: "",
        notes: "",
        attachmentUrl: "",
      })
    } catch (error) {
      console.error("Error creating supply:", error)
      toast.error(error.response?.data?.error || "Erreur lors de l'enregistrement de l'approvisionnement")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="Approvisionnement">
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      ) : !cashRegister ? (
        <div className="no-cash-register">
          <h2>Aucune caisse ouverte</h2>
          <p>Vous devez ouvrir une caisse pour effectuer des approvisionnements</p>
        </div>
      ) : (
        <div className="supply-page">
          <div className="supply-form-container">
            <h2>
              <FaPlus /> Nouvel approvisionnement
            </h2>
            <form className="supply-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="currencyCode">Devise</label>
                  <select
                    id="currencyCode"
                    name="currencyCode"
                    value={supplyForm.currencyCode}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionner une devise</option>
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Montant</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={supplyForm.amount}
                    onChange={handleInputChange}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="source">Source</label>
                  <select id="source" name="source" value={supplyForm.source} onChange={handleInputChange} required>
                    <option value="internal">Interne</option>
                    <option value="external">Externe</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="reference">Référence</label>
                  <input
                    type="text"
                    id="reference"
                    name="reference"
                    value={supplyForm.reference}
                    onChange={handleInputChange}
                    placeholder="Numéro de référence (optionnel)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={supplyForm.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Notes additionnelles (optionnel)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="attachmentUrl">Pièce jointe</label>
                <div className="file-upload">
                  <input
                    type="text"
                    id="attachmentUrl"
                    name="attachmentUrl"
                    value={supplyForm.attachmentUrl}
                    onChange={handleInputChange}
                    placeholder="URL du document (optionnel)"
                  />
                  <button type="button" className="upload-btn">
                    <FaUpload /> Télécharger
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={submitting}>
                  <FaMoneyBillWave />
                  {submitting ? "Traitement..." : "Enregistrer l'approvisionnement"}
                </button>
              </div>
            </form>
          </div>

          <div className="recent-supplies">
            <h2>
              <FaMoneyBillWave /> Approvisionnements récents
            </h2>
            {supplies.length > 0 ? (
              <div className="supplies-table-container">
                <table className="supplies-table">
                  <thead>
                    <tr>
                      <th>N° Approvisionnement</th>
                      <th>Devise</th>
                      <th>Montant</th>
                      <th>Source</th>
                      <th>Date</th>
                      <th>Référence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplies.map((supply) => (
                      <tr key={supply.id}>
                        <td>{supply.supply_number}</td>
                        <td>{supply.currency_code}</td>
                        <td>{Number.parseFloat(supply.amount).toLocaleString("fr-FR")}</td>
                        <td>
                          <span className={`source-badge ${supply.source}`}>
                            {supply.source === "internal" ? "Interne" : "Externe"}
                          </span>
                        </td>
                        <td>{new Date(supply.timestamp).toLocaleString("fr-FR")}</td>
                        <td>{supply.reference || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <p>Aucun approvisionnement récent</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Supply
