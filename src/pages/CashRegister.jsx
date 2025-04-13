"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { FaMoneyBillWave, FaPlus, FaMinus, FaLock, FaUnlock } from "react-icons/fa"
import Layout from "../components/Layout"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"

const CashRegister = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [cashRegister, setCashRegister] = useState(null)
  const [currencies, setCurrencies] = useState([])
  const [initialBalances, setInitialBalances] = useState([{ currencyCode: "XOF", amount: 0 }])
  const [finalBalances, setFinalBalances] = useState([])
  const [closingNotes, setClosingNotes] = useState("")
  const [openingCashRegister, setOpeningCashRegister] = useState(false)
  const [closingCashRegister, setClosingCashRegister] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch currencies
        const currenciesResponse = await api.get("/api/currencies")
        setCurrencies(currenciesResponse.data.currencies)

        // Add all currencies to initial balances
        const balances = [{ currencyCode: "XOF", amount: 0 }]
        currenciesResponse.data.currencies.forEach((currency) => {
          if (currency.code !== "XOF") {
            balances.push({ currencyCode: currency.code, amount: 0 })
          }
        })
        setInitialBalances(balances)

        // Fetch active cash register for current user
        const cashRegisterResponse = await api.get("/api/cash-registers", {
          params: { status: "open" },
        })

        const userCashRegister = cashRegisterResponse.data.cashRegisters.find(
          (register) => register.cashier_id === currentUser.id,
        )

        if (userCashRegister) {
          setCashRegister(userCashRegister)

          // Prepare final balances based on current balances
          const finalBalancesData = userCashRegister.currentBalances.map((balance) => ({
            currencyCode: balance.currency_code,
            amount: Number.parseFloat(balance.amount),
          }))

          setFinalBalances(finalBalancesData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser.id])

  const handleInitialBalanceChange = (index, value) => {
    const updatedBalances = [...initialBalances]
    updatedBalances[index].amount = Number.parseFloat(value) || 0
    setInitialBalances(updatedBalances)
  }

  const handleFinalBalanceChange = (index, value) => {
    const updatedBalances = [...finalBalances]
    updatedBalances[index].amount = Number.parseFloat(value) || 0
    setFinalBalances(updatedBalances)
  }

  const addCurrencyToInitialBalances = () => {
    // Find currencies not yet in initialBalances
    const usedCurrencyCodes = initialBalances.map((b) => b.currencyCode)
    const availableCurrencies = currencies.filter((c) => !usedCurrencyCodes.includes(c.code))

    if (availableCurrencies.length > 0) {
      setInitialBalances([...initialBalances, { currencyCode: availableCurrencies[0].code, amount: 0 }])
    } else {
      toast.info("Toutes les devises sont déjà ajoutées")
    }
  }

  const removeCurrencyFromInitialBalances = (index) => {
    if (initialBalances.length <= 1) {
      toast.error("Vous devez avoir au moins une devise")
      return
    }

    const updatedBalances = [...initialBalances]
    updatedBalances.splice(index, 1)
    setInitialBalances(updatedBalances)
  }

  const openCashRegister = async () => {
    try {
      setOpeningCashRegister(true)

      // Validate balances
      const validBalances = initialBalances.filter((b) => b.amount > 0)
      if (validBalances.length === 0) {
        toast.error("Vous devez spécifier au moins un solde initial")
        return
      }

      const response = await api.post("/api/cash-registers", {
        initialBalances: validBalances,
      })

      setCashRegister(response.data.cashRegister)
      setFinalBalances(validBalances)
      toast.success("Caisse ouverte avec succès")
    } catch (error) {
      console.error("Error opening cash register:", error)
      toast.error(error.response?.data?.error || "Erreur lors de l'ouverture de la caisse")
    } finally {
      setOpeningCashRegister(false)
    }
  }

  const closeCashRegister = async () => {
    try {
      setClosingCashRegister(true)

      // Validate balances
      if (finalBalances.length === 0) {
        toast.error("Vous devez spécifier les soldes finaux")
        return
      }

      const response = await api.post(`/api/cash-registers/${cashRegister.id}/close`, {
        finalBalances,
        notes: closingNotes,
      })

      setCashRegister(null)
      toast.success("Caisse fermée avec succès")

      // Show differences if any
      if (response.data.differences) {
        const hasDifferences = response.data.differences.some((d) => d.difference !== 0)
        if (hasDifferences) {
          toast.info("Des différences ont été détectées entre les soldes attendus et réels")
        }
      }
    } catch (error) {
      console.error("Error closing cash register:", error)
      toast.error(error.response?.data?.error || "Erreur lors de la fermeture de la caisse")
    } finally {
      setClosingCashRegister(false)
    }
  }

  return (
    <Layout title="Gestion de Caisse">
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      ) : (
        <div className="cash-register-page">
          {!cashRegister ? (
            <div className="cash-register-section">
              <div className="section-header">
                <h2>
                  <FaUnlock /> Ouverture de caisse
                </h2>
                <p>Spécifiez les soldes initiaux pour ouvrir votre caisse</p>
              </div>

              <div className="balances-form">
                <div className="balances-header">
                  <h3>Soldes initiaux</h3>
                  <button type="button" className="add-currency-btn" onClick={addCurrencyToInitialBalances}>
                    <FaPlus /> Ajouter une devise
                  </button>
                </div>

                {initialBalances.map((balance, index) => (
                  <div key={index} className="balance-row">
                    <div className="balance-currency">
                      <select
                        value={balance.currencyCode}
                        onChange={(e) => {
                          const updatedBalances = [...initialBalances]
                          updatedBalances[index].currencyCode = e.target.value
                          setInitialBalances(updatedBalances)
                        }}
                      >
                        {balance.currencyCode === "XOF" ? (
                          <option value="XOF">XOF (Franc CFA)</option>
                        ) : (
                          currencies.map((currency) => (
                            <option
                              key={currency.code}
                              value={currency.code}
                              disabled={initialBalances.some((b) => b !== balance && b.currencyCode === currency.code)}
                            >
                              {currency.code} ({currency.name})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="balance-amount">
                      <input
                        type="number"
                        value={balance.amount}
                        onChange={(e) => handleInitialBalanceChange(index, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {balance.currencyCode !== "XOF" && (
                      <button
                        type="button"
                        className="remove-currency-btn"
                        onClick={() => removeCurrencyFromInitialBalances(index)}
                      >
                        <FaMinus />
                      </button>
                    )}
                  </div>
                ))}

                <div className="form-actions">
                  <button
                    type="button"
                    className="open-register-btn"
                    onClick={openCashRegister}
                    disabled={openingCashRegister}
                  >
                    <FaMoneyBillWave />
                    {openingCashRegister ? "Ouverture en cours..." : "Ouvrir la caisse"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="cash-register-section">
              <div className="section-header">
                <h2>
                  <FaLock /> Fermeture de caisse
                </h2>
                <p>Spécifiez les soldes finaux pour fermer votre caisse</p>
              </div>

              <div className="register-info">
                <h3>Informations de la caisse</h3>
                <p>
                  <strong>Ouverte le:</strong> {new Date(cashRegister.opened_at).toLocaleString("fr-FR")}
                </p>
                <p>
                  <strong>Caissier:</strong> {cashRegister.cashier_name}
                </p>
              </div>

              <div className="balances-container">
                <div className="balances-column">
                  <h3>Soldes initiaux</h3>
                  {cashRegister.initialBalances.map((balance, index) => (
                    <div key={index} className="balance-display">
                      <span className="currency-code">{balance.currency_code}</span>
                      <span className="amount">{Number.parseFloat(balance.amount).toLocaleString("fr-FR")}</span>
                    </div>
                  ))}
                </div>

                <div className="balances-column">
                  <h3>Soldes actuels</h3>
                  {cashRegister.currentBalances.map((balance, index) => (
                    <div key={index} className="balance-display">
                      <span className="currency-code">{balance.currency_code}</span>
                      <span className="amount">{Number.parseFloat(balance.amount).toLocaleString("fr-FR")}</span>
                    </div>
                  ))}
                </div>

                <div className="balances-column">
                  <h3>Soldes finaux</h3>
                  {finalBalances.map((balance, index) => (
                    <div key={index} className="balance-input">
                      <span className="currency-code">{balance.currencyCode}</span>
                      <input
                        type="number"
                        value={balance.amount}
                        onChange={(e) => handleFinalBalanceChange(index, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="notes-section">
                <h3>Notes de fermeture</h3>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Ajoutez des notes concernant la fermeture de caisse (optionnel)"
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="close-register-btn"
                  onClick={closeCashRegister}
                  disabled={closingCashRegister}
                >
                  <FaLock />
                  {closingCashRegister ? "Fermeture en cours..." : "Fermer la caisse"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}

export default CashRegister
