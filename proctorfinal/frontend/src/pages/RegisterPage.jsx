import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, loading } = useAuthStore()
  const [form, setForm] = useState({ name:"", email:"", password:"", password2:"", role:"student" })

  const submit = async e => {
    e.preventDefault()
    if (form.password !== form.password2) { toast.error("Passwords do not match"); return }
    try {
      await register(form)
      toast.success("Account created! Please login.")
      navigate("/login")
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:16 }}>
      <div style={{ width:"100%", maxWidth:440 }} className="fade-in">
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:24, fontWeight:700 }}>ProctorAI</h1>
          <p style={{ color:"var(--muted)", fontSize:14, marginTop:4 }}>Create your account</p>
        </div>
        <div className="card">
          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[["Name","name","text","Full Name"],["Email","email","email","you@example.com"],
              ["Password","password","password","••••••••"],["Confirm Password","password2","password","••••••••"]
            ].map(([label,key,type,ph]) => (
              <div key={key}>
                <label style={{ display:"block", fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>{label}</label>
                <input className="input" type={type} placeholder={ph} value={form[key]}
                  onChange={e => setForm({...form,[key]:e.target.value})} required />
              </div>
            ))}
            <div>
              <label style={{ display:"block", fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 }}>Role</label>
              <select className="input" value={form.role} onChange={e => setForm({...form,role:e.target.value})}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ marginTop:4, width:"100%", padding:"12px 0" }}>
              {loading ? "Creating…" : "Create Account →"}
            </button>
          </form>
          <p style={{ textAlign:"center", fontSize:13, color:"var(--muted)", marginTop:16 }}>
            Have account? <Link to="/login" style={{ color:"var(--accent2)", fontWeight:500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
