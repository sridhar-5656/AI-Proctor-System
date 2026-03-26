import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import toast from "react-hot-toast"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import useAuthStore from "../store/authStore"
import { examsAPI, violationsAPI, reportsAPI } from "../services/api"

const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6"]

function Nav({ user, onLogout }) {
  return (
    <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"14px 24px",borderBottom:"1px solid var(--border)",
      background:"rgba(12,21,37,0.8)",backdropFilter:"blur(10px)",
      position:"sticky",top:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:8,background:"var(--accent)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span style={{fontFamily:"Syne,sans-serif",fontWeight:600,fontSize:16}}>ProctorAI Admin</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:13,color:"var(--muted)"}}>{user.name}</span>
        <button className="btn btn-ghost" onClick={onLogout}
          style={{padding:"6px 14px",fontSize:12}}>Logout</button>
      </div>
    </header>
  )
}

function StatCard({ label, value, color="var(--accent2)" }) {
  return (
    <div className="card">
      <div style={{fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",
        letterSpacing:1,marginBottom:6}}>{label}</div>
      <div style={{fontSize:30,fontWeight:700,color,fontFamily:"Syne,sans-serif"}}>{value??"-"}</div>
    </div>
  )
}

function ExamModal({ exam, onSave, onClose }) {
  const isEdit = !!exam?.id
  const [form, setForm] = useState(exam || {
    title:"",description:"",duration:60,start_time:"",end_time:"",status:"scheduled"
  })
  const [saving, setSaving] = useState(false)

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (isEdit) await examsAPI.update(exam.id, form)
      else        await examsAPI.create(form)
      toast.success(isEdit ? "Exam updated." : "Exam created.")
      onSave()
    } catch { toast.error("Save failed.") }
    finally { setSaving(false) }
  }

  const fi = (label, key, type="text") => (
    <div key={key}>
      <label style={{display:"block",fontSize:12,color:"var(--muted)",marginBottom:5,fontWeight:500}}>{label}</label>
      <input className="input" type={type} value={form[key]}
        onChange={e=>setForm({...form,[key]:e.target.value})} required />
    </div>
  )

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",
      justifyContent:"center",background:"rgba(5,10,20,0.85)",backdropFilter:"blur(6px)",padding:16}}>
      <div className="card" style={{width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
        <h3 style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,marginBottom:20}}>
          {isEdit?"Edit":"Create"} Exam
        </h3>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          {fi("Title","title")}
          {fi("Duration (minutes)","duration","number")}
          {fi("Start Time","start_time","datetime-local")}
          {fi("End Time","end_time","datetime-local")}
          <div>
            <label style={{display:"block",fontSize:12,color:"var(--muted)",marginBottom:5,fontWeight:500}}>Description</label>
            <textarea className="input" style={{resize:"none",minHeight:70}} value={form.description}
              onChange={e=>setForm({...form,description:e.target.value})} />
          </div>
          <div>
            <label style={{display:"block",fontSize:12,color:"var(--muted)",marginBottom:5,fontWeight:500}}>Status</label>
            <select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
              {["draft","scheduled","active","completed"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{flex:1}}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{flex:2}}>
              {saving?"Saving…":"Save Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TABS = ["overview","exams","violations","logs"]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [tab,        setTab]        = useState("overview")
  const [report,     setReport]     = useState(null)
  const [exams,      setExams]      = useState([])
  const [violations, setViolations] = useState([])
  const [logs,       setLogs]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([reportsAPI.overall(), examsAPI.list(), violationsAPI.list(), violationsAPI.logs()])
      .then(([r,e,v,l]) => {
        setReport(r.data)
        setExams(e.data.results||e.data)
        setViolations(v.data.results||v.data)
        setLogs(l.data.results||l.data)
      })
      .catch(()=>toast.error("Failed to load."))
      .finally(()=>setLoading(false))
  }

  useEffect(load, [])

  const handleLogout  = async ()  => { await logout(); navigate("/login") }
  const handleDelete  = async id  => {
    if (!window.confirm("Delete this exam?")) return
    try { await examsAPI.delete(id); toast.success("Deleted."); load() }
    catch { toast.error("Delete failed.") }
  }

  const sc = s => s==="active"?"var(--success)":s==="scheduled"?"var(--accent)":"var(--muted)"

  const th = {textAlign:"left",padding:"10px 14px",fontSize:11,color:"var(--muted)",
    fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,
    borderBottom:"1px solid var(--border)",background:"var(--bg3)"}
  const td = {padding:"12px 14px",borderBottom:"1px solid rgba(30,58,95,0.3)",fontSize:13}

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      {modal!==null && (
        <ExamModal exam={modal?.id?modal:null}
          onSave={()=>{setModal(null);load()}} onClose={()=>setModal(null)} />
      )}
      <Nav user={user} onLogout={handleLogout} />

      {/* Tabs */}
      <div style={{borderBottom:"1px solid var(--border)",paddingLeft:24,display:"flex",gap:0}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:"12px 18px",border:"none",background:"transparent",cursor:"pointer",
            fontSize:13,fontWeight:500,fontFamily:"DM Sans,sans-serif",textTransform:"capitalize",
            color:tab===t?"var(--accent)":"var(--muted)",
            borderBottom:tab===t?"2px solid var(--accent)":"2px solid transparent",
            transition:"all 0.15s"}}>
            {t}
          </button>
        ))}
      </div>

      <main style={{maxWidth:1100,margin:"0 auto",padding:"28px 20px"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:60,color:"var(--muted)"}}>Loading…</div>
        ) : (
          <div style={{animation:"fadeIn 0.3s ease-out"}}>

            {/* OVERVIEW */}
            {tab==="overview" && report && (
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
                  <StatCard label="Students"   value={report.summary.total_students} />
                  <StatCard label="Exams"      value={report.summary.total_exams} />
                  <StatCard label="Attempts"   value={report.summary.total_attempts} />
                  <StatCard label="Violations" value={report.summary.total_violations} color="var(--warning)" />
                  <StatCard label="Risk Score" value={report.summary.risk_score}
                    color={report.summary.risk_score>50?"var(--danger)":"var(--success)"} />
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16}}>
                  <div className="card">
                    <p style={{fontSize:13,fontWeight:600,marginBottom:14}}>Violations by Type</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={(report.violations_by_type||[]).slice(0,8)}>
                        <XAxis dataKey="type" tick={{fill:"#64748b",fontSize:10}}
                          tickFormatter={v=>v.replace(/_/g," ")} />
                        <YAxis tick={{fill:"#64748b",fontSize:10}} />
                        <Tooltip contentStyle={{background:"#0c1525",border:"1px solid #1e3a5f",
                          borderRadius:8,color:"#e2e8f0"}} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <p style={{fontSize:13,fontWeight:600,marginBottom:14}}>Attempt Status</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={report.attempt_status||[]} dataKey="count" nameKey="status"
                          cx="50%" cy="50%" outerRadius={75}
                          label={({status,percent})=>`${status} ${(percent*100).toFixed(0)}%`}>
                          {(report.attempt_status||[]).map((_,i)=>(
                            <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{background:"#0c1525",border:"1px solid #1e3a5f",
                          borderRadius:8,color:"#e2e8f0"}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card">
                  <p style={{fontSize:13,fontWeight:600,marginBottom:14}}>Top Violators</p>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead><tr>
                      {["Student","Email","Violations"].map(h=>(
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {(report.top_violators||[]).map(v=>(
                        <tr key={v.user__id}>
                          <td style={td}>{v.user__name}</td>
                          <td style={{...td,color:"var(--muted)"}}>{v.user__email}</td>
                          <td style={td}><span className="badge badge-high">{v.total}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* EXAMS */}
            {tab==="exams" && (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <h3 style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:600}}>Exam Management</h3>
                  <button className="btn btn-primary" onClick={()=>setModal({})}>+ New Exam</button>
                </div>
                <div className="card" style={{padding:0,overflow:"hidden"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead><tr>
                      {["Title","Duration","Start Time","Status","Actions"].map(h=>(
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {exams.map(exam=>(
                        <tr key={exam.id}>
                          <td style={{...td,fontWeight:500}}>{exam.title}</td>
                          <td style={{...td,color:"var(--muted)"}}>{exam.duration} min</td>
                          <td style={{...td,color:"var(--muted)",whiteSpace:"nowrap"}}>
                            {format(new Date(exam.start_time),"MMM d, yyyy")}
                          </td>
                          <td style={td}>
                            <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,
                              background:`${sc(exam.status)}22`,color:sc(exam.status)}}>
                              {exam.status}
                            </span>
                          </td>
                          <td style={td}>
                            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                              <button onClick={()=>setModal(exam)}
                                style={{background:"none",border:"none",color:"#60a5fa",
                                  cursor:"pointer",fontSize:12,fontWeight:500}}>Edit</button>
                              <button onClick={()=>handleDelete(exam.id)}
                                style={{background:"none",border:"none",color:"var(--danger)",
                                  cursor:"pointer",fontSize:12,fontWeight:500}}>Delete</button>
                              <button onClick={()=>navigate(`/admin/questions/${exam.id}`)}
                                style={{background:"none",border:"none",color:"#34d399",
                                  cursor:"pointer",fontSize:12,fontWeight:500}}>Questions</button>
                              <button onClick={()=>navigate(`/results/${exam.id}`)}
                                style={{background:"none",border:"none",color:"#f59e0b",
                                  cursor:"pointer",fontSize:12,fontWeight:500}}>Results</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {exams.length===0&&(
                    <p style={{textAlign:"center",padding:40,color:"var(--muted)"}}>No exams yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* VIOLATIONS */}
            {tab==="violations" && (
              <div>
                <h3 style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:600,marginBottom:16}}>
                  Violation Records
                </h3>
                <div className="card" style={{padding:0,overflow:"hidden"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead><tr>
                      {["Student","Exam","Type","Severity","Time"].map(h=>(
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {violations.map(v=>(
                        <tr key={v.id}>
                          <td style={td}>{v.user_name}</td>
                          <td style={{...td,color:"var(--muted)"}}>{v.exam_title}</td>
                          <td style={{...td,fontFamily:"monospace",fontSize:12}}>
                            {v.type.replace(/_/g," ")}
                          </td>
                          <td style={td}><span className={`badge badge-${v.severity}`}>{v.severity}</span></td>
                          <td style={{...td,color:"var(--muted)",fontSize:12,whiteSpace:"nowrap"}}>
                            {format(new Date(v.timestamp),"MMM d, h:mm a")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {violations.length===0&&(
                    <p style={{textAlign:"center",padding:40,color:"var(--muted)"}}>No violations yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* LOGS */}
            {tab==="logs" && (
              <div>
                <h3 style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:600,marginBottom:16}}>System Logs</h3>
                <div className="card" style={{fontFamily:"monospace",fontSize:12,
                  display:"flex",flexDirection:"column",gap:4,maxHeight:"65vh",overflowY:"auto"}}>
                  {logs.map(log=>(
                    <div key={log.id} style={{display:"flex",gap:12,padding:"6px 8px",borderRadius:6,
                      background:log.level==="error"?"rgba(239,68,68,0.08)":
                                 log.level==="warning"?"rgba(245,158,11,0.08)":"transparent",
                      color:log.level==="error"?"var(--danger)":
                            log.level==="warning"?"var(--warning)":"var(--muted)"}}>
                      <span style={{color:"var(--border)",flexShrink:0}}>
                        {format(new Date(log.created_at),"HH:mm:ss")}
                      </span>
                      <span style={{fontWeight:700,textTransform:"uppercase",flexShrink:0,width:60}}>
                        [{log.level}]
                      </span>
                      <span style={{flex:1,wordBreak:"break-word"}}>{log.message}</span>
                    </div>
                  ))}
                  {logs.length===0&&<p style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No logs.</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
