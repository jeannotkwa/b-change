"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { FaUsers, FaPlus, FaEdit, FaTrash } from "react-icons/fa"
import Layout from "../components/Layout"
import api from "../services/api"

const Users = () => {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "cashier",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get("/api/users")
      setUsers(response.data.users)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Erreur lors du chargement des utilisateurs")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddUser = async (e) => {
    e.preventDefault()

    // Validate form
    if (!userForm.username || !userForm.password || !userForm.fullName || !userForm.role) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    try {
      setLoading(true)

      await api.post("/api/users", {
        username: userForm.username,
        password: userForm.password,
        fullName: userForm.fullName,
        role: userForm.role,
      })

      toast.success("Utilisateur créé avec succès")

      // Reset form and refresh users
      setUserForm({
        username: "",
        password: "",
        fullName: "",
        role: "cashier",
      })

      setShowAddForm(false)
      fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      toast.error(error.response?.data?.error || "Erreur lors de la création de l'utilisateur")
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()

    // Validate form
    if (!userForm.fullName || !userForm.role) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      setLoading(true)

      const updateData = {
        fullName: userForm.fullName,
        role: userForm.role,
      }

      // Only include password if it was changed
      if (userForm.password) {
        updateData.password = userForm.password
      }

      await api.put(`/api/users/${editingUser.id}`, updateData)

      toast.success("Utilisateur mis à jour avec succès")

      // Reset form and refresh users
      setUserForm({
        username: "",
        password: "",
        fullName: "",
        role: "cashier",
      })

      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error(error.response?.data?.error || "Erreur lors de la mise à jour de l'utilisateur")
    } finally {
      setLoading(false)
    }
  }

  const startEditUser = (user) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      password: "", // Don't show existing password
      fullName: user.full_name,
      role: user.role,
    })
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setUserForm({
      username: "",
      password: "",
      fullName: "",
      role: "cashier",
    })
  }

  const deleteUser = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return
    }

    try {
      setLoading(true)

      await api.delete(`/api/users/${userId}`)

      toast.success("Utilisateur supprimé avec succès")
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Erreur lors de la suppression de l'utilisateur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Gestion des Utilisateurs">
      <div className="users-page">
        <div className="page-actions">
          {!showAddForm && !editingUser && (
            <button className="add-user-btn" onClick={() => setShowAddForm(true)}>
              <FaPlus /> Ajouter un utilisateur
            </button>
          )}
        </div>

        {(showAddForm || editingUser) && (
          <div className="user-form-container">
            <h2>
              {editingUser ? (
                <>
                  <FaEdit /> Modifier l'utilisateur {editingUser.username}
                </>
              ) : (
                <>
                  <FaPlus /> Ajouter un nouvel utilisateur
                </>
              )}
            </h2>
            <form className="user-form" onSubmit={editingUser ? handleEditUser : handleAddUser}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Nom d'utilisateur</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={userForm.username}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingUser}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Mot de passe {editingUser && "(laisser vide pour ne pas changer)"}</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Nom complet</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={userForm.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Rôle</label>
                  <select id="role" name="role" value={userForm.role} onChange={handleInputChange} required>
                    <option value="cashier">Caissier</option>
                    <option value="supervisor">Superviseur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingUser ? "Mettre à jour" : "Ajouter"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    if (editingUser) {
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

        <div className="users-section">
          <h2>
            <FaUsers /> Utilisateurs
          </h2>

          {loading && !users.length ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement des utilisateurs...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nom d'utilisateur</th>
                    <th>Nom complet</th>
                    <th>Rôle</th>
                    <th>Date de création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.full_name}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === "admin" && "Administrateur"}
                          {user.role === "supervisor" && "Superviseur"}
                          {user.role === "cashier" && "Caissier"}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString("fr-FR")}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => startEditUser(user)} disabled={loading}>
                            <FaEdit />
                          </button>
                          {user.role !== "admin" && (
                            <button className="delete-btn" onClick={() => deleteUser(user.id)} disabled={loading}>
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Users
