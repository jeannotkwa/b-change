"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { FaExchangeAlt, FaArrowDown, FaArrowUp, FaUser, FaCalculator, FaMoneyBillWave } from "react-icons/fa"
import Layout from "../components/Layout"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const NewTransaction = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cashRegister, setCashRegister] = useState(null)
  const [currencies, setCurrencies] = useState([])
  const [transaction, setTransaction] = useState({
    type: "buy",
    currencyCode: "",
    amount: "",
    rate: "",
    localAmount: "",
    clientInfo: {
      name: "",
      idNumber: "",
      phone: "",
    },
    notes: "",
  })
  const [calculationMode, setCalculationMode] = useState("amount") // 'amount' or 'local'

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
          toast.error("Vous devez ouvrir une caisse pour effectuer des transactions")
          navigate("/cash-register")
          return
        }

        setCashRegister(userCashRegister)

        // Fetch currencies
        const currenciesResponse = await api.get("/api/currencies")
        const activeCurrencies = currenciesResponse.data.currencies.filter((c) => c.is_active)
        setCurrencies(activeCurrencies)

        // Set default currency if available
        if (activeCurrencies.length > 0) {
          const defaultCurrency = activeCurrencies[0]
          setTransaction((prev) => ({
            ...prev,
            currencyCode: defaultCurrency.code,
            rate: transaction.type === "buy" ? defaultCurrency.buy_rate : defaultCurrency.sell_rate,
          }))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser.id, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name.startsWith("clientInfo.")) {
      const clientInfoField = name.split(".")[1]
      setTransaction((prev) => ({
        ...prev,
        clientInfo: {
          ...prev.clientInfo,
          [clientInfoField]: value,
        },
      }))
    } else {
      setTransaction((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleTypeChange = (type) => {
    // Update transaction type and rate based on selected currency
    const selectedCurrency = currencies.find((c) => c.code === transaction.currencyCode)
    const newRate = selectedCurrency ? (type === "buy" ? selectedCurrency.buy_rate : selectedCurrency.sell_rate) : ""

    setTransaction((prev) => ({
      ...prev,
      type,
      rate: newRate,
    }))

    // Recalculate amounts
    if (transaction.amount && newRate) {
      if (calculationMode === "amount") {
        calculateLocalAmount(transaction.amount, newRate)
      } else {
        calculateAmount(transaction.localAmount, newRate)
      }
    }
  }

  const handleCurrencyChange = (e) => {
    const currencyCode = e.target.value
    const selectedCurrency = currencies.find((c) => c.code === currencyCode)
    const newRate = selectedCurrency
      ? transaction.type === "buy"
        ? selectedCurrency.buy_rate
        : selectedCurrency.sell_rate
      : ""

    setTransaction((prev) => ({
      ...prev,
      currencyCode,
      rate: newRate,
    }))

    // Recalculate amounts
    if (transaction.amount && newRate) {
      if (calculationMode === "amount") {
        calculateLocalAmount(transaction.amount, newRate)
      } else {
        calculateAmount(transaction.localAmount, newRate)
      }
    }
  }

  const handleAmountChange = (e) => {
    const amount = e.target.value
    setTransaction((prev) => ({
      ...prev,
      amount,
    }))

    setCalculationMode("amount")
    if (amount && transaction.rate) {
      calculateLocalAmount(amount, transaction.rate)
    }
  }

  const handleLocalAmountChange = (e) => {
    const localAmount = e.target.value
    setTransaction((prev) => ({
      ...prev,
      localAmount,
    }))

    setCalculationMode("local")
    if (localAmount && transaction.rate) {
      calculateAmount(localAmount, transaction.rate)
    }
  }

  const calculateLocalAmount = (amount, rate) => {
    const parsedAmount = Number.parseFloat(amount) || 0
    const parsedRate = Number.parseFloat(rate) || 0
    const localAmount = parsedAmount * parsedRate

    setTransaction((prev) => ({
      ...prev,
      localAmount: localAmount.toFixed(2),
    }))
  }

  const calculateAmount = (localAmount, rate) => {
    const parsedLocalAmount = Number.parseFloat(localAmount) || 0
    const parsedRate = Number.parseFloat(rate) || 0

    if (parsedRate === 0) return

    const amount = parsedLocalAmount / parsedRate

    setTransaction((prev) => ({
      ...prev,
      amount: amount.toFixed(2),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!transaction.currencyCode) {
      toast.error("Veuillez sélectionner une devise")
      return
    }

    if (!transaction.amount || Number.parseFloat(transaction.amount) <= 0) {
      toast.error("Veuillez entrer un montant valide")
      return
    }

    if (!transaction.rate || Number.parseFloat(transaction.rate) <= 0) {
      toast.error("Veuillez entrer un taux valide")
      return
    }

    try {
      setSubmitting(true)

      const response = await api.post("/api/transactions", {
        type: transaction.type,
        cashRegisterId: cashRegister.id,
        currencyCode: transaction.currencyCode,
        amount: Number.parseFloat(transaction.amount),
        rate: Number.parseFloat(transaction.rate),
        localAmount: Number.parseFloat(transaction.localAmount),
        clientInfo: transaction.clientInfo,
        notes: transaction.notes,
      })

      toast.success("Transaction enregistrée avec succès")

      // Reset form
      setTransaction({
        type: "buy",
        currencyCode: currencies[0]?.code || "",
        amount: "",
        rate: currencies[0] ? (transaction.type === "buy" ? currencies[0].buy_rate : currencies[0].sell_rate) : "",
        localAmount: "",
        clientInfo: {
          name: "",
          idNumber: "",
          phone: "",
        },
        notes: "",
      })

      // Offer to print receipt
      if (response.data.receiptUrl) {
        const printReceipt = window.confirm("Voulez-vous imprimer le reçu?")
        if (printReceipt) {
          window.open(response.data.receiptUrl, "_blank")
        }
      }
    } catch (error) {
      console.error("Error creating transaction:", error)
      toast.error(error.response?.data?.error || "Erreur lors de la création de la transaction")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Nouvelle Transaction">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Nouvelle Transaction">
      <div className="new-transaction-page">
        <div className="transaction-form-container">
          <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>
                <FaExchangeAlt /> Type de transaction
              </h2>
              <div className="transaction-type-selector">
                <button
                  type="button"
                  className={`type-btn buy ${transaction.type === "buy" ? "active" : ""}`}
                  onClick={() => handleTypeChange("buy")}
                >
                  <FaArrowDown /> Achat de devise
                </button>
                <button
                  type="button"
                  className={`type-btn sell ${transaction.type === "sell" ? "active" : ""}`}
                  onClick={() => handleTypeChange("sell")}
                >
                  <FaArrowUp /> Vente de devise
                </button>
              </div>
              <p className="type-description">
                {transaction.type === "buy"
                  ? "Achat de devise étrangère auprès du client"
                  : "Vente de devise étrangère au client"}
              </p>
            </div>

            <div className="form-section">
              <h2>
                <FaMoneyBillWave /> Détails de la transaction
              </h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="currencyCode">Devise</label>
                  <select
                    id="currencyCode"
                    name="currencyCode"
                    value={transaction.currencyCode}
                    onChange={handleCurrencyChange}
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="amount">Montant en devise</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={transaction.amount}
                    onChange={handleAmountChange}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rate">Taux</label>
                  <input
                    type="number"
                    id="rate"
                    name="rate"
                    value={transaction.rate}
                    onChange={handleInputChange}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="localAmount">Montant en XOF</label>
                  <input
                    type="number"
                    id="localAmount"
                    name="localAmount"
                    value={transaction.localAmount}
                    onChange={handleLocalAmountChange}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="calculator-section">
                <h3>
                  <FaCalculator /> Calculateur
                </h3>
                <p>
                  {transaction.type === "buy"
                    ? `Achat de ${transaction.amount || "0"} ${transaction.currencyCode || "devise"} à ${transaction.rate || "0"} = ${transaction.localAmount || "0"} XOF`
                    : `Vente de ${transaction.amount || "0"} ${transaction.currencyCode || "devise"} à ${transaction.rate || "0"} = ${transaction.localAmount || "0"} XOF`}
                </p>
              </div>
            </div>

            <div className="form-section">
              <h2>
                <FaUser /> Informations client
              </h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="clientName">Nom du client</label>
                  <input
                    type="text"
                    id="clientName"
                    name="clientInfo.name"
                    value={transaction.clientInfo.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="clientIdNumber">Numéro d'identité</label>
                  <input
                    type="text"
                    id="clientIdNumber"
                    name="clientInfo.idNumber"
                    value={transaction.clientInfo.idNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="clientPhone">Téléphone</label>
                  <input
                    type="text"
                    id="clientPhone"
                    name="clientInfo.phone"
                    value={transaction.clientInfo.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={transaction.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Notes additionnelles (optionnel)"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={submitting}>
                <FaExchangeAlt />
                {submitting ? "Traitement..." : "Enregistrer la transaction"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default NewTransaction
