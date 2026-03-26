import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"
import { examsAPI } from "../services/api"

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [exams,    setExams]    = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([examsAPI.list(), examsAPI.attempts()])
      .then(([e, a]) => {
        setExams(e.data.results || e.data)
        setAttempts(a.data.results || a.data)
      })
      .catch(() => toast.error("Failed to load exams"))
      .finally(() => setLoading(false))
  }, [])

  const getAttempt   = examId => attempts.find(a => a.exam === examId)
  const handleLogout = async () => { await logout(); navigate("/login") }
  const statusColor  = s => s==="active"?"#10b981":s==="scheduled"?"#3b82f6":"#64748b"

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>

      {/* Header */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 24px", borderBottom:"1px solid var(--border)",
        background:"rgba(12,21,37,0.85)", backdropFilter:"blur(10px)",
        position:"sticky", top:0, zIndex:50 }}>
        <span style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:18 }}>
          ProctorAI
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:13, color:"var(--muted)" }}>👤 {user?.name}</span>
          <button className="btn btn-ghost" onClick={handleLogout}
            style={{ padding:"6px 14px", fontSize:12 }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth:920, margin:"0 auto", padding:"28px 20px" }}>
        <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700, marginBottom:20 }}>
          Available Exams
        </h2>

        {loading && <p style={{ color:"var(--muted)" }}>Loading…</p>}

        {!loading && exams.length === 0 && (
          <div className="card" style={{ textAlign:"center", padding:52, color:"var(--muted)" }}>
            No exams available right now. Check back later.
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {exams.map(exam => {
            const attempt    = getAttempt(exam.id)
            const submitted  = attempt && attempt.status !== "in_progress"
            const inProgress = attempt && attempt.status === "in_progress"

            return (
              <div key={exam.id} className="card"
                style={{ display:"flex", alignItems:"center",
                  gap:16, justifyContent:"space-between", flexWrap:"wrap" }}>

                {/* Exam info */}
                <div style={{ flex:1, minWidth:240 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                    <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:600 }}>
                      {exam.title}
                    </h3>
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, fontWeight:600,
                      background:`${statusColor(exam.status)}22`,
                      color: statusColor(exam.status) }}>
                      {exam.status}
                    </span>
                  </div>
                  <p style={{ color:"var(--muted)", fontSize:13, marginBottom:7 }}>
                    {exam.description || "No description."}
                  </p>
                  <div style={{ display:"flex", gap:16, fontSize:12, color:"var(--muted)" }}>
                    <span>⏱ {exam.duration} min</span>
                    <span>📅 {format(new Date(exam.start_time), "MMM d, yyyy h:mm a")}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display:"flex", flexDirection:"column",
                  alignItems:"flex-end", gap:8, flexShrink:0 }}>

                  {submitted ? (
                    <>
                      <span style={{ fontSize:12, color:"#10b981", fontWeight:600 }}>
                        ✓ Submitted
                      </span>
                      {/* View Result button — goes to MyResult page */}
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize:12, padding:"7px 14px",
                          border:"1px solid rgba(59,130,246,0.4)",
                          color:"#60a5fa" }}
                        onClick={() => navigate(`/my-result/${attempt.id}`)}>
                        📋 View My Result
                      </button>
                    </>
                  ) : inProgress ? (
                    <button className="btn btn-primary"
                      onClick={() => navigate(`/exam/${exam.id}`)}>
                      Resume Exam →
                    </button>
                  ) : (
                    <button className="btn btn-primary"
                      onClick={() => navigate(`/exam/${exam.id}`)}>
                      Start Exam →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
