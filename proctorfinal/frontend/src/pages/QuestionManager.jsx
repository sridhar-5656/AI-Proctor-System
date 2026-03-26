/**
 * QuestionManager.jsx
 * Admin page: create/edit/delete questions + grade student answers
 * Route: /admin/questions/:examId
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

const S = {
  page:  { minHeight:"100vh", background:"var(--bg)", padding:"24px 16px", fontFamily:"DM Sans,sans-serif" },
  card:  { background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:14, padding:22, marginBottom:16 },
  label: { display:"block", fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:500 },
  inp:   { width:"100%", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8,
           padding:"10px 12px", fontSize:13, color:"var(--text)", outline:"none", fontFamily:"inherit",
           transition:"border-color 0.2s" },
}

const BLANK = {
  text:"", qtype:"mcq", marks:1, order:1, model_answer:"",
  choices:[
    { text:"", is_correct:true  },
    { text:"", is_correct:false },
    { text:"", is_correct:false },
    { text:"", is_correct:false },
  ]
}

// ── Answer grading panel ──────────────────────────────────────────────────
function AnswerPanel({ question, onClose }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [marks,   setMarks]   = useState({})
  const [saving,  setSaving]  = useState({})

  const load = () => {
    setLoading(true)
    api.get(`/answers/?question_id=${question.id}`)
      .then(r => {
        const list = r.data.results || r.data
        setAnswers(list)
        const m = {}
        list.forEach(a => { m[a.id] = String(a.marks_obtained) })
        setMarks(m)
      })
      .catch(() => toast.error("Failed to load answers"))
      .finally(() => setLoading(false))
  }
  useEffect(load, [question.id])

  const saveMarks = async (answer) => {
    const val = parseFloat(marks[answer.id])
    if (isNaN(val) || val < 0)   { toast.error("Enter a valid number (0 or above)"); return }
    if (val > question.marks)     { toast.error(`Max marks is ${question.marks}`); return }
    setSaving(p => ({ ...p, [answer.id]: true }))
    try {
      await api.post("/grade-answer/", { answer_id: answer.id, marks: val })
      toast.success("Marks saved! Student can now see the result.")
      load()
    } catch (e) { toast.error(e.response?.data?.error || "Save failed") }
    finally { setSaving(p => ({ ...p, [answer.id]: false })) }
  }

  const toggleTF = async (answer) => {
    const newCorrect = !answer.is_correct
    const newMarks   = newCorrect ? question.marks : 0
    setSaving(p => ({ ...p, [answer.id]: true }))
    try {
      await api.post("/grade-answer/", { answer_id: answer.id, marks: newMarks, is_correct: newCorrect })
      toast.success(newCorrect ? "Marked correct!" : "Marked wrong!")
      load()
    } catch (e) { toast.error(e.response?.data?.error || "Update failed") }
    finally { setSaving(p => ({ ...p, [answer.id]: false })) }
  }

  const pending = question.qtype === "short" ? answers.filter(a => !a.graded_by_admin).length : 0

  return (
    <div style={{ marginTop:16, borderTop:"1px solid var(--border)", paddingTop:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <h4 style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:600, margin:0 }}>
            Student Answers
          </h4>
          <p style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>
            {answers.length} answered · {answers.filter(a=>a.is_correct).length} correct
            {pending > 0 && <span style={{ color:"#f59e0b", marginLeft:8 }}>· {pending} pending grading</span>}
          </p>
        </div>
        <button onClick={onClose}
          style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
      </div>

      {/* Model answer reference for short questions */}
      {question.qtype === "short" && question.model_answer && (
        <div style={{ padding:12, borderRadius:8, background:"rgba(16,185,129,0.08)",
          border:"1px solid rgba(16,185,129,0.2)", marginBottom:14 }}>
          <p style={{ fontSize:11, color:"#34d399", fontWeight:600, marginBottom:4 }}>
            MODEL ANSWER (your expected answer — student sees this after grading):
          </p>
          <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.6 }}>{question.model_answer}</p>
        </div>
      )}

      {loading && <p style={{ color:"var(--muted)", fontSize:13, padding:"12px 0" }}>Loading…</p>}
      {!loading && answers.length === 0 && (
        <p style={{ color:"var(--muted)", fontSize:13, padding:"16px 0" }}>
          No students have answered this question yet.
        </p>
      )}

      {answers.map(ans => (
        <div key={ans.id} style={{
          background:"var(--bg3)", borderRadius:10, padding:16, marginBottom:10,
          border:`1px solid ${
            ans.is_correct ? "rgba(16,185,129,0.3)"
            : ans.graded_by_admin ? "rgba(239,68,68,0.3)"
            : "rgba(100,116,139,0.2)"}`,
        }}>
          <div style={{ display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:13, fontWeight:600 }}>
                  {ans.student_name || `Student #${ans.attempt}`}
                </span>
                <span style={{
                  fontSize:11, padding:"2px 8px", borderRadius:10, fontWeight:600,
                  background: ans.is_correct ? "rgba(16,185,129,0.15)"
                    : ans.graded_by_admin ? "rgba(239,68,68,0.15)"
                    : "rgba(100,116,139,0.15)",
                  color: ans.is_correct ? "#34d399"
                    : ans.graded_by_admin ? "#f87171"
                    : "#94a3b8",
                }}>
                  {ans.is_correct ? "✓ Correct" : ans.graded_by_admin ? "✗ Wrong" : "⏳ Pending"}
                </span>
                <span style={{ fontSize:11, color:"var(--muted)" }}>
                  {ans.marks_obtained} / {question.marks} marks
                </span>
                {ans.graded_by_admin && (
                  <span style={{ fontSize:10, padding:"1px 6px", borderRadius:8,
                    background:"rgba(59,130,246,0.15)", color:"#60a5fa" }}>graded</span>
                )}
              </div>

              {question.qtype === "short" ? (
                <div>
                  <p style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>Student wrote:</p>
                  <div style={{ fontSize:13, color:"var(--text)", background:"var(--bg2)",
                    borderRadius:6, padding:"10px 12px", border:"1px solid var(--border)",
                    lineHeight:1.7, minHeight:38 }}>
                    {ans.text_answer
                      ? ans.text_answer
                      : <span style={{ color:"var(--muted)", fontStyle:"italic" }}>(not answered)</span>
                    }
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>Selected:</p>
                  <p style={{ fontSize:13 }}>
                    {ans.selected_text
                      ? ans.selected_text
                      : <span style={{ color:"var(--muted)", fontStyle:"italic" }}>(not answered)</span>
                    }
                  </p>
                  {ans.correct_answer && (
                    <p style={{ fontSize:12, color:"#34d399", marginTop:5 }}>
                      Correct: <strong>{ans.correct_answer}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Grading controls */}
            <div style={{ flexShrink:0, minWidth:200 }}>
              {/* SHORT ANSWER — admin sets marks + 0 by default */}
              {question.qtype === "short" && (
                <div>
                  <label style={{ ...S.label, fontSize:11 }}>
                    Assign marks (0 – {question.marks}) — marks start at 0 until graded
                  </label>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <input
                      type="number" min="0" max={question.marks} step="0.5"
                      value={marks[ans.id] ?? "0"}
                      onChange={e => setMarks(p => ({ ...p, [ans.id]: e.target.value }))}
                      style={{ ...S.inp, width:80, padding:"7px 10px", fontSize:14, textAlign:"center" }}
                    />
                    <button onClick={() => saveMarks(ans)} disabled={saving[ans.id]}
                      style={{ padding:"7px 16px", borderRadius:7, border:"none",
                        background:"#2563eb", color:"#fff", cursor:"pointer",
                        fontSize:12, fontWeight:600, opacity:saving[ans.id]?0.6:1, whiteSpace:"nowrap" }}>
                      {saving[ans.id] ? "Saving…" : "Save Marks"}
                    </button>
                  </div>
                  <p style={{ fontSize:10, color:"var(--muted)", marginTop:4 }}>
                    Student sees model answer + result immediately after you save.
                  </p>
                </div>
              )}

              {/* TRUE/FALSE — toggle override */}
              {question.qtype === "true_false" && (
                <div>
                  <label style={{ ...S.label, fontSize:11 }}>Override auto-grading</label>
                  <button onClick={() => toggleTF(ans)} disabled={saving[ans.id]}
                    style={{ padding:"7px 16px", borderRadius:7, border:"none",
                      cursor:"pointer", fontSize:12, fontWeight:600,
                      opacity:saving[ans.id]?0.6:1, whiteSpace:"nowrap",
                      background: ans.is_correct ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                      color:      ans.is_correct ? "#f87171" : "#34d399" }}>
                    {saving[ans.id] ? "Saving…" : ans.is_correct ? "✗ Mark Wrong" : "✓ Mark Correct"}
                  </button>
                  <p style={{ fontSize:10, color:"var(--muted)", marginTop:4 }}>
                    Auto-graded. Override only if needed.
                  </p>
                </div>
              )}

              {/* MCQ — auto graded */}
              {question.qtype === "mcq" && (
                <div style={{ padding:"8px 12px", borderRadius:7, fontSize:12,
                  background: ans.is_correct ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  color:      ans.is_correct ? "#34d399" : "#f87171",
                  border:`1px solid ${ans.is_correct ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                  MCQ auto-graded<br />
                  <span style={{ fontSize:10, opacity:0.7 }}>No manual action needed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main QuestionManager ──────────────────────────────────────────────────
export default function QuestionManager() {
  const { examId } = useParams()
  const navigate   = useNavigate()
  const [questions,   setQs]      = useState([])
  const [form,        setForm]    = useState({ ...BLANK, choices: BLANK.choices.map(c => ({ ...c })) })
  const [editId,      setEditId]  = useState(null)
  const [busy,        setBusy]    = useState(false)
  const [examName,    setName]    = useState("")
  const [openAnswers, setOpenAns] = useState(null)

  const load = () => {
    api.get(`/questions/?exam_id=${examId}`)
      .then(r => setQs(r.data.results || r.data))
      .catch(() => toast.error("Failed to load questions"))
    api.get(`/exams/${examId}/`).then(r => setName(r.data.title)).catch(() => {})
  }
  useEffect(load, [examId])

  const setChoice = (i, key, val) => {
    const c = form.choices.map((x, j) => ({
      ...x,
      is_correct: key === "is_correct" ? j === i : x.is_correct,
      text:       key === "text" && j === i ? val : x.text,
    }))
    setForm({ ...form, choices: c })
  }

  const resetForm = () => {
    setForm({ ...BLANK, choices: BLANK.choices.map(c => ({ ...c })) })
    setEditId(null)
  }

  const save = async () => {
    if (!form.text.trim()) { toast.error("Question text is required"); return }
    if (form.qtype !== "short") {
      const filled = form.choices.filter(c => c.text.trim())
      if (filled.length < 2)               { toast.error("Add at least 2 answer choices"); return }
      if (!filled.some(c => c.is_correct)) { toast.error("Please mark the correct answer"); return }
    }
    setBusy(true)
    try {
      const payload = {
        ...form,
        exam:    parseInt(examId),
        choices: form.qtype === "short" ? [] : form.choices.filter(c => c.text.trim()),
      }
      if (editId) await api.patch(`/questions/${editId}/`, payload)
      else        await api.post("/questions/", payload)
      toast.success(editId ? "Question updated!" : "Question added!")
      resetForm()
      load()
    } catch (e) {
      const err = e.response?.data
      const msg = typeof err === "object" ? Object.values(err).flat().join(" ") : "Save failed"
      toast.error(msg)
    } finally { setBusy(false) }
  }

  const del = async (id) => {
    if (!window.confirm("Delete this question?")) return
    await api.delete(`/questions/${id}/`).catch(() => {})
    toast.success("Question deleted")
    if (openAnswers === id) setOpenAns(null)
    load()
  }

  const startEdit = (q) => {
    setEditId(q.id)
    setForm({
      text: q.text, qtype: q.qtype, marks: q.marks, order: q.order,
      model_answer: q.model_answer || "",
      choices: q.choices?.length
        ? q.choices.map(c => ({ text: c.text, is_correct: c.is_correct }))
        : BLANK.choices.map(c => ({ ...c })),
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0)

  return (
    <div style={S.page}>
      <div style={{ maxWidth:860, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24, flexWrap:"wrap" }}>
          <button onClick={() => navigate("/admin")}
            style={{ padding:"8px 16px", borderRadius:8, border:"1px solid var(--border)",
              background:"transparent", color:"var(--text)", cursor:"pointer", fontSize:13 }}>
            ← Admin
          </button>
          <div>
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:700, margin:0 }}>
              Question Manager
            </h2>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>
              {examName} · {questions.length} questions · {totalMarks} total marks
            </p>
          </div>
        </div>

        {/* Add / Edit form */}
        <div style={S.card}>
          <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:600, marginBottom:18 }}>
            {editId ? "✏️ Edit Question" : "➕ Add New Question"}
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Question text */}
            <div>
              <label style={S.label}>Question Text *</label>
              <textarea style={{ ...S.inp, minHeight:72, resize:"vertical" }}
                placeholder="Type the full question here…"
                value={form.text}
                onChange={e => setForm({ ...form, text: e.target.value })} />
            </div>

            {/* Type / Marks / Order */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:160 }}>
                <label style={S.label}>Question Type</label>
                <select style={S.inp} value={form.qtype}
                  onChange={e => setForm({ ...form, qtype: e.target.value })}>
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="true_false">True / False</option>
                  <option value="short">Short Answer</option>
                </select>
              </div>
              <div style={{ width:110 }}>
                <label style={S.label}>Marks *</label>
                <input style={S.inp} type="number" min="1" value={form.marks}
                  onChange={e => setForm({ ...form, marks: parseInt(e.target.value) || 1 })} />
              </div>
              <div style={{ width:110 }}>
                <label style={S.label}>Order No.</label>
                <input style={S.inp} type="number" min="1" value={form.order}
                  onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 1 })} />
              </div>
            </div>

            {/* MCQ / True-False choices */}
            {form.qtype !== "short" && (
              <div>
                <label style={S.label}>
                  Answer Choices — click the radio button to mark the correct answer ✓
                </label>
                {form.choices.map((c, i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
                    <input type="radio" name={`correct_${editId || "new"}`} checked={c.is_correct}
                      onChange={() => setChoice(i, "is_correct", true)}
                      style={{ accentColor:"#10b981", width:18, height:18, cursor:"pointer", flexShrink:0 }} />
                    <input style={{ ...S.inp, flex:1 }}
                      placeholder={`Choice ${i + 1}${i === 0 ? " (tick radio = correct)" : ""}`}
                      value={c.text}
                      onChange={e => setChoice(i, "text", e.target.value)} />
                    {c.is_correct && (
                      <span style={{ fontSize:11, color:"#34d399", fontWeight:700, flexShrink:0 }}>
                        ✓ Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Short Answer — model answer + info */}
            {form.qtype === "short" && (
              <div>
                <label style={S.label}>
                  Model Answer (expected answer — shown to student AFTER exam + grading)
                </label>
                <textarea style={{ ...S.inp, minHeight:60, resize:"vertical" }}
                  placeholder="Type the expected correct answer. Students will see this after you grade their answer."
                  value={form.model_answer}
                  onChange={e => setForm({ ...form, model_answer: e.target.value })} />
                <div style={{ marginTop:8, padding:10, background:"rgba(245,158,11,0.08)",
                  border:"1px solid rgba(245,158,11,0.2)", borderRadius:8 }}>
                  <p style={{ fontSize:12, color:"#fbbf24", lineHeight:1.6 }}>
                    ℹ Short answer marks are <strong>0 by default</strong>.
                    After students submit the exam, click <strong>Answers ▼</strong>
                    on this question, read the student's answer, then type marks and click
                    <strong> Save Marks</strong>. The student will immediately see
                    the model answer and their result.
                  </p>
                </div>
              </div>
            )}

            {/* True/False info */}
            {form.qtype === "true_false" && (
              <div style={{ padding:10, background:"rgba(59,130,246,0.08)",
                border:"1px solid rgba(59,130,246,0.2)", borderRadius:8 }}>
                <p style={{ fontSize:12, color:"#60a5fa" }}>
                  ℹ True/False is <strong>auto-graded</strong> when student selects.
                  Use <strong>Answers ▼</strong> to override if needed.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display:"flex", gap:10, paddingTop:4 }}>
              {editId && (
                <button onClick={resetForm}
                  style={{ padding:"10px 18px", borderRadius:8, border:"1px solid var(--border)",
                    background:"transparent", color:"var(--text)", cursor:"pointer", fontSize:13 }}>
                  Cancel
                </button>
              )}
              <button onClick={save} disabled={busy}
                style={{ padding:"10px 24px", borderRadius:8, border:"none",
                  background:"#2563eb", color:"#fff", cursor:"pointer",
                  fontSize:13, fontWeight:600, opacity: busy ? 0.6 : 1 }}>
                {busy ? "Saving…" : editId ? "Update Question" : "+ Add Question"}
              </button>
            </div>
          </div>
        </div>

        {/* Questions list */}
        <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:16, fontWeight:600, marginBottom:14 }}>
          All Questions ({questions.length})
        </h3>

        {questions.length === 0 && (
          <div style={{ ...S.card, textAlign:"center", color:"var(--muted)", padding:48 }}>
            No questions yet. Add your first question above.
          </div>
        )}

        {questions.map(q => (
          <div key={q.id} style={S.card}>
            <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                {/* Tags */}
                <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:"monospace", fontSize:12, color:"var(--muted)" }}>Q{q.order}</span>
                  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10,
                    background:"rgba(59,130,246,0.15)", color:"#60a5fa" }}>{q.qtype}</span>
                  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10,
                    background:"rgba(16,185,129,0.15)", color:"#34d399" }}>
                    {q.marks} mark{q.marks !== 1 ? "s" : ""}
                  </span>
                  {q.qtype === "short"      && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"rgba(245,158,11,0.15)", color:"#fbbf24" }}>manual grade</span>}
                  {q.qtype === "true_false" && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"rgba(59,130,246,0.1)",  color:"#60a5fa" }}>auto-graded</span>}
                </div>

                {/* Question text */}
                <p style={{ fontSize:14, lineHeight:1.6, marginBottom:10 }}>{q.text}</p>

                {/* Choices */}
                {q.choices?.map(c => (
                  <div key={c.id} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                    <span style={{ width:14, height:14, borderRadius:"50%", flexShrink:0, display:"inline-block",
                      border:`2px solid ${c.is_correct ? "#10b981" : "var(--border)"}`,
                      background: c.is_correct ? "#10b981" : "transparent" }} />
                    <span style={{ fontSize:13, color: c.is_correct ? "#34d399" : "var(--text)" }}>{c.text}</span>
                    {c.is_correct && <span style={{ fontSize:11, color:"#34d399" }}>← correct</span>}
                  </div>
                ))}

                {/* Model answer preview */}
                {q.qtype === "short" && q.model_answer && (
                  <div style={{ marginTop:8, padding:"7px 10px", borderRadius:6,
                    background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)" }}>
                    <span style={{ fontSize:11, color:"#34d399", fontWeight:600 }}>Model answer: </span>
                    <span style={{ fontSize:12, color:"var(--muted)" }}>{q.model_answer}</span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display:"flex", gap:7, flexShrink:0, flexDirection:"column", alignItems:"flex-end" }}>
                <div style={{ display:"flex", gap:7 }}>
                  <button onClick={() => startEdit(q)}
                    style={{ padding:"6px 14px", borderRadius:7, border:"1px solid var(--border)",
                      background:"transparent", color:"#60a5fa", cursor:"pointer", fontSize:12 }}>
                    Edit
                  </button>
                  <button onClick={() => del(q.id)}
                    style={{ padding:"6px 14px", borderRadius:7,
                      border:"1px solid rgba(239,68,68,0.4)",
                      background:"rgba(239,68,68,0.08)", color:"#f87171",
                      cursor:"pointer", fontSize:12 }}>
                    Delete
                  </button>
                </div>
                <button
                  onClick={() => setOpenAns(openAnswers === q.id ? null : q.id)}
                  style={{ padding:"6px 14px", borderRadius:7, cursor:"pointer",
                    fontSize:12, fontWeight:500, width:"100%",
                    border:"1px solid rgba(245,158,11,0.4)",
                    background: openAnswers === q.id ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.08)",
                    color:"#fbbf24" }}>
                  {openAnswers === q.id ? "Hide Answers ▲" : "Answers ▼"}
                </button>
              </div>
            </div>

            {/* Inline answer grading panel */}
            {openAnswers === q.id && (
              <AnswerPanel question={q} onClose={() => setOpenAns(null)} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
