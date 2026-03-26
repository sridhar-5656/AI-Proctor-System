/**
 * ExamPage.jsx — Full exam with:
 * 1. Live webcam visible in sidebar (getUserMedia)
 * 2. AI frame analysis via WebSocket every 2s
 * 3. Phone detection → immediate popup + HIGH violation
 * 4. Snapshot uploaded every 30s for admin review
 * 5. Video recorded via MediaRecorder, uploaded every 60s
 * 6. Questions rendered and answers auto-saved
 * 7. Model answer + correct/wrong shown after submission
 * 8. Tab switch / fullscreen exit tracked
 * 9. Copy/paste blocked during exam
 */
import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import axios from "axios"

const api = axios.create({ baseURL: "/api" })
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem("access")
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

const WS_BASE = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`

// ── Alert modal ────────────────────────────────────────────────────────────
function AlertModal({ alert, onDismiss }) {
  if (!alert) return null
  const cfg = {
    show_warning:    { border:"#f59e0b", icon:"⚠️", title:"Warning" },
    mark_suspicious: { border:"#ef4444", icon:"🚨", title:"Suspicious Activity" },
    auto_submit:     { border:"#ef4444", icon:"❌", title:"Exam Auto-Submitted" },
    phone_detected:  { border:"#ef4444", icon:"📱", title:"Phone Detected!" },
  }[alert.action] || { border:"#f59e0b", icon:"⚠️", title:"Alert" }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center",
      justifyContent:"center", background:"rgba(5,10,20,0.92)", backdropFilter:"blur(10px)" }}>
      <div style={{ maxWidth:390, width:"100%", margin:16, border:`2px solid ${cfg.border}`,
        background:"var(--bg2)", borderRadius:18, textAlign:"center", padding:38 }}>
        <div style={{ fontSize:52, marginBottom:14 }}>{cfg.icon}</div>
        <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:21, fontWeight:700, marginBottom:10 }}>
          {cfg.title}
        </h3>
        <p style={{ color:"var(--muted)", fontSize:14, marginBottom:26, lineHeight:1.65 }}>
          {alert.message}
        </p>
        {alert.action !== "auto_submit" && (
          <button onClick={onDismiss} style={{ width:"100%", padding:"13px 0", background:"#2563eb",
            color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>
            I Understand — Continue Exam
          </button>
        )}
      </div>
    </div>
  )
}

// ── Live webcam sidebar ────────────────────────────────────────────────────
function WebcamPanel({ videoRef, connected, analysis, vCount, alerts, recording }) {
  const faceOk   = analysis ? analysis.face_count === 1 : null
  const lookAway = analysis?.looking_away
  const phoneOn  = (analysis?.objects_detected || []).some(o => o.includes("phone"))

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ background:"var(--bg2)",
        border:`1px solid ${phoneOn ? "#ef4444" : "var(--border)"}`,
        borderRadius:12, padding:10, transition:"border-color 0.3s" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11, fontWeight:600, color:"var(--muted)",
              textTransform:"uppercase", letterSpacing:1 }}>Live Camera</span>
            {recording && (
              <span style={{ fontSize:10, color:"#ef4444", fontWeight:700,
                display:"flex", alignItems:"center", gap:3 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444",
                  display:"inline-block", animation:"pulse 1s infinite" }} />
                REC
              </span>
            )}
          </div>
          <span style={{ fontSize:11, display:"flex", alignItems:"center", gap:5,
            color: connected ? "#10b981" : "#ef4444" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"currentColor",
              display:"inline-block" }} />
            {connected ? "AI Active" : "Offline"}
          </span>
        </div>

        {/* Video feed */}
        <div style={{ position:"relative", borderRadius:8, overflow:"hidden",
          background:"#000", aspectRatio:"4/3" }}>
          <video ref={videoRef} autoPlay muted playsInline
            style={{ width:"100%", height:"100%", objectFit:"cover",
              transform:"scaleX(-1)", display:"block" }} />

          {/* Face status overlay */}
          {analysis && faceOk !== null && (
            <div style={{ position:"absolute", top:6, left:6, fontSize:11,
              padding:"3px 9px", borderRadius:6, fontWeight:600,
              background: faceOk ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)",
              color:"#fff" }}>
              {analysis.face_count === 0 ? "⚠ No Face"
                : analysis.face_count > 1 ? `⚠ ${analysis.face_count} Faces`
                : "✓ Face OK"}
            </div>
          )}

          {/* Phone banner */}
          {phoneOn && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0,
              background:"rgba(239,68,68,0.95)", color:"#fff",
              fontSize:12, fontWeight:700, padding:"6px 0", textAlign:"center",
              animation:"pulse 0.5s infinite" }}>
              📱 PHONE DETECTED — VIOLATION!
            </div>
          )}

          {lookAway && !phoneOn && (
            <div style={{ position:"absolute", bottom:6, left:6, fontSize:11,
              padding:"3px 8px", borderRadius:6, fontWeight:600,
              background:"rgba(245,158,11,0.9)", color:"#fff" }}>
              Looking Away
            </div>
          )}
        </div>

        {/* Status grid */}
        {analysis && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, marginTop:8 }}>
            {[
              ["Face",    analysis.face_count === 1],
              ["Gaze",    !lookAway],
              ["Eyes",    !analysis.eyes_closed],
              ["No Phone",(analysis.objects_detected || []).length === 0],
            ].map(([l, ok]) => (
              <div key={l} style={{ fontSize:11, padding:"4px 7px", borderRadius:5,
                background: ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color:      ok ? "#34d399" : "#f87171",
                display:"flex", gap:5 }}>
                <span>{ok ? "✓" : "✗"}</span><span>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Violation meter */}
      <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
        borderRadius:12, padding:10 }}>
        <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase",
          letterSpacing:1, marginBottom:6 }}>Violations</div>
        <div style={{ height:6, background:"var(--bg3)", borderRadius:10,
          overflow:"hidden", marginBottom:6 }}>
          <div style={{ height:"100%", width:`${Math.min((vCount/7)*100,100)}%`,
            borderRadius:10, transition:"all 0.4s",
            background: vCount < 3 ? "#10b981" : vCount < 5 ? "#f59e0b" : "#ef4444" }} />
        </div>
        <div style={{ fontSize:20, fontWeight:700, fontFamily:"monospace",
          textAlign:"center",
          color: vCount < 3 ? "#10b981" : vCount < 5 ? "#f59e0b" : "#ef4444" }}>
          {vCount}/7
        </div>
        <div style={{ fontSize:10, color:"var(--muted)", textAlign:"center", marginTop:2 }}>
          3=warn · 5=flag · 7=auto submit
        </div>
      </div>

      {/* Recent flags */}
      {alerts.length > 0 && (
        <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
          borderRadius:12, padding:10 }}>
          <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase",
            letterSpacing:1, marginBottom:7 }}>Recent Flags</div>
          {alerts.slice(0, 5).map((a, i) => (
            <div key={i} style={{ fontSize:11, padding:"4px 7px", borderRadius:5, marginBottom:4,
              background: a.severity==="high" ? "rgba(239,68,68,0.12)"
                : a.severity==="medium" ? "rgba(245,158,11,0.1)" : "rgba(100,116,139,0.1)",
              color: a.severity==="high" ? "#f87171"
                : a.severity==="medium" ? "#fbbf24" : "#94a3b8" }}>
              {String(a.violation_type || "").replace(/_/g, " ")}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Question card ──────────────────────────────────────────────────────────
function QuestionCard({ q, answer, onChange }) {
  return (
    <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
      borderRadius:14, padding:22, marginBottom:16 }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:14 }}>
        <span style={{ fontFamily:"monospace", fontSize:12, color:"var(--muted)",
          marginTop:2, flexShrink:0 }}>Q{q.order}</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:15, lineHeight:1.65, marginBottom:4 }}>{q.text}</p>
          <span style={{ fontSize:11, color:"var(--muted)" }}>
            {q.marks} mark{q.marks !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      {q.qtype === "short" ? (
        <textarea
          style={{ width:"100%", background:"var(--bg3)", border:"1px solid var(--border)",
            borderRadius:8, padding:"10px 12px", fontSize:13, color:"var(--text)",
            outline:"none", resize:"vertical", minHeight:80,
            fontFamily:"DM Sans,sans-serif", boxSizing:"border-box" }}
          placeholder="Type your answer here…"
          value={answer?.text_answer || ""}
          onChange={e => onChange({ text_answer: e.target.value })}
        />
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {q.choices?.map(c => (
            <label key={c.id} style={{ display:"flex", gap:10, alignItems:"center",
              padding:"11px 14px", borderRadius:10, cursor:"pointer",
              background: answer?.choice_id === c.id ? "rgba(59,130,246,0.15)" : "var(--bg3)",
              border:`1px solid ${answer?.choice_id === c.id ? "rgba(59,130,246,0.5)" : "var(--border)"}`,
              transition:"all 0.15s" }}>
              <input type="radio" name={`q_${q.id}`} value={c.id}
                checked={answer?.choice_id === c.id}
                onChange={() => onChange({ choice_id: c.id })}
                style={{ accentColor:"#3b82f6", width:16, height:16,
                  cursor:"pointer", flexShrink:0 }} />
              <span style={{ fontSize:14 }}>{c.text}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Submitted screen — shows result with answers ───────────────────────────
function SubmittedScreen({ attemptId, navigate }) {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!attemptId) { setLoading(false); return }
    // Poll for result — admin may not have graded yet
    api.get(`/my-result/${attemptId}/`)
      .then(r => setResult(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [attemptId])

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex",
      alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:"var(--muted)" }}>Loading your results…</p>
    </div>
  )

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", padding:"24px 16px",
      fontFamily:"DM Sans,sans-serif" }}>
      <div style={{ maxWidth:760, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:10 }}>🎉</div>
          <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:24, fontWeight:700, marginBottom:6 }}>
            Exam Submitted!
          </h2>
          {result && <p style={{ color:"var(--muted)", fontSize:15 }}>{result.exam_title}</p>}
        </div>

        {/* Score summary */}
        {result && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",
            gap:12, marginBottom:24 }}>
            {[
              { label:"Score",      value:`${result.obtained_marks} / ${result.total_marks}`, color:"var(--accent2)" },
              { label:"Percentage", value:`${result.percentage}%`,
                color: result.percentage >= 50 ? "#10b981" : "#ef4444" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background:"var(--bg2)", border:"1px solid var(--border)",
                borderRadius:14, padding:18, textAlign:"center" }}>
                <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase",
                  letterSpacing:0.5, marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:24, fontWeight:700, fontFamily:"Syne,sans-serif", color }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Answer review */}
        {result?.answers?.map((row, i) => (
          <div key={i} style={{ background:"var(--bg2)",
            border:`1px solid ${
              row.pending_grade ? "rgba(245,158,11,0.3)"
              : row.is_correct ? "rgba(16,185,129,0.3)"
              : "rgba(239,68,68,0.3)"}`,
            borderRadius:14, padding:20, marginBottom:14 }}>

            <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:12 }}>
              <span style={{ fontFamily:"monospace", fontSize:12, color:"var(--muted)",
                marginTop:2, flexShrink:0 }}>Q{row.question_order}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, lineHeight:1.6, marginBottom:6 }}>{row.question_text}</p>
                <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10,
                    background:"rgba(59,130,246,0.15)", color:"#60a5fa" }}>
                    {row.question_type}
                  </span>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>
                    {row.marks_obtained} / {row.marks} marks
                  </span>
                  {row.pending_grade ? (
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10,
                      background:"rgba(245,158,11,0.15)", color:"#fbbf24", fontWeight:600 }}>
                      ⏳ Pending Admin Grading
                    </span>
                  ) : (
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, fontWeight:600,
                      background: row.is_correct ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color:      row.is_correct ? "#34d399" : "#f87171" }}>
                      {row.is_correct ? "✓ Correct" : "✗ Wrong"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Your answer */}
            <div style={{ background:"var(--bg3)", borderRadius:8, padding:"10px 14px", marginBottom:10 }}>
              <p style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>Your answer:</p>
              <p style={{ fontSize:13, color:"var(--text)" }}>
                {row.your_answer
                  ? row.your_answer
                  : <span style={{ color:"var(--muted)", fontStyle:"italic" }}>(not answered)</span>}
              </p>
            </div>

            {/* Correct answer for MCQ/TF */}
            {row.correct_answer && row.question_type !== "short" && (
              <div style={{ background:"rgba(16,185,129,0.06)", borderRadius:8,
                padding:"10px 14px", border:"1px solid rgba(16,185,129,0.2)", marginBottom:10 }}>
                <p style={{ fontSize:11, color:"#34d399", fontWeight:600, marginBottom:4 }}>
                  Correct answer:
                </p>
                <p style={{ fontSize:13, color:"#34d399", fontWeight:500 }}>{row.correct_answer}</p>
              </div>
            )}

            {/* Model answer for short — shown after grading */}
            {row.question_type === "short" && row.model_answer && !row.pending_grade && (
              <div style={{ background:"rgba(59,130,246,0.06)", borderRadius:8,
                padding:"10px 14px", border:"1px solid rgba(59,130,246,0.2)" }}>
                <p style={{ fontSize:11, color:"#60a5fa", fontWeight:600, marginBottom:4 }}>
                  Expected answer (model answer):
                </p>
                <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.6 }}>{row.model_answer}</p>
              </div>
            )}

            {/* Pending notice */}
            {row.question_type === "short" && row.pending_grade && (
              <div style={{ padding:"10px 14px", borderRadius:8,
                background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)" }}>
                <p style={{ fontSize:13, color:"#fbbf24" }}>
                  ⏳ Admin will grade your answer and assign marks soon.
                  Check back later — you will see the model answer once graded.
                </p>
              </div>
            )}
          </div>
        ))}

        {!result && (
          <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
            borderRadius:14, padding:32, textAlign:"center", color:"var(--muted)" }}>
            Your answers have been saved. Results will be available soon.
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:24 }}>
          <button onClick={() => navigate("/dashboard")}
            style={{ padding:"13px 40px", background:"#2563eb", color:"#fff",
              border:"none", borderRadius:10, cursor:"pointer",
              fontSize:14, fontWeight:600 }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ExamPage ──────────────────────────────────────────────────────────
export default function ExamPage() {
  const { id: examId } = useParams()
  const navigate = useNavigate()

  const [exam,        setExam]        = useState(null)
  const [attempt,     setAttempt]     = useState(null)
  const [questions,   setQuestions]   = useState([])
  const [answers,     setAnswers]     = useState({})
  const [phase,       setPhase]       = useState("loading")
  const [timeLeft,    setTimeLeft]    = useState(null)
  const [activeAlert, setActiveAlert] = useState(null)
  const [connected,   setConnected]   = useState(false)
  const [analysis,    setAnalysis]    = useState(null)
  const [vCount,      setVCount]      = useState(0)
  const [alerts,      setAlerts]      = useState([])
  const [saving,      setSaving]      = useState(false)
  const [recording,   setRecording]   = useState(false)
  const [camError,    setCamError]    = useState("")

  const videoRef      = useRef(null)
  const canvasRef     = useRef(null)
  const streamRef     = useRef(null)
  const mediaRecRef   = useRef(null)
  const wsRef         = useRef(null)
  const frameTimer    = useRef(null)
  const snapTimer     = useRef(null)
  const countdown     = useRef(null)
  const attemptRef    = useRef(null)
  const answersRef    = useRef({})
  const questionsRef  = useRef([])

  useEffect(() => { attemptRef.current  = attempt   }, [attempt])
  useEffect(() => { answersRef.current  = answers   }, [answers])
  useEffect(() => { questionsRef.current = questions }, [questions])

  // Load exam
  useEffect(() => {
    api.get(`/exams/${examId}/`)
      .then(r => { setExam(r.data); setPhase("setup") })
      .catch(() => { toast.error("Exam not found"); navigate("/dashboard") })
  }, [examId])

  // Countdown timer
  useEffect(() => {
    if (phase !== "exam" || !exam) return
    setTimeLeft(exam.duration * 60)
    countdown.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(countdown.current); finishExam(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(countdown.current)
  }, [phase, exam])

  // Screen monitoring
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && attemptRef.current) {
        api.post("/violation/", {
          exam_id: parseInt(examId), attempt_id: attemptRef.current.id,
          violation_type: "tab_switch",
        }).catch(() => {})
        toast.error("⚠ Tab switch detected!")
      }
    }
    const onFS = () => {
      if (!document.fullscreenElement && attemptRef.current) {
        api.post("/violation/", {
          exam_id: parseInt(examId), attempt_id: attemptRef.current.id,
          violation_type: "fullscreen_exit",
        }).catch(() => {})
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
    }
    const block = e => { e.preventDefault(); toast.error("Not allowed during exam.") }
    document.addEventListener("visibilitychange", onHide)
    document.addEventListener("fullscreenchange", onFS)
    document.addEventListener("copy",        block)
    document.addEventListener("paste",       block)
    document.addEventListener("contextmenu", e => e.preventDefault())
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      document.removeEventListener("fullscreenchange", onFS)
      document.removeEventListener("copy",        block)
      document.removeEventListener("paste",       block)
    }
  }, [examId])

  // WebSocket connection
  const connectWS = useCallback((eid) => {
    try {
      const ws = new WebSocket(`${WS_BASE}/ws/proctor/${eid}/`)
      wsRef.current = ws
      ws.onopen  = () => setConnected(true)
      ws.onclose = () => { setConnected(false); setTimeout(() => connectWS(eid), 3000) }
      ws.onerror = () => {}
      ws.onmessage = ({ data }) => {
        try {
          const msg = JSON.parse(data)
          if (msg.type === "frame_analysis") {
            setAnalysis(msg)
            // Phone detection → immediate alert popup
            if ((msg.objects_detected || []).some(o => o.includes("phone"))) {
              setActiveAlert({
                action:  "phone_detected",
                message: "📱 A mobile phone was detected by the camera. This is a serious violation. Remove the phone immediately.",
              })
            }
          }
          if (msg.type === "violation_alert") {
            setVCount(msg.count)
            setAlerts(p => [msg, ...p].slice(0, 10))
            if (["show_warning","mark_suspicious"].includes(msg.action)) setActiveAlert(msg)
            if (msg.action === "auto_submit") {
              setActiveAlert(msg)
              setTimeout(() => finishExam(true), 3500)
            }
          }
        } catch {}
      }
    } catch {}
  }, [])

  // Send frame to WebSocket
  const sendFrame = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return
    if (!videoRef.current || !canvasRef.current) return
    const c = canvasRef.current
    const ctx = c.getContext("2d")
    c.width = 640; c.height = 480
    ctx.drawImage(videoRef.current, 0, 0, 640, 480)
    wsRef.current.send(JSON.stringify({
      type: "video_frame",
      data: c.toDataURL("image/jpeg", 0.7),
      attempt_id: attemptRef.current?.id,
    }))
  }, [])

  // Upload snapshot every 30s
  const uploadSnap = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !attemptRef.current) return
    const c = canvasRef.current
    const ctx = c.getContext("2d")
    c.width = 640; c.height = 480
    ctx.drawImage(videoRef.current, 0, 0, 640, 480)
    c.toBlob(blob => {
      if (!blob) return
      const fd = new FormData()
      fd.append("attempt_id", attemptRef.current.id)
      fd.append("image",      blob, `snap_${Date.now()}.jpg`)
      fd.append("note",       `auto_${new Date().toISOString()}`)
      api.post("/upload-frame/", fd, { headers:{ "Content-Type":"multipart/form-data" } }).catch(() => {})
    }, "image/jpeg", 0.75)
  }, [])

  // Start MediaRecorder for video recording
  const startRecording = useCallback((stream) => {
    if (!window.MediaRecorder) return
    try {
      const opts = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? { mimeType:"video/webm;codecs=vp9" }
        : MediaRecorder.isTypeSupported("video/webm") ? { mimeType:"video/webm" } : {}
      const rec = new MediaRecorder(stream, opts)
      mediaRecRef.current = rec
      let chunks = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      rec.onstop = () => {
        if (!chunks.length || !attemptRef.current) return
        const blob = new Blob(chunks, { type: rec.mimeType || "video/webm" })
        const fd   = new FormData()
        fd.append("attempt_id", attemptRef.current.id)
        fd.append("image", blob, `rec_${Date.now()}.webm`)
        fd.append("note",  `video_${new Date().toISOString()}`)
        api.post("/upload-frame/", fd, { headers:{ "Content-Type":"multipart/form-data" } }).catch(() => {})
        chunks = []
      }
      rec.start()
      setRecording(true)
      // Upload chunk every 60s
      const t = setInterval(() => {
        if (rec.state === "recording") {
          rec.stop()
          setTimeout(() => { if (attemptRef.current) rec.start() }, 200)
        }
      }, 60000)
      mediaRecRef._ct = t
    } catch (e) { console.warn("MediaRecorder:", e) }
  }, [])

  // Start exam
  const handleStart = async () => {
    try {
      const { data: att } = await api.post("/start-exam/", { exam_id: parseInt(examId) })
      setAttempt(att); attemptRef.current = att

      const qRes = await api.get(`/questions/?exam_id=${examId}`)
      const qs   = qRes.data.results || qRes.data
      setQuestions(qs); questionsRef.current = qs

      // Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width:{ ideal:1280 }, height:{ ideal:720 }, facingMode:"user" },
          audio: true,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        startRecording(stream)
        setCamError("")
      } catch (err) {
        const msg = err.name === "NotAllowedError"
          ? "Camera blocked — allow camera in browser settings."
          : err.name === "NotFoundError"
            ? "No camera found. Exam continues without camera proctoring."
            : `Camera error: ${err.message}`
        setCamError(msg)
        toast.error(msg)
      }

      connectWS(examId)
      frameTimer.current = setInterval(sendFrame, 2000)
      snapTimer.current  = setInterval(uploadSnap, 30000)
      document.documentElement.requestFullscreen?.().catch(() => {})
      setPhase("exam")
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not start exam. Try again.")
    }
  }

  // Save one answer to backend
  const saveAnswer = async (qId) => {
    const ans = answersRef.current[qId]
    if (!ans || !attemptRef.current) return
    api.post("/submit-answer/", {
      attempt_id:  attemptRef.current.id,
      question_id: qId,
      choice_id:   ans.choice_id   || null,
      text_answer: ans.text_answer || "",
    }).catch(() => {})
  }

  const handleAnswer = (qId, val) => {
    setAnswers(p => ({ ...p, [qId]: { ...p[qId], ...val } }))
    setTimeout(() => saveAnswer(qId), 500)
  }

  // Finish exam
  const finishExam = useCallback(async (auto = false) => {
    clearInterval(countdown.current)
    clearInterval(frameTimer.current)
    clearInterval(snapTimer.current)
    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
      clearInterval(mediaRecRef._ct)
      mediaRecRef.current.stop()
    }
    setRecording(false)
    streamRef.current?.getTracks().forEach(t => t.stop())
    wsRef.current?.close()
    setConnected(false)
    setSaving(true)

    const att = attemptRef.current
    if (att) {
      for (const q of questionsRef.current) { await saveAnswer(q.id) }
      try { await api.post("/submit-exam/",     { attempt_id: att.id }) } catch {}
      try { await api.post("/finalise-result/", { attempt_id: att.id }) } catch {}
    }
    setSaving(false)
    setPhase("submitted")
    if (!auto) toast.success("Exam submitted successfully!")
  }, [])

  const fmt = s => s == null ? "--:--"
    : `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`

  // ── Render phases ────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex",
      alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:36, height:36, border:"3px solid var(--border)",
        borderTopColor:"var(--accent)", borderRadius:"50%",
        animation:"spin 0.8s linear infinite" }} />
    </div>
  )

  if (phase === "submitted") return (
    <SubmittedScreen attemptId={attempt?.id} navigate={navigate} />
  )

  if (phase === "setup") return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ maxWidth:500, width:"100%", background:"var(--bg2)",
        border:"1px solid var(--border)", borderRadius:18, padding:34 }}>
        <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:21, fontWeight:700, marginBottom:6 }}>
          {exam?.title}
        </h2>
        <p style={{ color:"var(--muted)", fontSize:14, marginBottom:20 }}>
          {exam?.description || "No description."}
        </p>
        <div style={{ background:"var(--bg3)", borderRadius:10, padding:16, marginBottom:24 }}>
          <p style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Before you start:</p>
          {[
            "Camera and microphone access required.",
            `Duration: ${exam?.duration} minutes.`,
            "Tab switching and copy/paste are disabled.",
            "Using a mobile phone will be detected immediately.",
            "Webcam recorded every 30 seconds for admin review.",
            "7 violations will auto-submit your exam.",
          ].map((r, i) => (
            <p key={i} style={{ fontSize:13, color:"var(--muted)", marginBottom:6 }}>• {r}</p>
          ))}
        </div>
        {camError && (
          <div style={{ padding:12, borderRadius:8, background:"rgba(239,68,68,0.1)",
            border:"1px solid rgba(239,68,68,0.3)", marginBottom:16 }}>
            <p style={{ fontSize:13, color:"#f87171" }}>{camError}</p>
          </div>
        )}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => navigate("/dashboard")}
            style={{ flex:1, padding:"12px 0", background:"transparent",
              border:"1px solid var(--border)", color:"var(--text)",
              borderRadius:10, cursor:"pointer", fontSize:13 }}>
            Cancel
          </button>
          <button onClick={handleStart}
            style={{ flex:2, padding:"12px 0", background:"#2563eb", color:"#fff",
              border:"none", borderRadius:10, cursor:"pointer",
              fontSize:13, fontWeight:600 }}>
            Start Exam →
          </button>
        </div>
      </div>
    </div>
  )

  // Exam in progress
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex",
      flexDirection:"column", userSelect:"none" }}
      onContextMenu={e => e.preventDefault()}>

      {activeAlert && <AlertModal alert={activeAlert} onDismiss={() => setActiveAlert(null)} />}
      <canvas ref={canvasRef} style={{ display:"none" }} />

      {/* Header */}
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"11px 20px", borderBottom:"1px solid var(--border)",
        background:"rgba(12,21,37,0.96)", backdropFilter:"blur(12px)",
        position:"sticky", top:0, zIndex:40 }}>
        <div>
          <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:600 }}>
            {exam?.title}
          </h1>
          <p style={{ fontSize:11, color:"var(--muted)" }}>
            {Object.keys(answers).length}/{questions.length} answered
            {recording && <span style={{ color:"#ef4444", marginLeft:8 }}>● Recording</span>}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontFamily:"monospace", fontSize:20, fontWeight:700,
            color: timeLeft < 300 ? "#ef4444" : "var(--text)" }}>
            ⏱ {fmt(timeLeft)}
          </div>
          <div style={{ fontSize:12, color:"#ef4444", fontWeight:600 }}>
            Violations: {vCount}/7
          </div>
          <button
            onClick={() => { if (window.confirm("Submit exam now? This cannot be undone.")) finishExam(false) }}
            disabled={saving}
            style={{ padding:"8px 18px", background:"#2563eb", color:"#fff",
              border:"none", borderRadius:8, cursor:"pointer",
              fontSize:13, fontWeight:500, opacity:saving?0.6:1 }}>
            {saving ? "Submitting…" : "Submit Exam"}
          </button>
        </div>
      </header>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* Questions */}
        <main style={{ flex:1, padding:"20px 24px", overflowY:"auto" }}>
          <div style={{ maxWidth:720, margin:"0 auto" }}>
            {questions.length === 0 && (
              <div style={{ textAlign:"center", padding:60, color:"var(--muted)" }}>
                <div style={{ fontSize:36, marginBottom:12 }}>📝</div>
                <p>No questions have been added to this exam yet.</p>
              </div>
            )}
            {questions.map(q => (
              <QuestionCard key={q.id} q={q}
                answer={answers[q.id]}
                onChange={val => handleAnswer(q.id, val)} />
            ))}
            {questions.length > 0 && (
              <div style={{ textAlign:"center", marginTop:8, marginBottom:28 }}>
                <button
                  onClick={() => { if (window.confirm("Submit exam now?")) finishExam(false) }}
                  disabled={saving}
                  style={{ padding:"13px 44px", background:"#2563eb", color:"#fff",
                    border:"none", borderRadius:10, cursor:"pointer",
                    fontSize:14, fontWeight:600, opacity:saving?0.6:1 }}>
                  {saving ? "Submitting…" : "Submit Exam →"}
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside style={{ width:255, borderLeft:"1px solid var(--border)",
          padding:12, overflowY:"auto", flexShrink:0 }}>
          <WebcamPanel
            videoRef={videoRef} connected={connected} analysis={analysis}
            vCount={vCount} alerts={alerts} recording={recording}
          />
          {questions.length > 0 && (
            <div style={{ background:"var(--bg2)", border:"1px solid var(--border)",
              borderRadius:12, padding:10, marginTop:10 }}>
              <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase",
                letterSpacing:1, marginBottom:8 }}>Progress</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {questions.map((q, i) => (
                  <div key={q.id} style={{ width:28, height:28, borderRadius:6,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    cursor:"pointer", fontSize:11, fontWeight:600,
                    background:  answers[q.id] ? "rgba(59,130,246,0.3)" : "var(--bg3)",
                    border:`1px solid ${answers[q.id] ? "rgba(59,130,246,0.5)" : "var(--border)"}`,
                    color:       answers[q.id] ? "#60a5fa" : "var(--muted)" }}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:"var(--muted)", marginTop:7 }}>
                Blue = answered · {Object.keys(answers).length}/{questions.length}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
