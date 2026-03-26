import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import axios from "axios"
import useAuthStore from "../store/authStore"

const api = axios.create({ baseURL: "/api" })
api.interceptors.request.use(cfg=>{
  const t=localStorage.getItem("access"); if(t) cfg.headers.Authorization=`Bearer ${t}`; return cfg
})

function RankBadge({n}){
  const col=n===1?"#fbbf24":n===2?"#94a3b8":n===3?"#cd7c2f":"var(--muted)"
  return<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
    width:28,height:28,borderRadius:"50%",background:`${col}22`,
    border:`1.5px solid ${col}`,color:col,fontSize:12,fontWeight:700}}>{n}</span>
}

function GradeBadge({g}){
  const col=g==="A+"||g==="A"?"#10b981":g==="B"?"#3b82f6":g==="C"?"#f59e0b":g==="D"?"#f97316":"#ef4444"
  return<span style={{padding:"3px 10px",borderRadius:20,background:`${col}22`,
    color:col,fontSize:13,fontWeight:700}}>{g}</span>
}

function IntBar({v}){
  const col=v>=80?"#10b981":v>=50?"#f59e0b":"#ef4444"
  return(
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:5,background:"var(--bg3)",borderRadius:10,overflow:"hidden"}}>
        <div style={{width:`${v}%`,height:"100%",background:col,borderRadius:10,transition:"width 0.5s"}} />
      </div>
      <span style={{fontSize:11,color:col,fontWeight:600,minWidth:34}}>{v}%</span>
    </div>
  )
}

export default function ExamResults(){
  const { examId } = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const [results,  setResults]   = useState([])
  const [selected, setSelected]  = useState(null)
  const [loading,  setLoading]   = useState(true)
  const [examName, setExamName]  = useState("")
  const [frames,   setFrames]    = useState([])
  const [showFrames,setShowF]    = useState(false)

  // Block students completely
  if(user?.role!=="admin") return(
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",
      alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:52,marginBottom:16}}>🔒</div>
        <h2 style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:700,marginBottom:8}}>
          Access Denied
        </h2>
        <p style={{color:"var(--muted)",marginBottom:20}}>
          Results are only visible to administrators.
        </p>
        <button onClick={()=>navigate("/dashboard")} style={{padding:"10px 24px",borderRadius:8,
          border:"none",background:"#2563eb",color:"#fff",cursor:"pointer",fontSize:13}}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  useEffect(()=>{
    Promise.all([
      api.get(`/leaderboard/?exam_id=${examId}`),
      api.get(`/exams/${examId}/`),
    ]).then(([rRes,eRes])=>{
      setResults(rRes.data.results||rRes.data)
      setExamName(eRes.data.title)
    }).catch(()=>toast.error("Failed to load results"))
    .finally(()=>setLoading(false))
  },[examId])

  const loadFrames=attemptId=>{
    api.get(`/frames/?attempt_id=${attemptId}`)
      .then(r=>{setFrames(r.data.results||r.data);setShowF(true)})
      .catch(()=>toast.error("No frames found"))
  }

  const avg  = results.length?(results.reduce((a,r)=>a+r.percentage,0)/results.length).toFixed(1):0
  const pass = results.length?((results.filter(r=>r.percentage>=50).length/results.length)*100).toFixed(0):0

  const th={textAlign:"left",padding:"10px 14px",fontSize:11,color:"var(--muted)",
    fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,
    borderBottom:"1px solid var(--border)",background:"var(--bg3)"}
  const td={padding:"11px 14px",borderBottom:"1px solid rgba(30,58,95,0.3)",fontSize:13}

  if(loading) return(
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",
      alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"var(--muted)"}}>Loading results…</div>
    </div>
  )

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)",padding:"24px 16px",fontFamily:"DM Sans,sans-serif"}}>
      <div style={{maxWidth:1080,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24,flexWrap:"wrap"}}>
          <button onClick={()=>navigate("/admin")} style={{padding:"8px 16px",borderRadius:8,
            border:"1px solid var(--border)",background:"transparent",color:"var(--text)",
            cursor:"pointer",fontSize:13}}>← Admin</button>
          <div>
            <h2 style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,margin:0}}>
              Results & Leaderboard
            </h2>
            <p style={{color:"var(--muted)",fontSize:13,marginTop:2}}>
              {examName} · {results.length} students
            </p>
          </div>
        </div>

        {/* Summary */}
        {results.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",
            gap:12,marginBottom:18}}>
            {[
              {label:"Students",  value:results.length,         color:"var(--accent2)"},
              {label:"Average",   value:`${avg}%`,              color:"var(--accent2)"},
              {label:"Topper",    value:`${results[0]?.percentage?.toFixed(1)}%`, color:"#fbbf24"},
              {label:"Topper Name",value:results[0]?.student_name?.split(" ")[0], color:"#fbbf24"},
              {label:"Pass Rate", value:`${pass}%`,             color:"#10b981"},
            ].map(({label,value,color})=>(
              <div key={label} style={{background:"var(--bg2)",border:"1px solid var(--border)",
                borderRadius:14,padding:16}}>
                <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",
                  letterSpacing:0.5,marginBottom:4}}>{label}</div>
                <div style={{fontSize:20,fontWeight:700,fontFamily:"Syne,sans-serif",color}}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Detail panel */}
        {selected&&(
          <div style={{background:"var(--bg2)",border:"1px solid rgba(59,130,246,0.3)",
            borderRadius:14,padding:22,marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{fontFamily:"Syne,sans-serif",fontSize:17,fontWeight:700}}>
                {selected.student_name} — Full Report
              </h3>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>loadFrames(selected.attempt)}
                  style={{padding:"6px 14px",borderRadius:7,
                    border:"1px solid rgba(59,130,246,0.3)",background:"rgba(59,130,246,0.1)",
                    color:"#60a5fa",cursor:"pointer",fontSize:12}}>
                  View Recorded Frames
                </button>
                <button onClick={()=>{setSelected(null);setShowF(false);setFrames([])}}
                  style={{background:"none",border:"none",color:"var(--muted)",
                    cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",
              gap:10,marginBottom:16}}>
              {[
                {label:"Score",      value:`${selected.obtained_marks} / ${selected.total_marks}`},
                {label:"Percentage", value:`${selected.percentage}%`},
                {label:"Grade",      value:<GradeBadge g={selected.grade} />},
                {label:"Rank",       value:<RankBadge n={selected.rank} />},
              ].map(({label,value})=>(
                <div key={label} style={{background:"var(--bg3)",borderRadius:10,padding:14}}>
                  <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",marginBottom:6}}>
                    {label}
                  </div>
                  <div style={{fontSize:18,fontWeight:700}}>{value}</div>
                </div>
              ))}
            </div>

            <h4 style={{fontSize:14,fontWeight:600,marginBottom:10}}>Violation Accuracy</h4>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",
              gap:10,marginBottom:12}}>
              {[
                {label:"High (phone/faces)", value:selected.high_violations,   color:"#ef4444"},
                {label:"Medium (gaze/tab)",  value:selected.medium_violations,  color:"#f59e0b"},
                {label:"Low (no face)",      value:selected.low_violations,     color:"#64748b"},
                {label:"Risk Score",         value:selected.risk_score,         color:"#f97316"},
              ].map(({label,value,color})=>(
                <div key={label} style={{background:"var(--bg3)",borderRadius:10,padding:12,
                  borderLeft:`3px solid ${color}`}}>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>{label}</div>
                  <div style={{fontSize:20,fontWeight:700,color}}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>
                Integrity Score (100=clean exam, 0=many violations)
              </div>
              <IntBar v={selected.integrity_score} />
            </div>

            {selected.attempt_status!=="completed"&&(
              <div style={{marginTop:12,padding:12,borderRadius:8,
                background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.3)"}}>
                <span style={{fontSize:13,color:"#fbbf24"}}>
                  ⚠ Status: <strong>{selected.attempt_status?.replace(/_/g," ")}</strong>
                  {selected.attempt_status==="auto_submitted"&&" — Auto-submitted due to violations."}
                  {selected.attempt_status==="suspicious"&&" — Flagged as suspicious."}
                </span>
              </div>
            )}

            {showFrames&&(
              <div style={{marginTop:16}}>
                <h4 style={{fontSize:14,fontWeight:600,marginBottom:10}}>
                  Recorded Webcam Frames ({frames.length})
                </h4>
                {frames.length===0&&<p style={{color:"var(--muted)",fontSize:13}}>No frames recorded.</p>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
                  {frames.map(f=>(
                    <div key={f.id} style={{borderRadius:8,overflow:"hidden",border:"1px solid var(--border)"}}>
                      <img src={f.image} alt="frame" style={{width:"100%",height:110,objectFit:"cover",display:"block"}} />
                      <div style={{padding:"5px 8px",fontSize:11,color:"var(--muted)",background:"var(--bg3)"}}>
                        {new Date(f.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard table */}
        <div style={{background:"var(--bg2)",border:"1px solid var(--border)",
          borderRadius:14,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>
                {["Rank","Student","Score","%","Grade","Integrity","H/M/L Violations","Status",""].map(h=>(
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.length===0&&(
                <tr><td colSpan={9} style={{...td,textAlign:"center",color:"var(--muted)",padding:48}}>
                  No results yet. Students need to submit the exam first.
                </td></tr>
              )}
              {results.map(r=>(
                <tr key={r.id} style={{cursor:"pointer"}} onClick={()=>setSelected(r)}>
                  <td style={td}><RankBadge n={r.rank||"—"} /></td>
                  <td style={td}>
                    <div style={{fontWeight:500}}>{r.student_name}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>{r.student_email}</div>
                  </td>
                  <td style={{...td,fontFamily:"monospace"}}>{r.obtained_marks}/{r.total_marks}</td>
                  <td style={{...td,fontWeight:600,color:r.percentage>=50?"#10b981":"#ef4444"}}>
                    {r.percentage?.toFixed(1)}%
                  </td>
                  <td style={td}><GradeBadge g={r.grade} /></td>
                  <td style={{...td,minWidth:130}}><IntBar v={r.integrity_score} /></td>
                  <td style={td}>
                    <span style={{color:"#ef4444",fontSize:12}}>H:{r.high_violations} </span>
                    <span style={{color:"#f59e0b",fontSize:12}}>M:{r.medium_violations} </span>
                    <span style={{color:"#94a3b8",fontSize:12}}>L:{r.low_violations}</span>
                  </td>
                  <td style={td}>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,fontWeight:600,
                      background:r.attempt_status==="completed"?"rgba(16,185,129,0.15)":
                                 r.attempt_status==="suspicious"?"rgba(245,158,11,0.15)":"rgba(239,68,68,0.15)",
                      color:r.attempt_status==="completed"?"#34d399":
                            r.attempt_status==="suspicious"?"#fbbf24":"#f87171"}}>
                      {r.attempt_status?.replace(/_/g," ")}
                    </span>
                  </td>
                  <td style={td}>
                    <button onClick={e=>{e.stopPropagation();setSelected(r)}}
                      style={{padding:"5px 12px",borderRadius:6,
                        border:"1px solid rgba(59,130,246,0.3)",
                        background:"rgba(59,130,246,0.1)",color:"#60a5fa",
                        cursor:"pointer",fontSize:12}}>Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
