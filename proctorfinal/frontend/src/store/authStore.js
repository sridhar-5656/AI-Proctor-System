import { create } from "zustand"
import { authAPI } from "../services/api"

const useAuthStore = create((set) => ({
  user:            JSON.parse(localStorage.getItem("user") || "null"),
  isAuthenticated: !!localStorage.getItem("access"),
  loading: false,
  error:   null,

  login: async (creds) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authAPI.login(creds)
      localStorage.setItem("access",  data.access)
      localStorage.setItem("refresh", data.refresh)
      localStorage.setItem("user",    JSON.stringify(data.user))
      set({ user: data.user, isAuthenticated: true, loading: false })
      return data.user
    } catch (e) {
      const msg = e.response?.data?.detail || "Login failed. Check your email and password."
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  register: async (form) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authAPI.register(form)
      set({ loading: false })
      return data
    } catch (e) {
      const msg = Object.values(e.response?.data || {}).flat().join(" ") || "Registration failed."
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  logout: async () => {
    try { await authAPI.logout(localStorage.getItem("refresh")) } catch {}
    localStorage.clear()
    set({ user: null, isAuthenticated: false })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
