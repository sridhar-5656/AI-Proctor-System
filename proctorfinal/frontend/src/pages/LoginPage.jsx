import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()
  const [form, setForm] = useState({ email:"", password:"" })

  const submit = async e => {
    e.preventDefault()
    try {
      const u = await login(form)
      toast.success(`Welcome, ${u.name}!`)
      navigate(u.role === "admin" ? "/admin" : "/dashboard")
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:16 }}>
      <div style={{ width:"100%", maxWidth:420 }} className="fade-in">
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"var(--accent)", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
            <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
          <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:700 }}>ProctorAI</h1>
          <p style={{ color:"var(--muted)", fontSize:14, marginTop:4 }}>Intelligent Exam Monitoring</p>
        </div>
        <div className="card" style={{ boxShadow:"0 25px 60px rgba(0,0,0,.5)" }}>
          <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:600, marginBottom:20 }}>Sign in</h2>
          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ display:"block", fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({...form, email:e.target.value})} required />
            </div>
            <div>
              <label style={{ display:"block", fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({...form, password:e.target.value})} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ marginTop:4, width:"100%", padding:"12px 0" }}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>
          <p style={{ textAlign:"center", fontSize:13, color:"var(--muted)", marginTop:16 }}>
            No account? <Link to="/register" style={{ color:"var(--accent2)", fontWeight:500 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
