import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests if it exists in localStorage
const token = localStorage.getItem("token")
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`
}

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if not already there
      if (window.location.pathname !== "/login") {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export default api
