/**
 * MyResult.jsx
 * Student views their full result after exam submission.
 *
 * Shows per question:
 *  - Their answer
 *  - Correct answer (MCQ / True-False — revealed immediately)
 *  - Model answer   (Short Answer    — set by admin, shown after grading)
 *  - Marks obtained
 *  - Pending grading status for short answers
 *
 * Route: /my-result/:attemptId   (student only)
 */
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import axios from "axios"

const api = axios.create({ baseURL: "/api" })
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem("access")
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

// ── small helpers ─────────────────────────────────────────────────────────
function GradeCircle({ pct }) {
  const color = pct >= 80 ? "#10b981" : pct >= 60 ? "#3b82f6" : pct >= 40 ? "#f59e0b" : "#ef4444"
  const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "F"
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ width:80, height:80, borderRadius:"50%", border:`4px solid ${color}`,
        display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
        <span style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700, color }}>{grade}</span>
      </div>
      <span style={{ fontSize:12, color:"var(--muted)" }}>{pct}%</span>
    </div>
  )
}

function StatusBadge({ row }) {
  if (row.question_type === "short" && row.pending_grade) {
    return (
      <span style={{ fontSize:11, padding:"3px 9px", borderRadius:10, fontWeight:600,
        background:"rgba(245,158,11,0.15)", color:"#fbbf24" }}>
        ⏳ Awaiting Admin Grade
      </span>
    )
  }
  if (row.is_correct) {
    return (
      <span style={{ fontSize:11, padding:"3px 9px", borderRadius:10, fontWeight:600,
        background:"rgba(16,185,129,0.15)", color:"#34d399" }}>
        ✓ Correct  +{row.marks_obtained} mark{row.marks_obtained !== 1 ? "s" : ""}
      </span>
    )
  }
  return (
    <span style={{ fontSize:11, padding:"3px 9px", borderRadius:10, fontWeight:600,
      background:"rgba(239,68,68,0.15)", color:"#f87171" }}>
      ✗ Wrong  +0 marks
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function MyResult() {
  const { attemptId } = useParams()
  const navigate      = useNavigate()
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")

  useEffect(() => {
    api.get(`/my-result/${attemptId}/`)
      .then(r => setResult(r.data))
      .catch(err => {
        const msg = err.response?.data?.error || "Could not load result."
        setError(msg)
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }, [attemptId])

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex",
      alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"3px solid var(--border)",
          borderTopColor:"#3b82f6", borderRadius:"50%",
          animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ color:"var(--muted)", fontSize:13 }}>Loading your result…</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ maxWidth:440, width:"100%", background:"var(--bg2)",
        border:"1px solid var(--border)", borderRadius:16, padding:40, textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
        <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:18, fontWeight:700, marginBottom:8 }}>
          {error}
        </h2>
        <p style={{ color:"var(--muted)", fontSize:13, marginBottom:24 }}>
          The exam may still be in progress or the result is not available yet.
        </p>
        <button onClick={() => navigate("/dashboard")}
          style={{ padding:"10px 28px", background:"#2563eb", color:"#fff",
            border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:500 }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  if (!result) return null

  const pendingCount = result.answers?.filter(r => r.pending_grade).length || 0
  const correct      = result.answers?.filter(r => r.is_correct).length    || 0
  const wrong        = result.answers?.filter(r => !r.is_correct && !r.pending_grade).length || 0

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)",
      padding:"24px 16px", fontFamily:"DM Sans,sans-serif" }}>
      <div style={{ maxWidth:780, margin:"0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28, flexWrap:"wrap" }}>
          <button onClick={() => navigate("/dashboard")}
            style={{ padding:"8px 16px", borderRadius:8, border:"1px solid var(--border)",
              background:"transparent", color:"var(--text)", cursor:"pointer", fontSize:13 }}>
            ← Dashboard
          </button>
          <div>
            <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700, margin:0 }}>
              My Result
            </h1>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>
              {result.exam_title}
            </p>
          </div>
        </div>

        {/* ── Score card ── */}
        <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
          borderRadius:16, padding:28, marginBottom:24,
          display:"flex", gap:28, alignItems:"center", flexWrap:"wrap" }}>

          <GradeCircle pct={result.percentage} />

          <div style={{ flex:1, minWidth:200 }}>
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:26, fontWeight:700, marginBottom:4 }}>
              {result.obtained_marks} <span style={{ color:"var(--muted)", fontSize:18 }}>/ {result.total_marks}</span>
            </h2>
            <p style={{ color:"var(--muted)", fontSize:14, marginBottom:14 }}>
              Total marks obtained · {result.percentage}%
            </p>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[
                { label:"Correct",  value:correct,      color:"#10b981" },
                { label:"Wrong",    value:wrong,         color:"#ef4444" },
                { label:"Pending",  value:pendingCount,  color:"#f59e0b" },
                { label:"Total Qs", value:result.answers?.length, color:"var(--accent2)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:700, color }}>{value}</div>
                  <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {pendingCount > 0 && (
            <div style={{ padding:"12px 16px", background:"rgba(245,158,11,0.08)",
              border:"1px solid rgba(245,158,11,0.25)", borderRadius:10 }}>
              <p style={{ fontSize:13, color:"#fbbf24", fontWeight:500 }}>
                ⏳ {pendingCount} short answer{pendingCount !== 1 ? "s" : ""} pending admin grading.
              </p>
              <p style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>
                Visit this page again after your teacher grades to see updated marks.
              </p>
            </div>
          )}
        </div>

        {/* ── Per-question answer review ── */}
        <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:600, marginBottom:16 }}>
          Answer Review ({result.answers?.length} questions)
        </h3>

        {result.answers?.map((row, i) => (
          <div key={i} style={{
            background:"var(--bg2)", borderRadius:14, padding:22, marginBottom:14,
            border:`1px solid ${
              row.pending_grade
                ? "rgba(245,158,11,0.3)"
                : row.is_correct
                  ? "rgba(16,185,129,0.3)"
                  : "rgba(239,68,68,0.3)"
            }`,
          }}>

            {/* Question */}
            <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"flex-start" }}>
              <span style={{ fontFamily:"monospace", fontSize:12, color:"var(--muted)",
                flexShrink:0, marginTop:2 }}>Q{row.question_order}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, lineHeight:1.65, marginBottom:8 }}>
                  {row.question_text}
                </p>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10,
                    background:"rgba(59,130,246,0.12)", color:"#60a5fa" }}>
                    {row.question_type === "true_false" ? "True / False"
                      : row.question_type === "mcq" ? "MCQ"
                      : "Short Answer"}
                  </span>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>
                    {row.marks} mark{row.marks !== 1 ? "s" : ""}
                  </span>
                  <StatusBadge row={row} />
                </div>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

              {/* ── Your answer ── */}
              <div style={{ background:"var(--bg3)", borderRadius:9, padding:"11px 14px" }}>
                <p style={{ fontSize:11, color:"var(--muted)", fontWeight:600,
                  textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>
                  Your Answer
                </p>
                <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.6 }}>
                  {row.your_answer
                    ? row.your_answer
                    : <span style={{ color:"var(--muted)", fontStyle:"italic" }}>
                        (you did not answer this question)
                      </span>
                  }
                </p>
              </div>

              {/* ── MCQ / True-False: show correct answer immediately ── */}
              {(row.question_type === "mcq" || row.question_type === "true_false") && row.correct_answer && (
                <div style={{ borderRadius:9, padding:"11px 14px",
                  background: row.is_correct
                    ? "rgba(16,185,129,0.07)"
                    : "rgba(59,130,246,0.07)",
                  border: `1px solid ${row.is_correct
                    ? "rgba(16,185,129,0.2)"
                    : "rgba(59,130,246,0.2)"}` }}>
                  <p style={{ fontSize:11, color: row.is_correct ? "#34d399" : "#60a5fa",
                    fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>
                    {row.is_correct ? "✓ Your answer is correct!" : "Correct Answer"}
                  </p>
                  <p style={{ fontSize:13, fontWeight:500,
                    color: row.is_correct ? "#34d399" : "#60a5fa" }}>
                    {row.correct_answer}
                  </p>
                </div>
              )}

              {/* ── Short Answer: model answer shown after admin grades ── */}
              {row.question_type === "short" && (
                <>
                  {row.model_answer ? (
                    <div style={{ borderRadius:9, padding:"11px 14px",
                      background:"rgba(59,130,246,0.07)",
                      border:"1px solid rgba(59,130,246,0.2)" }}>
                      <p style={{ fontSize:11, color:"#60a5fa", fontWeight:600,
                        textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>
                        Expected Answer (set by admin)
                      </p>
                      <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.7 }}>
                        {row.model_answer}
                      </p>
                    </div>
                  ) : row.pending_grade ? (
                    <div style={{ borderRadius:9, padding:"11px 14px",
                      background:"rgba(245,158,11,0.07)",
                      border:"1px solid rgba(245,158,11,0.2)" }}>
                      <p style={{ fontSize:11, color:"#fbbf24", fontWeight:600,
                        textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>
                        Awaiting Grading
                      </p>
                      <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
                        Your teacher will review this answer and assign marks.
                        Come back to this page after grading to see your marks and the model answer.
                      </p>
                    </div>
                  ) : (
                    <div style={{ borderRadius:9, padding:"11px 14px",
                      background:"rgba(16,185,129,0.07)",
                      border:"1px solid rgba(16,185,129,0.2)" }}>
                      <p style={{ fontSize:11, color:"#34d399", fontWeight:600,
                        textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>
                        Graded
                      </p>
                      <p style={{ fontSize:13, color:"var(--text)" }}>
                        You received <strong>{row.marks_obtained}</strong> / {row.marks} marks.
                      </p>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        ))}

        {/* ── Footer ── */}
        <div style={{ textAlign:"center", marginTop:24, paddingBottom:32 }}>
          <button onClick={() => navigate("/dashboard")}
            style={{ padding:"12px 36px", background:"#2563eb", color:"#fff",
              border:"none", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:600 }}>
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}
